package dev.promptlm.domain.promptspec;

import tools.jackson.databind.JacksonModule;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.module.SimpleAbstractTypeResolver;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;

import java.util.LinkedHashMap;
import java.util.Map;

public final class EvaluationExtensions {
    public static final String KEY = "x-evaluation";
    private static final String SPEC_KEY = "spec";
    private static final String RESULTS_KEY = "results";
    private static volatile ObjectMapper MAPPER = createMapper();

    private EvaluationExtensions() {
    }

    /**
     * Allows commercial modules to register additional evaluation subtypes.
     */
    public static void registerModule(JacksonModule module) {
        if (module != null) {
            synchronized (EvaluationExtensions.class) {
                MAPPER = MAPPER.rebuild().addModule(module).build();
            }
        }
    }

    public static EvaluationSpec readSpec(Map<String, JsonNode> extensions) {
        JsonNode specNode = readEvaluationNode(extensions, SPEC_KEY);
        if (specNode == null || specNode.isNull()) {
            return null;
        }
        return MAPPER.convertValue(specNode, EvaluationSpec.class);
    }

    public static EvaluationResults readResults(Map<String, JsonNode> extensions) {
        JsonNode resultsNode = readEvaluationNode(extensions, RESULTS_KEY);
        if (resultsNode == null || resultsNode.isNull()) {
            return null;
        }
        return MAPPER.convertValue(resultsNode, EvaluationResults.class);
    }

    public static Map<String, JsonNode> withSpec(Map<String, JsonNode> extensions, EvaluationSpec spec) {
        return withEvaluation(extensions, spec, null, false);
    }

    public static Map<String, JsonNode> withResults(Map<String, JsonNode> extensions, EvaluationResults results) {
        return withEvaluation(extensions, null, results, false);
    }

    public static Map<String, JsonNode> withEvaluation(Map<String, JsonNode> extensions,
                                                       EvaluationSpec spec,
                                                       EvaluationResults results) {
        return withEvaluation(extensions, spec, results, true);
    }

    private static Map<String, JsonNode> withEvaluation(Map<String, JsonNode> extensions,
                                                        EvaluationSpec spec,
                                                        EvaluationResults results,
                                                        boolean replaceMissing) {
        Map<String, JsonNode> updated = (extensions == null || extensions.isEmpty())
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(extensions);

        ObjectNode evaluationNode = resolveEvaluationNode(updated);
        if (spec != null) {
            evaluationNode.set(SPEC_KEY, MAPPER.valueToTree(spec));
        } else if (replaceMissing) {
            evaluationNode.remove(SPEC_KEY);
        }
        if (results != null) {
            evaluationNode.set(RESULTS_KEY, MAPPER.valueToTree(results));
        } else if (replaceMissing) {
            evaluationNode.remove(RESULTS_KEY);
        }

        if (evaluationNode.isEmpty()) {
            updated.remove(KEY);
        } else {
            updated.put(KEY, evaluationNode);
        }
        return updated;
    }

    private static ObjectNode resolveEvaluationNode(Map<String, JsonNode> extensions) {
        JsonNode existing = extensions.get(KEY);
        if (existing != null && existing.isObject()) {
            return ((ObjectNode) existing).deepCopy();
        }
        return MAPPER.createObjectNode();
    }

    private static JsonNode readEvaluationNode(Map<String, JsonNode> extensions, String key) {
        if (extensions == null || extensions.isEmpty()) {
            return null;
        }
        JsonNode evaluation = extensions.get(KEY);
        if (evaluation == null || !evaluation.isObject()) {
            return null;
        }
        return evaluation.get(key);
    }

    private static ObjectMapper createMapper() {
        ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
        SimpleAbstractTypeResolver resolver = new SimpleAbstractTypeResolver();
        resolver.addMapping(Evaluation.class, PromptEvaluationDefinition.class);
        SimpleModule module = new SimpleModule();
        module.setAbstractTypes(resolver);
        return mapper.rebuild().addModule(module).build();
    }
}
