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

package dev.promptlm.execution.litellm;

import dev.promptlm.domain.promptspec.FailureClass;
import dev.promptlm.domain.promptspec.FailureClassification;
import dev.promptlm.lifecycle.failure.PromptExecutorFailureClassifier;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.RestClientResponseException;

import java.util.Optional;

/**
 * Adapter-side classifier for the LiteLLM gateway.
 *
 * <p>Recognises {@link RestClientResponseException} (Spring's HTTP client failure) and maps
 * the status code to a curated {@link FailureClassification}. 5xx codes are delegated to the
 * built-in default classifier (returning empty here) so we don't duplicate the heuristic.
 *
 * <p>Walks the cause chain — {@code LiteLlmPromptGateway} wraps its native exceptions in an
 * {@link IllegalStateException} before surfacing them.
 *
 * <p>Registered as a Spring bean by {@code LiteLlmAutoConfiguration}, ahead of the default
 * classifier via {@link Ordered#HIGHEST_PRECEDENCE}.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LiteLlmFailureClassifier implements PromptExecutorFailureClassifier {

    @Override
    public Optional<FailureClassification> classify(Throwable cause) {
        Throwable cursor = cause;
        while (cursor != null) {
            if (cursor instanceof RestClientResponseException restEx) {
                return Optional.of(forStatus(restEx.getStatusCode()));
            }
            cursor = cursor.getCause();
        }
        return Optional.empty();
    }

    private static FailureClassification forStatus(HttpStatusCode status) {
        int code = status.value();
        if (code == 401 || code == 403) {
            return new FailureClassification(FailureClass.PROMPT, "AUTH_FAILED",
                    "Authentication with vendor failed");
        }
        if (code == 429) {
            return new FailureClassification(FailureClass.INFRASTRUCTURE, "RATE_LIMITED",
                    "Vendor rate limit exceeded");
        }
        if (code >= 400 && code < 500) {
            return new FailureClassification(FailureClass.PROMPT, "BAD_REQUEST",
                    "Invalid request to vendor");
        }
        if (code >= 500) {
            return new FailureClassification(FailureClass.INFRASTRUCTURE, "VENDOR_5XX",
                    "Vendor service error");
        }
        // Unexpected non-error status arriving as an exception — defensive default.
        return new FailureClassification(FailureClass.PROMPT, "UNKNOWN",
                "Prompt execution failed");
    }
}
