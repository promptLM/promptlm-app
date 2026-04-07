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

package dev.promptlm.execution.util;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public final class PromptSpecUtils {

    private PromptSpecUtils() {
    }

    public static List<Message> extractMessages(ChatCompletionRequest request, PromptSpec.Placeholders placeholders) {
        if (request == null || request.getMessages() == null || request.getMessages().isEmpty()) {
            return new ArrayList<>();
        }

        return request.getMessages().stream()
                .map(message -> mapMessage(message, placeholders))
                .toList();
    }

    public static OpenAiChatOptions extractOptions(PromptSpec promptSpec) {
        OpenAiChatOptions.Builder builder = OpenAiChatOptions.builder();
        if (promptSpec.getRequest() != null) {
            builder.model(promptSpec.getRequest().getModel());
        }

        if (promptSpec.getRequest() instanceof ChatCompletionRequest chatRequest) {
            Map<String, Object> parameters = chatRequest.getParameters();
            if (parameters != null) {
                getDoubleParameter(parameters, "temperature").ifPresent(builder::temperature);
                getDoubleParameter(parameters, "top_p").ifPresent(builder::topP);
                getIntegerParameter(parameters, "max_tokens").ifPresent(builder::maxTokens);
                getDoubleParameter(parameters, "frequency_penalty").ifPresent(builder::frequencyPenalty);
                getDoubleParameter(parameters, "presence_penalty").ifPresent(builder::presencePenalty);
                getBooleanParameter(parameters, "stream").ifPresent(builder::streamUsage);
            }
        }

        return builder.build();
    }

    private static Message mapMessage(ChatCompletionRequest.Message message, PromptSpec.Placeholders placeholders) {
        String text = resolveText(message.getContent(), placeholders);
        String role = message.getRole() == null ? "user" : message.getRole().toLowerCase(Locale.ROOT);
        return switch (role) {
            case "system" -> new SystemMessage(text);
            case "assistant" -> new AssistantMessage(text);
            case "user" -> new UserMessage(text);
            default -> new UserMessage(text);
        };
    }

    private static String resolveText(String raw, PromptSpec.Placeholders placeholders) {
        if (raw == null) {
            return "";
        }

        if (placeholders == null) {
            return raw;
        }

        Map<String, String> defaults = placeholders.getDefaults();
        if (defaults == null || defaults.isEmpty()) {
            return raw;
        }

        String result = raw;
        String start = placeholders.getStartPattern() != null ? placeholders.getStartPattern() : "{{";
        String end = placeholders.getEndPattern() != null ? placeholders.getEndPattern() : "}}";

        for (Map.Entry<String, String> entry : defaults.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }
            String placeholder = start + entry.getKey() + end;
            result = result.replace(placeholder, entry.getValue());
        }
        return result;
    }

    public static Optional<Double> getDoubleParameter(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        if (value instanceof Number number) {
            return Optional.of(number.doubleValue());
        }
        if (value instanceof String str) {
            try {
                return Optional.of(Double.parseDouble(str));
            }
            catch (NumberFormatException ignored) {
            }
        }
        return Optional.empty();
    }

    public static Optional<Integer> getIntegerParameter(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        if (value instanceof Number number) {
            return Optional.of(number.intValue());
        }
        if (value instanceof String str) {
            try {
                return Optional.of(Integer.parseInt(str));
            }
            catch (NumberFormatException ignored) {
            }
        }
        return Optional.empty();
    }

    public static Optional<Boolean> getBooleanParameter(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        if (value instanceof Boolean bool) {
            return Optional.of(bool);
        }
        if (value instanceof String str) {
            return Optional.of(Boolean.parseBoolean(str));
        }
        return Optional.empty();
    }
}
