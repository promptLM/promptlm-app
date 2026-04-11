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

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.Evaluation;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.EvaluationSpec;
import dev.promptlm.domain.promptspec.PromptEvaluationDefinition;
import dev.promptlm.domain.promptspec.PromptSpec;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class EvaluationExtensionSupport {

    static final String EVALUATION_EXTENSION_KEY = "x-evaluation";

    private static final ObjectMapper MAPPER = ObjectMapperFactory.createJsonMapper();

    private EvaluationExtensionSupport() {
    }

    static EvaluationSpec extractSpec(PromptSpec promptSpec) {
        EvaluationSpec spec = extractSpecFromExtensions(promptSpec);
        return spec != null ? spec : promptSpec.getEvaluationSpec();
    }

    static EvaluationResults extractResults(PromptSpec promptSpec) {
        EvaluationResults results = extractExtensionValue(promptSpec, "results", EvaluationResults.class);
        return results != null ? results : promptSpec.getEvaluationResults();
    }

    static PromptSpec withResults(PromptSpec promptSpec, EvaluationSpec spec, EvaluationResults results) {
        Map<String, JsonNode> existing = promptSpec.getExtensions();
        Map<String, JsonNode> updated = existing == null ? new LinkedHashMap<>() : new LinkedHashMap<>(existing);

        ObjectNode evaluationNode = extractEvaluationNode(existing);
        if (evaluationNode == null) {
            evaluationNode = MAPPER.createObjectNode();
        }
        if (spec != null && evaluationNode.get("spec") == null && canSerializeSpec(spec)) {
            evaluationNode.set("spec", MAPPER.valueToTree(spec));
        }
        if (results != null) {
            evaluationNode.set("results", MAPPER.valueToTree(results));
        }

        if (evaluationNode.size() > 0) {
            updated.put(EVALUATION_EXTENSION_KEY, evaluationNode);
        } else {
            updated.remove(EVALUATION_EXTENSION_KEY);
        }

        return promptSpec.withExtensions(updated);
    }

    private static ObjectNode extractEvaluationNode(Map<String, JsonNode> extensions) {
        if (extensions == null || extensions.isEmpty()) {
            return null;
        }
        JsonNode node = extensions.get(EVALUATION_EXTENSION_KEY);
        if (node != null && node.isObject()) {
            return (ObjectNode) node.deepCopy();
        }
        return null;
    }

    private static <T> T extractExtensionValue(PromptSpec promptSpec, String field, Class<T> valueType) {
        Map<String, JsonNode> extensions = promptSpec.getExtensions();
        if (extensions == null || extensions.isEmpty()) {
            return null;
        }
        JsonNode evaluationNode = extensions.get(EVALUATION_EXTENSION_KEY);
        if (evaluationNode == null || !evaluationNode.isObject()) {
            return null;
        }
        JsonNode fieldNode = evaluationNode.get(field);
        if (fieldNode == null || fieldNode.isNull()) {
            return null;
        }
        try {
            return MAPPER.convertValue(fieldNode, valueType);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static EvaluationSpec extractSpecFromExtensions(PromptSpec promptSpec) {
        Map<String, JsonNode> extensions = promptSpec.getExtensions();
        if (extensions == null || extensions.isEmpty()) {
            return null;
        }
        JsonNode evaluationNode = extensions.get(EVALUATION_EXTENSION_KEY);
        if (evaluationNode == null || !evaluationNode.isObject()) {
            return null;
        }
        JsonNode specNode = evaluationNode.get("spec");
        if (specNode == null || specNode.isNull()) {
            return null;
        }
        JsonNode evaluationsNode = specNode.isArray() ? specNode : specNode.get("evaluations");
        if (evaluationsNode == null || evaluationsNode.isNull()) {
            return new EvaluationSpec(List.of());
        }
        if (!evaluationsNode.isArray()) {
            return null;
        }
        List<Evaluation> evaluations = new ArrayList<>();
        for (JsonNode evaluationNodeItem : evaluationsNode) {
            try {
                evaluations.add(MAPPER.convertValue(evaluationNodeItem, PromptEvaluationDefinition.class));
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return new EvaluationSpec(evaluations);
    }

    private static boolean canSerializeSpec(EvaluationSpec spec) {
        if (spec == null) {
            return false;
        }
        List<Evaluation> evaluations = spec.getEvaluations();
        if (evaluations == null || evaluations.isEmpty()) {
            return true;
        }
        for (Evaluation evaluation : evaluations) {
            if (evaluation != null && !(evaluation instanceof PromptEvaluationDefinition)) {
                return false;
            }
        }
        return true;
    }
}
