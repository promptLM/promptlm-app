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

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ChatCompletionRequestTest {

    @Test
    void renderBodyProducesValidJson() throws Exception {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withVendor("openai")
                .withModel("gpt-4")
                .withUrl("http://example.com")
                .withType("chat/completion")
                .withModelSnapshot("snapshot-1")
                .withParameters(Map.of("temperature", 0.7))
                .withMessages(List.of(ChatCompletionRequest.Message.builder()
                        .withRole("user")
                        .withContent("Hello")
                        .build()))
                .build();

        String json = request.renderBody();
        assertNotNull(json);
        assertFalse(json.isEmpty());

        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(json);

        assertEquals("gpt-4", node.get("model").asText());
        assertTrue(node.get("messages").isArray());
        assertEquals("Hello", node.get("messages").get(0).get("content").asText());
        assertEquals(0.7, node.get("parameters").get("temperature").asDouble(), 0.0001);
    }

    @Test
    void renderBodyIncludesSystemRole() throws Exception {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withMessages(List.of(ChatCompletionRequest.Message.builder()
                        .withRole("system")
                        .withContent("System message")
                        .build()))
                .build();

        String json = request.renderBody();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(json);

        assertEquals("system", node.get("messages").get(0).get("role").asText());
    }

    @Test
    void renderBodyIncludesAssistantRole() throws Exception {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withMessages(List.of(ChatCompletionRequest.Message.builder()
                        .withRole("assistant")
                        .withContent("Assistant message")
                        .build()))
                .build();

        String json = request.renderBody();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(json);

        assertEquals("assistant", node.get("messages").get(0).get("role").asText());
    }

}
