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
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Composites the registered {@link PromptExecutorFailureClassifier} beans into a single
 * classification call. Iterates them in Spring's resolved order (honour {@code @Order})
 * and returns the first non-empty result.
 *
 * <p>If no classifier recognises the exception, returns a fail-closed default of
 * {@link FailureClass#PROMPT} with code {@code UNKNOWN} — matching the historical behaviour
 * of {@code PreReleaseExecuteGate.classify(...)} which defaulted to PROMPT so unrecognised
 * failures hard-block the release.
 */
@Component
public class PromptExecutorFailureClassifierResolver {

    static final FailureClassification UNKNOWN =
            new FailureClassification(FailureClass.PROMPT, "UNKNOWN", "Prompt execution failed");

    private final List<PromptExecutorFailureClassifier> classifiers;

    public PromptExecutorFailureClassifierResolver(List<PromptExecutorFailureClassifier> classifiers) {
        this.classifiers = List.copyOf(classifiers);
    }

    /**
     * Classify {@code cause}. Never returns {@code null}; an unknown or {@code null} cause
     * yields the fail-closed default classification.
     */
    public FailureClassification classify(Throwable cause) {
        if (cause == null) {
            return UNKNOWN;
        }
        for (PromptExecutorFailureClassifier classifier : classifiers) {
            var result = classifier.classify(cause);
            if (result.isPresent()) {
                return result.get();
            }
        }
        return UNKNOWN;
    }
}
