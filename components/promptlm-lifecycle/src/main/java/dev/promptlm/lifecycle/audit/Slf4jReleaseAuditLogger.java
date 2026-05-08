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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Default {@link ReleaseAuditLogger} that emits one structured SLF4J entry per event
 * on the dedicated logger {@code dev.promptlm.lifecycle.audit.release}.
 *
 * <p>Uses the SLF4J 2.x fluent API ({@code addKeyValue}) so event fields are surfaced as
 * structured key-value pairs rather than being concatenated into the message. This is
 * intentional: it keeps the message a constant ({@code "release.audit"}) and prevents log
 * injection via user-controlled fields like {@code promptSpecId}.
 *
 * <p>The {@code exceptionType}/{@code exceptionMessage} fields capture the failure surface
 * for sad paths. Stack traces are intentionally not attached &mdash; consumers that need the
 * stack can configure standard error logging on a separate appender.
 */
@Component
public class Slf4jReleaseAuditLogger implements ReleaseAuditLogger {

    /** Logger name &mdash; consumers can route this stream independently of operational logs. */
    public static final String AUDIT_LOGGER_NAME = "dev.promptlm.lifecycle.audit.release";

    /** Constant message; structured fields carry every variable detail. */
    public static final String AUDIT_MESSAGE = "release.audit";

    private static final Logger log = LoggerFactory.getLogger(AUDIT_LOGGER_NAME);

    @Override
    public void record(ReleaseAuditEvent event) {
        if (event == null) {
            return;
        }
        log.atInfo()
                .setMessage(AUDIT_MESSAGE)
                .addKeyValue("outcome", event.outcome() == null ? null : event.outcome().name())
                .addKeyValue("promptSpecId", event.promptSpecId())
                .addKeyValue("mode", event.mode())
                .addKeyValue("pullRequestReference", event.pullRequestReference())
                .addKeyValue("correlationId", event.correlationId())
                .addKeyValue("caller", event.caller())
                .addKeyValue("onInfraFailure", event.onInfraFailure())
                .addKeyValue("executionId", event.executionId())
                .addKeyValue("exceptionType", event.exceptionType())
                .addKeyValue("exceptionMessage", event.exceptionMessage())
                .log();
    }
}
