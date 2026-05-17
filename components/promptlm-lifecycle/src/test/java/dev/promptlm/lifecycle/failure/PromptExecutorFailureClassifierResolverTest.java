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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class PromptExecutorFailureClassifierResolverTest {

    @Test
    /** First non-empty classifier wins — resolver does not consult later ones. */
    void firstNonEmptyWins() {
        PromptExecutorFailureClassifier first = ex -> Optional.of(
                new FailureClassification(FailureClass.PROMPT, "AUTH_FAILED", "auth"));
        PromptExecutorFailureClassifier second = ex -> Optional.of(
                new FailureClassification(FailureClass.INFRASTRUCTURE, "VENDOR_5XX", "5xx"));

        var resolver = new PromptExecutorFailureClassifierResolver(List.of(first, second));

        FailureClassification result = resolver.classify(new RuntimeException("x"));

        assertThat(result.code()).isEqualTo("AUTH_FAILED");
    }

    @Test
    /** Empty classifiers are skipped; resolver consults the next in line. */
    void skipsEmptyClassifiers() {
        PromptExecutorFailureClassifier empty = ex -> Optional.empty();
        PromptExecutorFailureClassifier matching = ex -> Optional.of(
                new FailureClassification(FailureClass.INFRASTRUCTURE, "TIMEOUT", "timed out"));

        var resolver = new PromptExecutorFailureClassifierResolver(List.of(empty, matching));

        FailureClassification result = resolver.classify(new RuntimeException("x"));

        assertThat(result.code()).isEqualTo("TIMEOUT");
    }

    @Test
    /** When nothing matches, resolver falls back to the fail-closed default (PROMPT/UNKNOWN). */
    void unknownFallsBackToPromptClosed() {
        PromptExecutorFailureClassifier empty = ex -> Optional.empty();

        var resolver = new PromptExecutorFailureClassifierResolver(List.of(empty));

        FailureClassification result = resolver.classify(new RuntimeException("x"));

        assertThat(result.failureClass()).isEqualTo(FailureClass.PROMPT);
        assertThat(result.code()).isEqualTo("UNKNOWN");
    }

    @Test
    /** Null cause yields the fail-closed default without consulting classifiers. */
    void nullCauseYieldsDefault() {
        PromptExecutorFailureClassifier wouldThrow = ex -> {
            throw new AssertionError("should not be consulted for null");
        };

        var resolver = new PromptExecutorFailureClassifierResolver(List.of(wouldThrow));

        FailureClassification result = resolver.classify(null);

        assertThat(result.failureClass()).isEqualTo(FailureClass.PROMPT);
        assertThat(result.code()).isEqualTo("UNKNOWN");
    }

    @Test
    /** Empty classifier list still yields a default — works before any adapter ships. */
    void emptyClassifierListStillResolves() {
        var resolver = new PromptExecutorFailureClassifierResolver(List.of());

        FailureClassification result = resolver.classify(new RuntimeException("x"));

        assertThat(result.code()).isEqualTo("UNKNOWN");
    }
}
