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
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class LiteLlmFailureClassifierTest {

    private final LiteLlmFailureClassifier classifier = new LiteLlmFailureClassifier();

    @Test
    /** 401 → AUTH_FAILED (prompt-class — invalid creds is a configuration problem). */
    void unauthorizedBecomesAuthFailed() {
        var ex = HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "Unauthorized", null, null, null);

        Optional<FailureClassification> result = classifier.classify(ex);

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.PROMPT);
        assertThat(result.get().code()).isEqualTo("AUTH_FAILED");
        assertThat(result.get().userMessage()).isEqualTo("Authentication with vendor failed");
    }

    @Test
    /** 403 also maps to AUTH_FAILED — both signal a credentials problem. */
    void forbiddenBecomesAuthFailed() {
        var ex = HttpClientErrorException.create(HttpStatus.FORBIDDEN, "Forbidden", null, null, null);

        Optional<FailureClassification> result = classifier.classify(ex);

        assertThat(result).isPresent();
        assertThat(result.get().code()).isEqualTo("AUTH_FAILED");
    }

    @Test
    /** 429 → RATE_LIMITED (infrastructure — retryable). */
    void tooManyRequestsBecomesRateLimited() {
        var ex = HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", null, null, null);

        Optional<FailureClassification> result = classifier.classify(ex);

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(result.get().code()).isEqualTo("RATE_LIMITED");
    }

    @Test
    /** Other 4xx → BAD_REQUEST (prompt-class). */
    void badRequestBecomesBadRequest() {
        var ex = HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "Bad Request", null, null, null);

        Optional<FailureClassification> result = classifier.classify(ex);

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.PROMPT);
        assertThat(result.get().code()).isEqualTo("BAD_REQUEST");
    }

    @Test
    /** 5xx → VENDOR_5XX (infrastructure). */
    void serverErrorBecomesVendor5xx() {
        var ex = HttpServerErrorException.create(HttpStatus.INTERNAL_SERVER_ERROR, "boom", null, null, null);

        Optional<FailureClassification> result = classifier.classify(ex);

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(result.get().code()).isEqualTo("VENDOR_5XX");
    }

    @Test
    /** Walks the cause chain — the LiteLLM gateway wraps its exceptions in IllegalStateException. */
    void walksCauseChainThroughIllegalStateWrapper() {
        RestClientResponseException inner =
                HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "Unauthorized", null, null, null);
        var wrapped = new IllegalStateException("LiteLLM invocation failed with status 401: …vendor body…", inner);

        Optional<FailureClassification> result = classifier.classify(wrapped);

        assertThat(result).isPresent();
        assertThat(result.get().code()).isEqualTo("AUTH_FAILED");
    }

    @Test
    /** Non-LiteLLM exceptions yield empty so the default classifier (or fail-closed) handles them. */
    void unrelatedExceptionReturnsEmpty() {
        Optional<FailureClassification> result = classifier.classify(new IllegalArgumentException("schema mismatch"));

        assertThat(result).isEmpty();
    }
}
