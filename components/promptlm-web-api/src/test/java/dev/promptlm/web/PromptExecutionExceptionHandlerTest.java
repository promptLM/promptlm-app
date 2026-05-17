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

package dev.promptlm.web;

import dev.promptlm.lifecycle.failure.DefaultPromptExecutorFailureClassifier;
import dev.promptlm.lifecycle.failure.PromptExecutorFailureClassifierResolver;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

import java.net.SocketTimeoutException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PromptExecutionExceptionHandlerTest {

    private final PromptExecutorFailureClassifierResolver resolver =
            new PromptExecutorFailureClassifierResolver(List.of(new DefaultPromptExecutorFailureClassifier()));

    private final PromptExecutionExceptionHandler handler = new PromptExecutionExceptionHandler(resolver);

    @Test
    /**
     * When a vendor cause is present, the response body uses the curated user message from
     * the classifier — the raw cause text never reaches the response.
     */
    void useCuratedMessageWhenCausePresent() {
        var cause = new RuntimeException("LiteLLM invocation failed: <vendor-leak-text>",
                new SocketTimeoutException("read timed out"));
        var exception = PromptExecutionException.internalServerError("p1", cause);

        ResponseEntity<ProblemDetail> response = handler.handlePromptExecutionException(exception);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDetail()).isEqualTo("Vendor request timed out");
        assertThat(response.getBody().getDetail()).doesNotContain("LiteLLM");
        assertThat(response.getBody().getDetail()).doesNotContain("vendor-leak-text");
    }

    @Test
    /** Unclassified causes fall back to the resolver's UNKNOWN default — never to raw text. */
    void unclassifiedCauseFallsBackToUnknownDefault() {
        var cause = new IllegalArgumentException("raw vendor metadata with secrets");
        var exception = PromptExecutionException.badRequest("p1", cause);

        ResponseEntity<ProblemDetail> response = handler.handlePromptExecutionException(exception);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDetail()).isEqualTo("Prompt execution failed");
        assertThat(response.getBody().getDetail()).doesNotContain("raw vendor metadata");
    }

    @Test
    /** The diagnostic code is surfaced as a property on ProblemDetail for clients. */
    void diagnosticCodeIsExposedOnProblemDetail() {
        var cause = new RuntimeException("vendor wrapper", new SocketTimeoutException("..."));
        var exception = PromptExecutionException.internalServerError("p1", cause);

        ResponseEntity<ProblemDetail> response = handler.handlePromptExecutionException(exception);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getProperties()).containsEntry("code", "TIMEOUT");
    }
}
