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

package dev.promptlm.lifecycle.failure;

import dev.promptlm.domain.promptspec.FailureClass;
import dev.promptlm.domain.promptspec.FailureClassification;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class DefaultPromptExecutorFailureClassifierTest {

    private final DefaultPromptExecutorFailureClassifier classifier = new DefaultPromptExecutorFailureClassifier();

    @Test
    /** Socket timeouts are classified as infrastructure / TIMEOUT. */
    void socketTimeoutBecomesTimeout() {
        Optional<FailureClassification> result = classifier.classify(new SocketTimeoutException("read timed out"));

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(result.get().code()).isEqualTo("TIMEOUT");
        assertThat(result.get().userMessage()).isEqualTo("Vendor request timed out");
    }

    @Test
    /** Plain IOExceptions are classified as infrastructure / NETWORK. */
    void ioExceptionBecomesNetwork() {
        Optional<FailureClassification> result = classifier.classify(new IOException("connection reset"));

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(result.get().code()).isEqualTo("NETWORK");
    }

    @Test
    /** Spring's ResourceAccessException is classified as infrastructure / NETWORK. */
    void resourceAccessExceptionBecomesNetwork() {
        Optional<FailureClassification> result = classifier.classify(new ResourceAccessException("vendor unreachable"));

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(result.get().code()).isEqualTo("NETWORK");
        assertThat(result.get().userMessage()).isEqualTo("Vendor unreachable");
    }

    @Test
    /** 5xx HTTP server errors are classified as infrastructure / VENDOR_5XX. */
    void serverErrorBecomesVendor5xx() {
        Optional<FailureClassification> result = classifier.classify(
                HttpServerErrorException.create(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                        "boom", null, null, null));

        assertThat(result).isPresent();
        assertThat(result.get().failureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
        assertThat(result.get().code()).isEqualTo("VENDOR_5XX");
    }

    @Test
    /** Classifier walks the cause chain — adapters often wrap their native exceptions. */
    void walksCauseChain() {
        Throwable wrapped = new IllegalStateException("LiteLLM invocation failed",
                new IllegalStateException("wrapper", new SocketTimeoutException("inner")));

        Optional<FailureClassification> result = classifier.classify(wrapped);

        assertThat(result).isPresent();
        assertThat(result.get().code()).isEqualTo("TIMEOUT");
    }

    @Test
    /** Unrecognised exceptions yield empty — resolver applies fail-closed default. */
    void unknownExceptionReturnsEmpty() {
        Optional<FailureClassification> result = classifier.classify(new IllegalArgumentException("bad prompt"));

        assertThat(result).isEmpty();
    }

    @Test
    /** Null cause yields empty (resolver handles null at its own boundary). */
    void nullReturnsEmpty() {
        assertThat(classifier.classify(null)).isEmpty();
    }
}
