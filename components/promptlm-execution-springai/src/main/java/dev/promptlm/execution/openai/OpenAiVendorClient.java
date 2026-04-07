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

package dev.promptlm.execution.openai;

import dev.promptlm.execution.SpringAiVendorClient;
import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.execution.util.PromptSpecUtils;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class OpenAiVendorClient implements SpringAiVendorClient {

    private final ChatClient.Builder chatClientBuilder;

    public OpenAiVendorClient(OpenAiChatModel chatModel) {
        this.chatClientBuilder = ChatClient.builder(chatModel);
    }

    private static final Set<String> ADDITIONAL_MODEL_ALIASES = Stream.of(
                    "gpt-4o",
                    "gpt-4o-mini",
                    "gpt-4o-audio-preview",
                    "gpt-4o-realtime-preview",
                    "gpt-4o-mini-realtime-preview",
                    "gpt-4o-search-preview",
                    "gpt-4o-mini-search-preview")
            .map(OpenAiVendorClient::normalizeModel)
            .collect(Collectors.toUnmodifiableSet());

    private static final Set<String> ADDITIONAL_CATALOG_MODELS = Set.of(
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4o-audio-preview",
            "gpt-4o-realtime-preview",
            "gpt-4o-mini-realtime-preview",
            "gpt-4o-search-preview",
            "gpt-4o-mini-search-preview");

    private static final Set<String> CATALOG_MODELS;

    private static final Set<String> SUPPORTED_MODEL_ALIASES;

    static {
        LinkedHashSet<String> catalog = Arrays.stream(OpenAiApi.ChatModel.values())
                .map(OpenAiApi.ChatModel::getValue)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        catalog.addAll(ADDITIONAL_CATALOG_MODELS);
        CATALOG_MODELS = Collections.unmodifiableSet(catalog);

        LinkedHashSet<String> aliases = Stream.concat(
                        Arrays.stream(OpenAiApi.ChatModel.values())
                                .flatMap(model -> Stream.of(
                                        model.getValue(),
                                        model.getName(),
                                        model.name(),
                                        model.name().replace('_', '-'))
                                        .map(OpenAiVendorClient::normalizeModel)),
                        ADDITIONAL_MODEL_ALIASES.stream())
                .filter(alias -> !alias.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        SUPPORTED_MODEL_ALIASES = Collections.unmodifiableSet(aliases);
    }

    @Override
    public String vendor() {
        return "openai";
    }

    @Override
    public boolean supportsModel(String model) {
        String normalized = normalizeModel(model);
        return normalized.isEmpty() || SUPPORTED_MODEL_ALIASES.contains(normalized);
    }

    @Override
    public Set<String> catalogModels() {
        return CATALOG_MODELS;
    }

    @Override
    public GatewayResponse execute(PromptSpec promptSpec) {
        if (!(promptSpec.getRequest() instanceof ChatCompletionRequest chatRequest)) {
            throw new UnsupportedOperationException("Spring AI OpenAI client only supports chat/completion requests");
        }

        String model = chatRequest.getModel();
        if (!supportsModel(model)) {
            throw new IllegalStateException("Unsupported OpenAI model: " + model);
        }

        OpenAiChatOptions requestOptions = PromptSpecUtils.extractOptions(promptSpec);
        OpenAiChatOptions options = requestOptions.copy();
        if (model != null && !model.trim().isEmpty()) {
            options.setModel(model.trim());
        }
        Prompt prompt = new Prompt(
                PromptSpecUtils.extractMessages(chatRequest, promptSpec.getPlaceholders()),
                options
        );

        ChatResponse chatResponse = chatClientBuilder.build()
                .prompt(prompt)
                .call()
                .chatResponse();

        String content = chatResponse.getResult().getOutput().getText();
        ChatCompletionResponse response = new ChatCompletionResponse();
        response.setContent(content);
        return GatewayResponse.of(response);
    }

    private static String normalizeModel(String model) {
        return model == null ? "" : model.trim().toLowerCase(Locale.ROOT);
    }
}
