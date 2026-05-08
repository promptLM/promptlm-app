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

package dev.promptlm.webapp;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.EvaluationResult;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.ReleaseMetadata;
import dev.promptlm.lifecycle.audit.Slf4jReleaseAuditLogger;
import dev.promptlm.store.api.PromptStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Integration smoke test that satisfies items 4 and 5 of the issue #126 PR test plan:
 * the closest CI-runnable analogue of "smoke test on a running webapp" for the
 * {@code POST /api/prompts/{id}/release} endpoint.
 *
 * <p>Boots the full webapp Spring context (so the new {@code @Component}s are auto-wired
 * and the real {@code DefaultPromptLifecycleService} is on the call path), mocks only the
 * underlying {@link PromptStore} (the seam where both the controller's 404-lookup and the
 * lifecycle port delegate), and observes the dedicated audit logger via a Logback
 * {@link ListAppender}.
 *
 * <p>Asserts the same observable contract a manual operator would verify: one structured
 * entry per call, on the dedicated logger, with the issue's required fields populated and
 * the schema-stable {@code null} sentinels for {@code caller} / {@code onInfraFailure} /
 * {@code executionId}.
 */
@SpringBootTest(
        classes = PromptLmWebAppApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.ai.openai.api-key=test-mock-api-key-for-testing",
                "spring.ai.anthropic.api-key=test-mock-anthropic-api-key-for-testing",
                "promptlm.store.remote.username=testuser",
                "promptlm.store.remote.token=",
                "promptlm.store.remote.base-url=http://localhost:3003/api/v1"
        }
)
@AutoConfigureTestRestTemplate
class ReleaseAuditEndpointIntegrationTest {

    private static final String PROMPT_ID = "group/name";

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @MockitoBean
    PromptStore promptStore;

    private Logger auditLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void attachAuditAppender() {
        auditLogger = (Logger) LoggerFactory.getLogger(Slf4jReleaseAuditLogger.AUDIT_LOGGER_NAME);
        auditLogger.setLevel(Level.INFO);
        appender = new ListAppender<>();
        appender.start();
        auditLogger.addAppender(appender);
    }

    @AfterEach
    void detachAuditAppender() {
        auditLogger.detachAppender(appender);
        appender.stop();
    }

    private static PromptSpec basePromptSpec() {
        return PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4")
                        .withMessages(List.of())
                        .build())
                .build();
    }

    private Map<String, Object> kvOf(ILoggingEvent event) {
        Map<String, Object> map = new HashMap<>();
        event.getKeyValuePairs().forEach(p -> map.put(p.key, p.value));
        return map;
    }

    @Test
    void happyPathReleaseEmitsOneStructuredAuditEntryWithReleasedOutcome() {
        EvaluationResults success = new EvaluationResults(
                List.of(new EvaluationResult("eval", "type", 1.0, null, null)));
        PromptSpec evaluated = basePromptSpec().withEvaluationResults(success);
        PromptSpec released = evaluated.withReleaseMetadata(new ReleaseMetadata(
                ReleaseMetadata.STATE_RELEASED,
                ReleaseMetadata.MODE_DIRECT,
                "1.0.0",
                "group/name-v1.0.0",
                "main",
                null,
                null,
                false));
        when(promptStore.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));
        when(promptStore.requestRelease(evaluated)).thenReturn(released);

        ResponseEntity<String> response = restTemplate.exchange(
                "http://localhost:" + port + "/api/prompts/" + PROMPT_ID + "/release",
                HttpMethod.POST,
                HttpEntity.EMPTY,
                String.class);

        // Operator-level expectation 1: HTTP succeeds.
        assertThat(response.getStatusCode().is2xxSuccessful())
                .as("release endpoint should return 2xx on happy path; body=%s", response.getBody())
                .isTrue();

        // Operator-level expectation 2: exactly one audit entry on the dedicated logger.
        List<ILoggingEvent> entries = appender.list.stream()
                .filter(e -> Slf4jReleaseAuditLogger.AUDIT_MESSAGE.equals(e.getMessage()))
                .toList();
        assertThat(entries).hasSize(1);

        ILoggingEvent entry = entries.get(0);
        assertThat(entry.getLevel()).isEqualTo(Level.INFO);
        assertThat(entry.getLoggerName()).isEqualTo(Slf4jReleaseAuditLogger.AUDIT_LOGGER_NAME);

        // Operator-level expectation 3: the field set the issue specifies.
        Map<String, Object> kv = kvOf(entry);
        assertThat(kv).containsEntry("outcome", "RELEASED");
        assertThat(kv).containsEntry("promptSpecId", PROMPT_ID);
        assertThat(kv).containsEntry("mode", ReleaseMetadata.MODE_DIRECT);
        assertThat(kv.get("correlationId")).isNotNull();
        assertThat(((String) kv.get("correlationId"))).isNotBlank();
        // Schema-stable sentinel nulls until #124 / #96 land.
        assertThat(kv).containsEntry("caller", null);
        assertThat(kv).containsEntry("onInfraFailure", null);
        assertThat(kv).containsEntry("executionId", null);
        // Happy path: no exception fields.
        assertThat(kv).containsEntry("exceptionType", null);
        assertThat(kv).containsEntry("exceptionMessage", null);
    }

    @Test
    void sadPathReleaseStillEmitsAuditEntryAndPropagatesOriginalException() {
        EvaluationResults failing = new EvaluationResults(
                List.of(new EvaluationResult("eval", "type", 0.0, null, null)));
        PromptSpec evaluated = basePromptSpec().withEvaluationResults(failing);
        when(promptStore.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));

        ResponseEntity<String> response = restTemplate.exchange(
                "http://localhost:" + port + "/api/prompts/" + PROMPT_ID + "/release",
                HttpMethod.POST,
                HttpEntity.EMPTY,
                String.class);

        // Operator-level expectation 1: HTTP returns a non-2xx (the exception propagates
        // unchanged to the controller's exception handling).
        assertThat(response.getStatusCode().is2xxSuccessful())
                .as("failing-evaluation release should not return 2xx; body=%s", response.getBody())
                .isFalse();

        // Operator-level expectation 2: exactly one audit entry, even on failure.
        List<ILoggingEvent> entries = appender.list.stream()
                .filter(e -> Slf4jReleaseAuditLogger.AUDIT_MESSAGE.equals(e.getMessage()))
                .toList();
        assertThat(entries).hasSize(1);

        Map<String, Object> kv = kvOf(entries.get(0));
        assertThat(kv).containsEntry("outcome", "BLOCKED_PROMPT");
        assertThat(kv).containsEntry("promptSpecId", PROMPT_ID);
        assertThat(kv).containsEntry("exceptionType", "PromptReleaseException");
        assertThat(((String) kv.get("exceptionMessage"))).contains("failing evaluation results");
        assertThat(((String) kv.get("correlationId"))).isNotBlank();
    }
}
