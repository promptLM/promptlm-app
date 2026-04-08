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

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.EvaluationSpec;
import dev.promptlm.domain.promptspec.EvaluationStatus;
import dev.promptlm.domain.promptspec.PromptEvaluationDefinition;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PromptEvaluatorTest {

    private final PromptEvaluator evaluator = new PromptEvaluator();

    @Test
    void returnsNotConfiguredWhenEvaluationSpecMissing() {
        PromptSpec promptSpec = basePromptSpec();

        PromptSpec evaluated = evaluator.evaluateAndAttachResults(promptSpec);

        EvaluationResults results = EvaluationExtensionSupport.extractResults(evaluated);
        assertThat(results).isNotNull();
        assertThat(results.getStatus()).isEqualTo(EvaluationStatus.NOT_CONFIGURED);
        assertThat(results.success()).isFalse();
    }

    @Test
    void returnsNotConfiguredWhenEvaluationListEmpty() {
        PromptSpec promptSpec = basePromptSpec()
                .withExtensions(buildEvaluationExtensions(new EvaluationSpec(List.of()), null));

        PromptSpec evaluated = evaluator.evaluateAndAttachResults(promptSpec);

        EvaluationResults results = EvaluationExtensionSupport.extractResults(evaluated);
        assertThat(results).isNotNull();
        assertThat(results.getStatus()).isEqualTo(EvaluationStatus.NOT_CONFIGURED);
        assertThat(results.success()).isFalse();
    }

    @Test
    void aggregatesSuccessfulEvaluations() {
        PromptSpec promptSpec = basePromptSpec()
                .withResponse(new ChatCompletionResponse(10L, null, "answer"))
                .withEvaluationSpec(new EvaluationSpec(List.of(
                        new PromptEvaluationDefinition("eval-1", "quality", "ok"),
                        new PromptEvaluationDefinition("eval-2", "safety", "ok")
                )));

        PromptSpec evaluated = evaluator.evaluateAndAttachResults(promptSpec);
        EvaluationResults results = EvaluationExtensionSupport.extractResults(evaluated);

        assertThat(results.getStatus()).isEqualTo(EvaluationStatus.EVALUATED_OK);
        assertThat(results.success()).isTrue();
        assertThat(results.getEvaluations()).hasSize(2);
        assertThat(evaluated.getExtensions()).containsKey(EvaluationExtensionSupport.EVALUATION_EXTENSION_KEY);
    }

    @Test
    void marksEvaluationAsFailedWhenResponseMissing() {
        PromptSpec promptSpec = basePromptSpec()
                .withEvaluationSpec(new EvaluationSpec(List.of(
                        new PromptEvaluationDefinition("eval-1", "quality", "ok")
                )));

        PromptSpec evaluated = evaluator.evaluateAndAttachResults(promptSpec);
        EvaluationResults results = EvaluationExtensionSupport.extractResults(evaluated);

        assertThat(results.getStatus()).isEqualTo(EvaluationStatus.EVALUATED_FAILED);
        assertThat(results.success()).isFalse();
        assertThat(results.getEvaluations()).hasSize(1);
    }

    @Test
    void marksEvaluationAsFailedWhenEvaluatorThrows() {
        List<dev.promptlm.domain.promptspec.Evaluation> evaluations = new ArrayList<>();
        evaluations.add(null);

        PromptSpec promptSpec = basePromptSpec()
                .withResponse(new ChatCompletionResponse(10L, null, "answer"))
                .withEvaluationSpec(new EvaluationSpec(evaluations));

        PromptSpec evaluated = evaluator.evaluateAndAttachResults(promptSpec);
        EvaluationResults results = EvaluationExtensionSupport.extractResults(evaluated);

        assertThat(results.getStatus()).isEqualTo(EvaluationStatus.EVALUATED_FAILED);
        assertThat(results.success()).isFalse();
        assertThat(results.getEvaluations()).hasSize(1);
    }

    private static PromptSpec basePromptSpec() {
        return PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4")
                        .withMessages(List.of())
                        .build())
                .build();
    }

    @Test
    void readsEvaluationSpecFromExtensions() {
        EvaluationSpec evaluationSpec = new EvaluationSpec(List.of(
                new PromptEvaluationDefinition("regex", "regex", "answer")
        ));
        PromptSpec promptSpec = basePromptSpec()
                .withResponse(new ChatCompletionResponse(10L, null, "answer"))
                .withExtensions(buildEvaluationExtensions(evaluationSpec, null));

        PromptSpec evaluated = evaluator.evaluateAndAttachResults(promptSpec);
        EvaluationResults results = EvaluationExtensionSupport.extractResults(evaluated);

        assertThat(results.getStatus()).isEqualTo(EvaluationStatus.EVALUATED_OK);
        assertThat(results.success()).isTrue();
        assertThat(evaluated.getExtensions()).containsKey(EvaluationExtensionSupport.EVALUATION_EXTENSION_KEY);
    }

    private static Map<String, tools.jackson.databind.JsonNode> buildEvaluationExtensions(
            EvaluationSpec evaluationSpec,
            EvaluationResults evaluationResults) {
        ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
        ObjectNode evaluationNode = mapper.createObjectNode();
        if (evaluationSpec != null) {
            evaluationNode.set("spec", mapper.valueToTree(evaluationSpec));
        }
        if (evaluationResults != null) {
            evaluationNode.set("results", mapper.valueToTree(evaluationResults));
        }
        return Map.of(EvaluationExtensionSupport.EVALUATION_EXTENSION_KEY, evaluationNode);
    }
}
