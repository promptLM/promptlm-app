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

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.*;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

public class ChatRequestPromptDeSerializationTests {

    public static final UUID UUID = java.util.UUID.randomUUID();
    public static final String ID = "12424";
    private final ObjectMapper mapper = ObjectMapperFactory.createYamlMapper();

    public static final String CHAT_YAML = """
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
            request: !<chat/completion>
              vendor: OpenAI
              model: gpt-3.5-turbo
              url: https://openai.url
              messages:
              - content: You are a happy assistant.
                role: system
                name: null
              - content: How are you?
                role: user
                name: null
            placeholders: null
            response: !<chat/completion>
              content: |
                I'm happy.
                Because I am a happy assistant.              
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


    public static final ChatCompletionRequest CHAT_REQUEST = getChatRequest();
    public static final PromptSpec PROMPT_SPEC = getPromptSpec();

    @Test
    void serialize() throws JacksonException {
        String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(PROMPT_SPEC);
        assertThat(json).isEqualTo(CHAT_YAML);
    }

    @Test
    public void deserialize() throws Exception {
        PromptSpec actual = mapper.readValue(CHAT_YAML, PromptSpec.class);
        assertThat(actual).usingRecursiveAssertion().isEqualTo(PROMPT_SPEC);
    }

    private static ChatCompletionRequest getChatRequest() {
        ChatCompletionRequest request = new ChatCompletionRequest();
        request.setVendor("OpenAI");
        request.setUrl("https://openai.url");
        request.setModel("gpt-3.5-turbo");
        request.setMessages(
                List.of(
                        new ChatCompletionRequest.Message("You are a happy assistant.", "system", null),
                        new ChatCompletionRequest.Message("How are you?", "user", null)
                )
        );
        return request;
    }


    private static PromptSpec getPromptSpec() {
        Request request = getChatRequest();
        Response response = new ChatCompletionResponse(null, null, """
                I'm happy.
                Because I am a happy assistant.
                """);
        EvaluationResults evaluationResults = new EvaluationResults(List.of());
        Path path = Path.of("group/id12124/promptlm.yml");
        List<String> authors = List.of("fabapp2");
        String purpose = "Test";
        String repository = "some-store";
        String group = "some-group";
        EvaluationSpec evaluationSpec = new EvaluationSpec(List.of());
        Map<String, JsonNode> extensions = evaluationExtensions(evaluationSpec, evaluationResults);
        int revision = 1;
        PromptSpec.Placeholders placeholders = null;
        return new PromptSpec(
                null,               // specVersion
                UUID,               // uuid
                ID,                 // id
                "Chat Spec",        // name
                group,              // group
                "1.0",              // version
                revision,           // revision
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
