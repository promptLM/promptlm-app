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
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnthropicVendorClientTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(TestConfig.class, AnthropicVendorClient.class);

    /**
     * Verifies that AnthropicVendorClient maps all PromptSpec parameters correctly
     * onto AnthropicChatOptions and processes the response.
     */
    @Test
    void executesPromptUsingAnthropicChatModel() {
        contextRunner.run(context -> {
            AnthropicVendorClient client = context.getBean(AnthropicVendorClient.class);
            AnthropicChatModel chatModel = context.getBean(AnthropicChatModel.class);

            ChatResponse stubResponse = new ChatResponse(
                    List.of(new Generation(new AssistantMessage("Hi there!"))));
            ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
            when(chatModel.call(promptCaptor.capture())).thenReturn(stubResponse);

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .withVendor("anthropic")
                    .withModel("claude-3-haiku-20240307")
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

            assertThat(response.response()).isNotNull();

            Prompt capturedPrompt = promptCaptor.getValue();
            assertThat(capturedPrompt.getInstructions()).anyMatch(m -> m.getText().contains("Hello Anthropic"));
            AnthropicChatOptions options = (AnthropicChatOptions) capturedPrompt.getOptions();
            assertThat(options.getModel()).isEqualTo("claude-3-haiku-20240307");
            assertThat(options.getTemperature()).isEqualTo(0.5);
            assertThat(options.getTopP()).isEqualTo(0.9);
            assertThat(options.getTopK()).isEqualTo(10);
            assertThat(options.getMaxTokens()).isEqualTo(200);
            assertThat(options.getStopSequences()).containsExactly("STOP");
        });
    }

    @TestConfiguration
    static class TestConfig {

        @Bean
        AnthropicChatModel anthropicChatModel() {
            return mock(AnthropicChatModel.class);
        }
    }
}
