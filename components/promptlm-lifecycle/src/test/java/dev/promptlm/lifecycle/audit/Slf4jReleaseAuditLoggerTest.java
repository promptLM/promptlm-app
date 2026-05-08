/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.lifecycle.audit;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the actual SLF4J log entry shape produced by {@link Slf4jReleaseAuditLogger}.
 *
 * <p>Attaches a Logback {@link ListAppender} to the dedicated audit logger and asserts that
 * each {@link ReleaseAuditEvent} produces exactly one log entry with the expected structured
 * fields. Also asserts the log-injection guard: CR/LF in {@code promptSpecId} surfaces in the
 * captured key-value pair as-is rather than forging a separate entry.
 */
class Slf4jReleaseAuditLoggerTest {

    private Logger auditLogger;
    private ListAppender<ILoggingEvent> appender;
    private Slf4jReleaseAuditLogger sut;

    @BeforeEach
    void setUp() {
        auditLogger = (Logger) LoggerFactory.getLogger(Slf4jReleaseAuditLogger.AUDIT_LOGGER_NAME);
        auditLogger.setLevel(Level.INFO);
        appender = new ListAppender<>();
        appender.start();
        auditLogger.addAppender(appender);
        sut = new Slf4jReleaseAuditLogger();
    }

    @AfterEach
    void tearDown() {
        auditLogger.detachAppender(appender);
        appender.stop();
    }

    private Map<String, Object> kvOf(ILoggingEvent event) {
        // Manual accumulation tolerates null values — Collectors.toMap throws NPE on nulls.
        Map<String, Object> map = new HashMap<>();
        event.getKeyValuePairs().forEach(p -> map.put(p.key, p.value));
        return map;
    }

    @Test
    void recordEmitsOneEntryWithEveryFieldOnSuccess() {
        ReleaseAuditEvent event = ReleaseAuditEvent.forSuccess(
                ReleaseAuditOutcome.RELEASED,
                "group/name",
                "direct",
                null,
                "corr-1",
                null,
                null);

        sut.record(event);

        assertThat(appender.list).hasSize(1);
        ILoggingEvent entry = appender.list.get(0);
        assertThat(entry.getLevel()).isEqualTo(Level.INFO);
        assertThat(entry.getMessage()).isEqualTo(Slf4jReleaseAuditLogger.AUDIT_MESSAGE);

        Map<String, Object> kv = kvOf(entry);
        assertThat(kv).containsEntry("outcome", "RELEASED");
        assertThat(kv).containsEntry("promptSpecId", "group/name");
        assertThat(kv).containsEntry("mode", "direct");
        assertThat(kv).containsEntry("correlationId", "corr-1");
        assertThat(kv).containsKey("caller");
        assertThat(kv).containsKey("onInfraFailure");
        assertThat(kv).containsKey("executionId");
        assertThat(kv).containsKey("pullRequestReference");
        assertThat(kv).containsKey("exceptionType");
        assertThat(kv).containsKey("exceptionMessage");
    }

    @Test
    void recordEmitsExceptionFieldsOnFailure() {
        ReleaseAuditEvent event = ReleaseAuditEvent.forFailure(
                ReleaseAuditOutcome.BLOCKED_INFRA,
                "group/name",
                null,
                null,
                "corr-2",
                null,
                null,
                new RuntimeException("boom"));

        sut.record(event);

        assertThat(appender.list).hasSize(1);
        Map<String, Object> kv = kvOf(appender.list.get(0));
        assertThat(kv).containsEntry("outcome", "BLOCKED_INFRA");
        assertThat(kv).containsEntry("exceptionType", "RuntimeException");
        assertThat(kv).containsEntry("exceptionMessage", "boom");
    }

    @Test
    void recordTreatsNullEventAsNoOp() {
        sut.record(null);
        assertThat(appender.list).isEmpty();
    }

    @Test
    void recordKeepsLogInjectionPayloadInsideKeyValuePairWithoutForgingASecondEntry() {
        // promptSpecId carries a payload that, if concatenated into a message, would forge
        // a fake entry (CR/LF + extra key=value). Because we use addKeyValue, the payload
        // stays bound to the promptSpecId field and we still emit exactly one entry.
        String injected = "group/name\r\nfake.outcome=FORGED";

        sut.record(ReleaseAuditEvent.forSuccess(
                ReleaseAuditOutcome.RELEASED,
                injected,
                "direct",
                null,
                "corr-3",
                null,
                null));

        assertThat(appender.list).hasSize(1);
        ILoggingEvent entry = appender.list.get(0);
        assertThat(entry.getMessage()).isEqualTo(Slf4jReleaseAuditLogger.AUDIT_MESSAGE);
        Map<String, Object> kv = kvOf(entry);
        assertThat(kv).containsEntry("promptSpecId", injected);
        // No collateral key was forged from the CR/LF payload.
        assertThat(kv).doesNotContainKey("fake.outcome");
        assertThat(entry.getKeyValuePairs())
                .extracting(p -> p.key)
                .doesNotContain("fake.outcome");
    }

    @Test
    void recordHandlesNullOutcomeWithoutThrowing() {
        ReleaseAuditEvent event = new ReleaseAuditEvent(
                null, "id", null, null, "corr-x", null, null, null, null, null);

        sut.record(event);

        assertThat(appender.list).hasSize(1);
        Map<String, Object> kv = kvOf(appender.list.get(0));
        assertThat(kv).containsKey("outcome");
        assertThat(kv.get("outcome")).isNull();
    }

    @Test
    void messageStringIsConstantAcrossEntries() {
        sut.record(ReleaseAuditEvent.forSuccess(
                ReleaseAuditOutcome.RELEASED, "a", null, null, "c1", null, null));
        sut.record(ReleaseAuditEvent.forFailure(
                ReleaseAuditOutcome.BLOCKED_PROMPT, "b", null, null, "c2", null, null,
                new IllegalStateException("nope")));

        assertThat(appender.list).hasSize(2);
        assertThat(appender.list)
                .extracting(ILoggingEvent::getMessage)
                .containsOnly(Slf4jReleaseAuditLogger.AUDIT_MESSAGE);
    }
}
