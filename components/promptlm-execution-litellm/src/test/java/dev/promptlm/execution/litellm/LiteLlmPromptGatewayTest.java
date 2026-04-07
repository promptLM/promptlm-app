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

package dev.promptlm.execution.litellm;

import dev.promptlm.execution.gateway.GatewayRequest;
import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

class LiteLlmPromptGatewayTest {

    private LiteLlmGatewayProperties properties;

    private RestClient restClient;

    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        properties = new LiteLlmGatewayProperties();
        properties.setVendor("litellm");
        properties.setBaseUrl("http://localhost");
        Map<String, String> aliases = new HashMap<>();
        aliases.put("gpt-4o", "gpt-4o-prod");
        properties.setModelAliases(aliases);

        RestClient.Builder builder = RestClient.builder().baseUrl(properties.getBaseUrl());
        server = MockRestServiceServer.bindTo(builder).build();
        restClient = builder.build();
    }

    @Test
    void shouldRejectWhenGatewayInactive() {
        LiteLlmPromptGateway gateway = new LiteLlmPromptGateway(properties, restClient, false);
        assertThat(gateway.supports("litellm", "gpt-4o")).isFalse();

        PromptSpec promptSpec = buildPromptSpec("litellm", "gpt-4o");
        GatewayRequest request = GatewayRequest.from(promptSpec);
        assertThatThrownBy(() -> gateway.execute(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void shouldExecuteAgainstLiteLlm() {
        LiteLlmPromptGateway gateway = new LiteLlmPromptGateway(properties, restClient, true);

        PromptSpec promptSpec = buildPromptSpec("litellm", "gpt-4o");
        GatewayRequest request = GatewayRequest.from(promptSpec);

        server.expect(requestTo("http://localhost/v1/chat/completions"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().string(containsString("\\\"model\\\":\\\"gpt-4o-prod\\\"")))
                .andRespond(withSuccess("""
                        {
                          "type": "chat/completion",
                          "content": "Hello from LiteLLM"
                        }
                        """, MediaType.APPLICATION_JSON));

        GatewayResponse response = gateway.execute(request);
        assertThat(response.response())
                .isInstanceOf(ChatCompletionResponse.class);
        assertThat(((ChatCompletionResponse) response.response()).getContent())
                .isEqualTo("Hello from LiteLLM");

        server.verify();
    }

    @Test
    void shouldRespectModelAliases() {
        LiteLlmPromptGateway gateway = new LiteLlmPromptGateway(properties, restClient, true);

        assertThat(gateway.supports("litellm", "gpt-4o")).isTrue();
        assertThat(gateway.supports("litellm", "unknown-model")).isFalse();
    }

    @Test
    void shouldAllowAnyModelWhenAliasesEmpty() {
        LiteLlmGatewayProperties noAliasProperties = new LiteLlmGatewayProperties();
        noAliasProperties.setVendor("litellm");
        noAliasProperties.setBaseUrl("http://localhost");
        noAliasProperties.setModelAliases(Map.of());

        LiteLlmPromptGateway gateway = new LiteLlmPromptGateway(noAliasProperties, restClient, true);

        assertThat(gateway.supports("litellm", "unknown-model")).isTrue();
    }

    @Test
    void shouldExposeLiteLlmHttpErrorDetails() {
        LiteLlmPromptGateway gateway = new LiteLlmPromptGateway(properties, restClient, true);
        PromptSpec promptSpec = buildPromptSpec("litellm", "gpt-4o");

        server.expect(requestTo("http://localhost/v1/chat/completions"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"rate limit\"}"));

        assertThatThrownBy(() -> gateway.execute(GatewayRequest.from(promptSpec)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("429")
                .hasMessageContaining("rate limit");
    }

    private PromptSpec buildPromptSpec(String vendor, String model) {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withVendor(vendor)
                .withModel(model)
                .withType(ChatCompletionRequest.TYPE)
                .withMessages(List.of(ChatCompletionRequest.Message.builder()
                        .withRole("user")
                        .withContent("Hello")
                        .build()))
                .build();

        return PromptSpec.builder()
                .withGroup("default")
                .withName("sample")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("Sample prompt")
                .withRequest(request)
                .build();
    }
}
