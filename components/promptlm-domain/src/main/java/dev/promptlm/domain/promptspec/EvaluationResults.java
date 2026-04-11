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

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Aggregated results from all evaluators run against a prompt execution.
 * Derives an overall {@link EvaluationStatus} from the individual results.
 */
public class EvaluationResults {

    private final List<EvaluationResult> evaluations;
    private final EvaluationStatus status;

    public EvaluationResults(List<EvaluationResult> evaluations) {
        this(evaluations, null);
    }

    @JsonCreator
    public EvaluationResults(
            @JsonProperty("evaluations") List<EvaluationResult> evaluations,
            @JsonProperty("status") EvaluationStatus status) {
        this.evaluations = evaluations == null ? List.of() : List.copyOf(evaluations);
        this.status = status == null ? deriveStatus(this.evaluations) : status;
    }

    public static EvaluationResults notConfigured() {
        return new EvaluationResults(List.of(), EvaluationStatus.NOT_CONFIGURED);
    }

    public static EvaluationResults failed(List<EvaluationResult> evaluations) {
        return new EvaluationResults(evaluations, EvaluationStatus.EVALUATED_FAILED);
    }

    public List<EvaluationResult> getEvaluations() {
        return evaluations;
    }

    public EvaluationStatus getStatus() {
        return status;
    }

    public boolean success() {
        return status == EvaluationStatus.EVALUATED_OK;
    }

    private static EvaluationStatus deriveStatus(List<EvaluationResult> evaluations) {
        if (evaluations == null || evaluations.isEmpty()) {
            return EvaluationStatus.NOT_CONFIGURED;
        }
        return evaluations.stream().allMatch(evaluation -> evaluation != null && evaluation.success())
                ? EvaluationStatus.EVALUATED_OK
                : EvaluationStatus.EVALUATED_FAILED;
    }
}
