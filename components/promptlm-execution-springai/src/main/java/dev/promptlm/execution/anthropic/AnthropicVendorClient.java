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

import dev.promptlm.execution.SpringAiVendorClient;
import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.execution.util.PromptSpecUtils;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import com.anthropic.models.messages.Model;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Anthropic vendor integration backed by Spring AI.
 */
@Component
public class AnthropicVendorClient implements SpringAiVendorClient {

    private static final Set<String> SUPPORTED_MODELS;
    private static final Set<String> CATALOG_MODELS;

    static {
        Set<String> supported = new java.util.HashSet<>();
        Set<String> catalog = new java.util.HashSet<>();
        for (java.lang.reflect.Field field : Model.class.getDeclaredFields()) {
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())
                    && Model.class.isAssignableFrom(field.getType())) {
                try {
                    Model model = (Model) field.get(null);
                    String modelId = model.asString();
                    if (modelId != null && !modelId.isBlank()) {
                        catalog.add(modelId.trim());
                        supported.add(normalize(modelId));
                        supported.add(normalize(field.getName()));
                        supported.add(normalize(field.getName().replace('_', '-')));
                    }
                } catch (IllegalAccessException ignored) {
                }
            }
        }
        SUPPORTED_MODELS = Set.copyOf(supported);
        CATALOG_MODELS = Set.copyOf(catalog);
    }

    private final AnthropicChatModel chatModel;

    public AnthropicVendorClient(AnthropicChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public String vendor() {
        return "anthropic";
    }

    @Override
    public boolean supportsModel(String model) {
        String normalized = normalize(model);
        return normalized.isEmpty() || SUPPORTED_MODELS.contains(normalized);
    }

    @Override
    public Set<String> catalogModels() {
        return CATALOG_MODELS;
    }

    @Override
    public GatewayResponse execute(PromptSpec promptSpec) {
        if (!(promptSpec.getRequest() instanceof ChatCompletionRequest chatRequest)) {
            throw new UnsupportedOperationException("Spring AI Anthropic client only supports chat/completion requests");
        }

        String model = chatRequest.getModel();
        if (!supportsModel(model)) {
            throw new IllegalStateException("Unsupported Anthropic model: " + model);
        }

        AnthropicChatOptions.Builder builder = AnthropicChatOptions.builder();
        if (model != null && !model.isBlank()) {
            builder.model(model.trim());
        }
        Map<String, Object> parameters = chatRequest.getParameters();
        if (parameters != null) {
            PromptSpecUtils.getDoubleParameter(parameters, "temperature").ifPresent(builder::temperature);
            PromptSpecUtils.getIntegerParameter(parameters, "max_output_tokens").ifPresent(builder::maxTokens);
            PromptSpecUtils.getDoubleParameter(parameters, "top_p").ifPresent(builder::topP);
            PromptSpecUtils.getIntegerParameter(parameters, "top_k").ifPresent(builder::topK);
            extractStringList(parameters, "stop_sequences").ifPresent(builder::stopSequences);
        }

        Prompt prompt = new Prompt(
                PromptSpecUtils.extractMessages(chatRequest, promptSpec.getPlaceholders()),
                builder.build()
        );

        ChatResponse chatResponse = chatModel.call(prompt);

        String content = chatResponse.getResult().getOutput().getText();
        ChatCompletionResponse response = new ChatCompletionResponse();
        response.setContent(content);
        return GatewayResponse.of(response);
    }

    private static String normalize(String model) {
        return model == null ? "" : model.trim().toLowerCase(Locale.ROOT);
    }

    private static java.util.Optional<List<String>> extractStringList(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        if (value instanceof List<?> list) {
            List<String> strings = list.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (!strings.isEmpty()) {
                return java.util.Optional.of(strings);
            }
        }
        return java.util.Optional.empty();
    }
}
