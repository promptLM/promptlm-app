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

package dev.promptlm.release;

import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.ExecutionKind;
import dev.promptlm.domain.promptspec.FailureClass;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.lifecycle.application.PromptExecutionPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Gates a release on a successful server-side execution against the spec defaults, per #96.
 * Wraps the underlying promotion strategy: when the gate passes, the produced Execution is
 * appended to the spec that the store layer ultimately persists, so the released revision
 * carries an audit trail of the gating run.
 *
 * <p>Failure classification heuristic — root-cause inspection of the thrown exception:
 * an {@link IOException}, {@link SocketTimeoutException}, Spring HTTP-client resource-access
 * exceptions, or a 5xx-shaped vendor response is INFRASTRUCTURE; everything else is PROMPT.
 * Fail closed: ambiguous failures are treated as PROMPT-class so the release blocks.
 */
@Component
public class PreReleaseExecuteGate {

    private static final Logger log = LoggerFactory.getLogger(PreReleaseExecuteGate.class);

    private final PromptExecutionPort executionPort;
    private final PreReleaseExecuteProperties properties;

    public PreReleaseExecuteGate(PromptExecutionPort executionPort, PreReleaseExecuteProperties properties) {
        this.executionPort = executionPort;
        this.properties = properties;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    /**
     * Run the gate. Returns the spec with a successful PRE_RELEASE Execution appended; throws
     * {@link PreReleasePromptFailure} or {@link PreReleaseInfrastructureFailure} on failure
     * unless {@code onInfra == RECORD} in which case an infra failure attaches a failed
     * Execution and returns the spec normally.
     */
    public PromptSpec runOrThrow(PromptSpec spec, OnInfraFailure onInfra) {
        Instant start = Instant.now();
        try {
            PromptSpec executed = executionPort.runAndAttachResponse(spec);
            Execution success = new Execution(
                    UUID.randomUUID().toString(),
                    Instant.now(),
                    executed.getResponse(),
                    null,
                    null,
                    java.time.Duration.between(start, Instant.now()).toMillis(),
                    null,
                    null,
                    null,
                    "pre-release",
                    null,
                    null,
                    true,
                    null,
                    ExecutionKind.PRE_RELEASE,
                    null);
            return spec.withExecutions(append(spec.getExecutions(), success));
        } catch (RuntimeException ex) {
            FailureClass failureClass = classify(ex);
            Execution failed = new Execution(
                    UUID.randomUUID().toString(),
                    Instant.now(),
                    null,
                    null,
                    null,
                    java.time.Duration.between(start, Instant.now()).toMillis(),
                    null,
                    null,
                    null,
                    "pre-release",
                    null,
                    null,
                    false,
                    safeMessage(ex),
                    ExecutionKind.PRE_RELEASE,
                    failureClass);
            if (failureClass == FailureClass.INFRASTRUCTURE && onInfra == OnInfraFailure.RECORD) {
                log.info("Pre-release infrastructure failure recorded for prompt {} (override={})", spec.getId(), onInfra);
                return spec.withExecutions(append(spec.getExecutions(), failed));
            }
            if (failureClass == FailureClass.INFRASTRUCTURE) {
                throw new PreReleaseInfrastructureFailure(spec.getId(), failed, ex);
            }
            throw new PreReleasePromptFailure(spec.getId(), failed, ex);
        }
    }

    static FailureClass classify(Throwable ex) {
        Throwable cursor = ex;
        while (cursor != null) {
            if (cursor instanceof SocketTimeoutException) {
                return FailureClass.INFRASTRUCTURE;
            }
            if (cursor instanceof IOException) {
                return FailureClass.INFRASTRUCTURE;
            }
            String name = cursor.getClass().getName();
            if (name.equals("org.springframework.web.client.ResourceAccessException")) {
                return FailureClass.INFRASTRUCTURE;
            }
            if (name.endsWith("HttpServerErrorException")
                    || name.endsWith("WebClientResponseException$InternalServerError")
                    || name.endsWith("WebClientResponseException$BadGateway")
                    || name.endsWith("WebClientResponseException$ServiceUnavailable")
                    || name.endsWith("WebClientResponseException$GatewayTimeout")) {
                return FailureClass.INFRASTRUCTURE;
            }
            cursor = cursor.getCause();
        }
        // Fail closed.
        return FailureClass.PROMPT;
    }

    private static List<Execution> append(List<Execution> existing, Execution toAdd) {
        List<Execution> merged = existing == null ? new ArrayList<>() : new ArrayList<>(existing);
        merged.add(toAdd);
        return merged;
    }

    private static String safeMessage(Throwable ex) {
        String msg = ex.getMessage();
        return msg == null ? ex.getClass().getSimpleName() : msg;
    }
}
