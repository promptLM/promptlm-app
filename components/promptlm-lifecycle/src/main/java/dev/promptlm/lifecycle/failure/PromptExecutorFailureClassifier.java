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

import dev.promptlm.domain.promptspec.FailureClassification;

import java.util.Optional;

/**
 * SPI for translating a vendor- or transport-specific {@link Throwable} into a
 * {@link FailureClassification}.
 *
 * <p>Each executor adapter (e.g. {@code promptlm-execution-springai},
 * {@code promptlm-execution-litellm}) is expected to ship an implementation that recognises
 * its own exception hierarchy and maps recognised shapes to curated classifications.
 *
 * <p>Implementations <strong>must</strong> walk the cause chain — adapters often wrap their
 * native exceptions (e.g. into an {@link IllegalStateException}) before surfacing them.
 *
 * <p>Returning {@link Optional#empty()} signals "not my type" — the
 * {@code PromptExecutorFailureClassifierResolver} will fall through to the next registered
 * classifier and ultimately to the built-in heuristic.
 *
 * <p>Order is honoured via Spring's {@link org.springframework.core.annotation.Order @Order}
 * annotation (or {@link org.springframework.core.Ordered}). The built-in fallback is registered
 * at {@link org.springframework.core.Ordered#LOWEST_PRECEDENCE}, so adapter classifiers always
 * run first.
 */
public interface PromptExecutorFailureClassifier {

    /**
     * Inspect {@code cause} (and its cause chain) and return a classification when the
     * exception shape is recognised; {@link Optional#empty()} otherwise.
     */
    Optional<FailureClassification> classify(Throwable cause);
}
