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

package dev.promptlm.evaluation;

import dev.promptlm.domain.promptspec.EvaluationResult;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.EvaluationSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PromptEvaluator {
    private static final Logger log = LoggerFactory.getLogger(PromptEvaluator.class);

    /**
     * Run configured evaluations and attach their results to the {@link PromptSpec}.
     * <p>
     * Evaluations are processed sequentially to avoid issues with non-thread-safe
     * implementations.
     */
    public PromptSpec evaluateAndAttachResults(PromptSpec promptSpec) {
        String promptId = promptSpec.getId() == null ? "<none>" : promptSpec.getId();
        EvaluationSpec evaluationSpec = EvaluationExtensionSupport.extractSpec(promptSpec);
        int evaluatorCount = evaluationSpec == null || evaluationSpec.getEvaluations() == null
                ? 0
                : evaluationSpec.getEvaluations().size();

        log.info("Prompt evaluation started: promptId={}, evaluators={}", promptId, evaluatorCount);

        if (evaluationSpec == null || evaluationSpec.getEvaluations() == null || evaluationSpec.getEvaluations().isEmpty()) {
            log.info("Prompt evaluation skipped: promptId={}, reason=not-configured", promptId);
            return EvaluationExtensionSupport.withResults(promptSpec, evaluationSpec, EvaluationResults.notConfigured());
        }

        Response response = promptSpec.getResponse();
        if (response == null) {
            log.info("Prompt evaluation failed: promptId={}, reason=missing-response", promptId);
            return EvaluationExtensionSupport.withResults(promptSpec, evaluationSpec, EvaluationResults.failed(List.of(
                    new EvaluationResult(
                            "PromptEvaluator",
                            "missing-response",
                            0.0,
                            "No response present on PromptSpec",
                            "Evaluation cannot run without a response object")
            )));
        }

        // Evaluate sequentially since implementations may not be thread-safe
        List<EvaluationResult> evaluations = new ArrayList<>();
        try {
            for (var evaluation : evaluationSpec.getEvaluations()) {
                EvaluationResult result = evaluation.evaluate(response);
                if (result == null) {
                    log.error("Prompt evaluation failed: promptId={}, evaluator={}, reason=null-result",
                            promptId, evaluation.getClass().getSimpleName());
                    return EvaluationExtensionSupport.withResults(promptSpec, evaluationSpec, EvaluationResults.failed(List.of(
                            new EvaluationResult(
                                    evaluation.getClass().getSimpleName(),
                                    "null-result",
                                    0.0,
                                    "Evaluator returned null",
                                    "Evaluator implementations must return an EvaluationResult")
                    )));
                }
                evaluations.add(result);
            }
        } catch (RuntimeException exception) {
            log.error("Prompt evaluation failed: promptId={}, reason=evaluation-error, errorType={}, message={}",
                    promptId, exception.getClass().getName(), exception.getMessage());
            return EvaluationExtensionSupport.withResults(promptSpec, evaluationSpec, EvaluationResults.failed(List.of(
                    new EvaluationResult(
                            "PromptEvaluator",
                            "evaluation-error",
                            0.0,
                            exception.getMessage(),
                            exception.getClass().getName())
            )));
        }
        PromptSpec evaluated = EvaluationExtensionSupport.withResults(promptSpec, evaluationSpec, new EvaluationResults(evaluations));
        EvaluationResults evaluationResults = EvaluationExtensionSupport.extractResults(evaluated);
        log.info("Prompt evaluation finished: promptId={}, status={}, evaluations={}",
                promptId,
                evaluationResults == null ? "<none>" : evaluationResults.getStatus(),
                evaluationResults == null || evaluationResults.getEvaluations() == null ? 0 : evaluationResults.getEvaluations().size());
        return evaluated;
    }

}
