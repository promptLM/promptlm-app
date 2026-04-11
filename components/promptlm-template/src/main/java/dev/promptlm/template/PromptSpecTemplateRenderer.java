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

package dev.promptlm.template;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Request;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class PromptSpecTemplateRenderer {

    private final ObjectMapper yamlMapper;

    public PromptSpecTemplateRenderer(@Qualifier("modelYamlMapper") ObjectMapper yamlMapper) {
        this.yamlMapper = yamlMapper;
    }

    public PromptSpec createPromptSpecFromTemplate(String template,
                                                   String group,
                                                   String name,
                                                   List<ChatCompletionRequest.Message> messages,
                                                   Map<String, String> placeholder,
                                                   PromptSpec.Placeholders overrides) {
        try {
            PromptSpec templateSpec = yamlMapper.readValue(template, PromptSpec.class);

            PromptSpec.Placeholders mergedPlaceholders = mergePlaceholders(templateSpec.getPlaceholders(), placeholder, overrides);
            Request updatedRequest = updateRequest(templateSpec.getRequest(), messages);

            return PromptSpec.builderFrom(templateSpec)
                    .withGroup(group)
                    .withName(name)
                    .withVersion(templateSpec.getVersion())
                    .withRevision(templateSpec.getRevision())
                    .withDescription(templateSpec.getDescription())
                    .withRequest(updatedRequest)
                    .withStatus(PromptSpec.PromptStatus.ACTIVE)
                    .withPlaceholders(mergedPlaceholders)
                    .build();
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        }
    }

    private Request updateRequest(Request templateRequest, List<ChatCompletionRequest.Message> messages) {
        if (messages == null || messages.isEmpty()) {
            return templateRequest;
        }

        if (!(templateRequest instanceof ChatCompletionRequest chatRequest)) {
            throw new IllegalArgumentException("Template request must be a ChatCompletionRequest to override messages");
        }

        List<ChatCompletionRequest.Message> mergedMessages = new ArrayList<>();
        if (chatRequest.getMessages() != null) {
            mergedMessages.addAll(chatRequest.getMessages());
        }
        mergedMessages.addAll(messages);

        return chatRequest.withMessages(mergedMessages);
    }

    private PromptSpec.Placeholders mergePlaceholders(PromptSpec.Placeholders templatePlaceholders,
                                                      Map<String, String> overrides,
                                                      PromptSpec.Placeholders overridePlaceholders) {

        PromptSpec.Placeholders basePlaceholders =
                templatePlaceholders != null ? templatePlaceholders : new PromptSpec.Placeholders();

        PromptSpec.Placeholders merged = new PromptSpec.Placeholders();
        String overrideStart = overridePlaceholders != null ? overridePlaceholders.getStartPattern() : null;
        String overrideEnd = overridePlaceholders != null ? overridePlaceholders.getEndPattern() : null;
        merged.setStartPattern(overrideStart != null ? overrideStart : basePlaceholders.getStartPattern());
        merged.setEndPattern(overrideEnd != null ? overrideEnd : basePlaceholders.getEndPattern());

        List<PromptSpec.Placeholder> mergedList = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Map<String, String> remainingOverrides = overrides != null ? new HashMap<>(overrides) : new HashMap<>();

        if (basePlaceholders.getList() != null) {
            for (PromptSpec.Placeholder placeholder : basePlaceholders.getList()) {
                String placeholderName = placeholder.getName();
                seen.add(placeholderName);
                if (remainingOverrides.containsKey(placeholderName)) {
                    mergedList.add(new PromptSpec.Placeholder(placeholderName,
                            remainingOverrides.remove(placeholderName)));
                } else {
                    mergedList.add(placeholder);
                }
            }
        }

        remainingOverrides.forEach((name, value) -> {
            if (seen.add(name)) {
                mergedList.add(new PromptSpec.Placeholder(name, value));
            }
        });

        merged.setList(mergedList);
        return merged;
    }
}
