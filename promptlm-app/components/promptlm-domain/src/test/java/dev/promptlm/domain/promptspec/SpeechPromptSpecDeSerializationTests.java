package dev.promptlm.domain.promptspec;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class SpeechPromptSpecDeSerializationTests {

    public static final java.util.UUID UUID = java.util.UUID.randomUUID();
    public static final String ID = "1123";
    private final ObjectMapper mapper = ObjectMapperFactory.createYamlMapper();

    @Nested
    class PromptDeSerializationWithAudioSpeechRequest {
        private static final String AUDIO_SPEECH_YAML = """
                ---
                specVersion: null
                uuid: %s
                id: %s
                name: Chat Spec
                group: some-group
                version: 1.0
                revision: 1
                description: Sample Chat
                authors:
                - fabapp2
                purpose: Test
                repositoryUrl: some-store
                status: ACTIVE
                createdAt: null
                updatedAt: null
                retiredAt: null
                retiredReason: null
                request: !<audio/speech>
                  vendor: OpenAi
                  model: gpt-3.5-turbo
                  url: https://openai.url
                  type: audio/speech
                  input: "Hello, my name is"
                  voice: echo
                  responseFormat: MP3
                  speed: 1.2
                placeholders: null
                response: !<chat/completion>
                  content: The response
                extensions:
                  x-evaluation:
                    spec:
                      evaluations: []
                    results:
                      evaluations: []
                      status: NOT_CONFIGURED
                path: group/id12124/promptlm.yml
                executions: null
                semanticHash: null
                """.formatted(UUID, ID);

        private static final AudioSpeechRequest AUDIO_SPEECH_REQUEST = AudioSpeechRequest.builder()
                .withVendor("OpenAi")
                .withUrl("https://openai.url")
                .withSpeed(1.2f)
                .withModel("gpt-3.5-turbo")
                .withInput("Hello, my name is")
                .withVoice("echo")
                .withResponseFormat(ResponseFormat.MP3)
                .build();

        private static final PromptSpec PROMPT_SPEC = getPromptSpec(AUDIO_SPEECH_REQUEST);

        @Test
        @DisplayName("serialize")
        void serialize() throws JacksonException {
            String s = mapper.writeValueAsString(PROMPT_SPEC);
            assertThat(s).isEqualTo(AUDIO_SPEECH_YAML);
        }

        @Test
        @DisplayName("deserialize")
        void deserialize() throws JacksonException {
            PromptSpec promptSpec = mapper.readValue(AUDIO_SPEECH_YAML, PromptSpec.class);
            assertThat(promptSpec).usingRecursiveAssertion().isEqualTo(PROMPT_SPEC);
        }
    }


    private static PromptSpec getPromptSpec(Request request) {
        Response response = new ChatCompletionResponse(null, null, "The response");
        EvaluationResults evaluationResults = new EvaluationResults(List.of());
        Path path = Path.of("group/id12124/promptlm.yml");
        List<String> authors = List.of("fabapp2");
        String purpose = "Test";
        String repository = "some-store";
        String group = "some-group";
        EvaluationSpec evaluationSpec = new EvaluationSpec(List.of());
        Map<String, JsonNode> extensions = evaluationExtensions(evaluationSpec, evaluationResults);
        PromptSpec.Placeholders placeholders = null;
        return new PromptSpec(
                null,               // specVersion
                UUID,               // uuid
                ID,                 // id
                "Chat Spec",        // name
                group,              // group
                "1.0",              // version
                1,                  // revision
                "Sample Chat",      // description
                authors,            // authors
                purpose,            // purpose
                repository,         // repositoryUrl
                PromptSpec.PromptStatus.ACTIVE,  // status
                null,               // createdAt
                null,               // updatedAt
                null,               // retiredAt
                null,               // retiredReason
                request,            // request
                placeholders,       // placeholders
                response,           // response
                extensions,         // extensions
                path,               // path
                null                // executions
        );
    }

    private static Map<String, JsonNode> evaluationExtensions(EvaluationSpec evaluationSpec, EvaluationResults evaluationResults) {
        ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
        ObjectNode node = mapper.createObjectNode();
        node.set("spec", mapper.valueToTree(evaluationSpec));
        node.set("results", mapper.valueToTree(evaluationResults));
        return Map.of("x-evaluation", node);
    }



}
