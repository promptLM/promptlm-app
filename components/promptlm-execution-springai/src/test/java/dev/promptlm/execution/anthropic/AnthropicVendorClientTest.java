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

package dev.promptlm.execution.anthropic;

import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.core.retry.RetryTemplate;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClient.Builder;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.model.tool.ToolExecutionEligibilityPredicate;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.anthropic.api.AnthropicApi;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.model.tool.ToolCallingChatOptions;
import org.springframework.ai.model.tool.DefaultToolExecutionResult;
import org.springframework.ai.model.tool.ToolExecutionResult;
import org.springframework.ai.tool.definition.ToolDefinition;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AnthropicVendorClientTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(TestConfig.class, AnthropicVendorClient.class);

    @Test
    void executesPromptUsingAnthropicChatModel() {
        contextRunner.run(context -> {
            AnthropicVendorClient client = context.getBean(AnthropicVendorClient.class);
            MockRestServiceServer server = context.getBean(MockRestServiceServer.class);

            server.expect(ExpectedCount.once(), requestTo("http://anthropic.test/v1/messages"))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(jsonPath("$.model").value("claude-3-5-sonnet"))
                    .andExpect(jsonPath("$.max_tokens").value(200))
                    .andExpect(jsonPath("$.temperature").value(0.5))
                    .andExpect(jsonPath("$.top_p").value(0.9))
                    .andExpect(jsonPath("$.top_k").value(10))
                    .andExpect(jsonPath("$.stop_sequences[0]").value("STOP"))
                    .andExpect(jsonPath("$.messages[0].role").value("user"))
                    .andExpect(jsonPath("$.messages[0].content[0].text").value("Hello Anthropic"))
                    .andRespond(withSuccess("""
                            {
                              "type": "message",
                              "role": "assistant",
                              "content": [
                                {
                                  "type": "text",
                                  "text": "Hi there!"
                                }
                              ]
                            }
                            """, MediaType.APPLICATION_JSON));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .withVendor("anthropic")
                    .withModel("claude-3-5-sonnet")
                    .withParameters(Map.of(
                            "temperature", 0.5,
                            "top_p", 0.9,
                            "top_k", 10,
                            "max_output_tokens", 200,
                            "stop_sequences", List.of("STOP")
                    ))
                    .withMessages(List.of(ChatCompletionRequest.Message.builder()
                            .withRole("user")
                            .withContent("Hello Anthropic")
                            .build()))
                    .build();

            PromptSpec promptSpec = PromptSpec.builder()
                    .withName("anthropic-test")
                    .withVersion("1.0.0")
                    .withRevision(1)
                    .withDescription("Anthropic request test")
                    .withRequest(request)
                    .build();

            GatewayResponse response = client.execute(promptSpec);

            server.verify();
            assertThat(response.response()).isNotNull();
        });
    }

    @TestConfiguration
    static class TestConfig {

        @Bean
        Builder restClientBuilder() {
            return RestClient.builder();
        }

        @Bean
        ResponseErrorHandler responseErrorHandler() {
            return new DefaultResponseErrorHandler();
        }

        @Bean
        MockRestServiceServer mockRestServiceServer(Builder restClientBuilder) {
            return MockRestServiceServer.bindTo(restClientBuilder).build();
        }

        @Bean
        RetryTemplate retryTemplate() {
            return new RetryTemplate();
        }

        @Bean
        ToolCallingManager toolCallingManager() {
            return new ToolCallingManager() {
                @Override
                public List<ToolDefinition> resolveToolDefinitions(ToolCallingChatOptions options) {
                    return List.of();
                }

                @Override
                public ToolExecutionResult executeToolCalls(Prompt prompt, ChatResponse response) {
                    return new DefaultToolExecutionResult(List.of(), false);
                }
            };
        }

        @Bean
        ToolExecutionEligibilityPredicate toolExecutionEligibilityPredicate() {
            return (ChatOptions options, ChatResponse response) -> false;
        }

        @Bean
        ObservationRegistry observationRegistry() {
            return ObservationRegistry.create();
        }

        @Bean
        AnthropicApi anthropicApi(Builder restClientBuilder, ResponseErrorHandler responseErrorHandler,
                @SuppressWarnings("unused") MockRestServiceServer server) {
            return AnthropicApi.builder()
                    .baseUrl("http://anthropic.test")
                    .completionsPath("/v1/messages")
                    .apiKey("dummy")
                    .restClientBuilder(restClientBuilder)
                    .responseErrorHandler(responseErrorHandler)
                    .build();
        }

        @Bean
        AnthropicChatModel anthropicChatModel(AnthropicApi anthropicApi, RetryTemplate retryTemplate,
                ToolCallingManager toolCallingManager, ToolExecutionEligibilityPredicate predicate,
                ObservationRegistry observationRegistry) {
            return AnthropicChatModel.builder()
                    .anthropicApi(anthropicApi)
                    .defaultOptions(AnthropicChatOptions.builder().build())
                    .retryTemplate(retryTemplate)
                    .toolCallingManager(toolCallingManager)
                    .toolExecutionEligibilityPredicate(predicate)
                    .observationRegistry(observationRegistry)
                    .build();
        }
    }
}
