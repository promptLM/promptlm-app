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

package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Specification of evaluations for a {@link PromptSpec}.
 */
public class EvaluationSpec {

    private final List<Evaluation> evaluations;

    public EvaluationSpec(@JsonProperty("evaluations") List<Evaluation> evaluations) {
        this.evaluations = evaluations;
    }

    public List<Evaluation> getEvaluations() {
        return evaluations;
    }
}
