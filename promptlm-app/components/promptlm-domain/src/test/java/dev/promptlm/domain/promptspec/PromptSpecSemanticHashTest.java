package dev.promptlm.domain.promptspec;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PromptSpecSemanticHashTest {

    @Test
    void hashChangesWhenMessagesChange() {
        PromptSpec first = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat");
        PromptSpec second = createSpec("Respond as {{product}} bot.", "PromptLM", "Sample Chat");

        assertNotEquals(first.computeSemanticHash(), second.computeSemanticHash());
    }

    @Test
    void hashChangesWhenPlaceholderDefaultsChange() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat");
        PromptSpec updated = createSpec("You are a helper for {{product}}.", "PromptLM Pro", "Sample Chat");

        assertNotEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashChangesWhenToolDefinitionsChange() {
        PromptSpec original = createSpecWithParameters(
                "You are a helper for {{product}}.",
                "PromptLM",
                "Sample Chat",
                chatParametersWithToolDescription("Get current weather for a city")
        );
        PromptSpec updated = createSpecWithParameters(
                "You are a helper for {{product}}.",
                "PromptLM",
                "Sample Chat",
                chatParametersWithToolDescription("Get current weather and forecast for a city")
        );

        assertNotEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashChangesWhenEvaluationSpecChanges() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withEvaluationSpec(new EvaluationSpec(List.of(new StaticEvaluation("heuristic", "quality", "strict"))));
        PromptSpec updated = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withEvaluationSpec(new EvaluationSpec(List.of(new StaticEvaluation("heuristic", "quality", "lenient"))));

        assertNotEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashChangesWhenExtensionSpecChanges() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withExtensions(extensionsWithSpecAndResults("strict", 0.7));
        PromptSpec updated = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withExtensions(extensionsWithSpecAndResults("lenient", 0.7));

        assertNotEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashRemainsStableWhenEvaluationResultsChange() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withEvaluationResults(new EvaluationResults(List.of(
                        new EvaluationResult("heuristic", "quality", 0.9, "Good", null)
                )));
        PromptSpec updated = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withEvaluationResults(new EvaluationResults(List.of(
                        new EvaluationResult("heuristic", "quality", 0.4, "Needs work", null)
                )));

        assertEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashRemainsStableWhenExtensionResultsChange() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withExtensions(extensionsWithSpecAndResults("strict", 0.9));
        PromptSpec updated = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withExtensions(extensionsWithSpecAndResults("strict", 0.4));

        assertEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashRemainsStableWhenResponseChanges() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withResponse(new ChatCompletionResponse(null, null, "Old response"));
        PromptSpec updated = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat")
                .withResponse(new ChatCompletionResponse(null, null, "New response"));

        assertEquals(original.computeSemanticHash(), updated.computeSemanticHash());
    }

    @Test
    void hashRemainsStableWhenMetadataChanges() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat");
        PromptSpec renamed = original.withDescription("New description");

        assertEquals(original.computeSemanticHash(), renamed.computeSemanticHash());
    }

    @Test
    void detectsSemanticChangesComparedToAnotherSpec() {
        PromptSpec original = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat");
        PromptSpec changed = createSpec("Respond boldly, {{product}} bot.", "PromptLM", "Sample Chat");

        assertTrue(changed.hasSemanticChangesComparedTo(original));
        assertFalse(original.hasSemanticChangesComparedTo(original.withDescription("Docs only")));
    }

    @Test
    void reportsWhenStoredHashIsOutOfDate() {
        PromptSpec spec = createSpec("You are a helper for {{product}}.", "PromptLM", "Sample Chat");
        PromptSpec hashed = spec.withSemanticHashComputed();

        ChatCompletionRequest changedRequest = ((ChatCompletionRequest) hashed.getRequest()).withMessages(List.of(
                ChatCompletionRequest.Message.builder()
                        .withRole("system")
                        .withContent("Different {{product}} guidance.")
                        .build()
        ));
        PromptSpec stale = hashed.withRequest(changedRequest);

        assertTrue(hashed.isSemanticHashUpToDate());
        assertFalse(stale.isSemanticHashUpToDate());
    }

    @Test
    void typedBuilderPopulatesSemanticHashField() {
        PromptSpec spec = PromptSpecBuilder.builder()
                .withGroup("chat-group")
                .withName("chat-spec")
                .withVersion("1.0")
                .withRevision(1)
                .withDescription("Sample Chat")
                .withRequest(chatRequest("Hello {{product}}"))
                .withPlaceholders(placeholders("PromptLM"))
                .build();

        assertNotNull(spec.getSemanticHash());
        assertEquals(spec.computeSemanticHash(), spec.getSemanticHash());
    }

    private static PromptSpec createSpec(String messageContent, String placeholderValue, String description) {
        return createSpecWithParameters(
                messageContent,
                placeholderValue,
                description,
                Map.of("temperature", 0.7, "maxTokens", 200)
        );
    }

    private static PromptSpec createSpecWithParameters(String messageContent,
                                                       String placeholderValue,
                                                       String description,
                                                       Map<String, Object> parameters) {
        return PromptSpec.builder()
                .withGroup("chat-group")
                .withName("chat-spec")
                .withVersion("1.0")
                .withRevision(1)
                .withDescription(description)
                .withRequest(chatRequest(messageContent, parameters))
                .withPlaceholders(placeholders(placeholderValue))
                .build();
    }

    private static ChatCompletionRequest chatRequest(String messageContent) {
        return chatRequest(messageContent, Map.of("temperature", 0.7, "maxTokens", 200));
    }

    private static ChatCompletionRequest chatRequest(String messageContent, Map<String, Object> parameters) {
        return ChatCompletionRequest.builder()
                .withVendor("OpenAI")
                .withModel("gpt-4o")
                .withUrl("https://api.promptlm.dev")
                .withParameters(parameters)
                .withMessages(List.of(
                        ChatCompletionRequest.Message.builder()
                                .withRole("system")
                                .withContent(messageContent)
                                .build()
                ))
                .build();
    }

    private static Map<String, Object> chatParametersWithToolDescription(String toolDescription) {
        return Map.of(
                "temperature", 0.7,
                "maxTokens", 200,
                "tools", List.of(
                        Map.of(
                                "type", "function",
                                "function", Map.of(
                                        "name", "get_weather",
                                        "description", toolDescription,
                                        "parameters", Map.of(
                                                "type", "object",
                                                "properties", Map.of(
                                                        "city", Map.of("type", "string")
                                                ),
                                                "required", List.of("city")
                                        )
                                )
                        )
                )
        );
    }

    private static PromptSpec.Placeholders placeholders(String productValue) {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern("{{");
        placeholders.setEndPattern("}}");
        placeholders.setList(List.of(new PromptSpec.Placeholder("product", productValue)));
        return placeholders;
    }

    private static Map<String, JsonNode> extensionsWithSpecAndResults(String policy, double score) {
        ObjectMapper mapper = new ObjectMapper();
        return Map.of(
                "x-evaluation",
                mapper.valueToTree(Map.of(
                        "spec", Map.of("policy", policy),
                        "results", Map.of("score", score)
                ))
        );
    }

    private record StaticEvaluation(String evaluator, String type, String description) implements Evaluation {
        @Override
        public EvaluationResult evaluate(Response response) {
            return new EvaluationResult(evaluator, type, 1.0, description, null);
        }
    }
}
