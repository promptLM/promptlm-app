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

package dev.promptlm.cli;


import dev.promptlm.lifecycle.PromptLifecycleFacade;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.infrastructure.config.SerializingAppContext;
import dev.promptlm.store.api.PromptStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.shell.core.command.annotation.Option;
import org.springframework.shell.core.command.availability.Availability;
import org.springframework.shell.core.command.availability.AvailabilityProvider;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class PromptCommands {

    private final ObjectProvider<PromptRenderer> promptRendererProvider;
    private final ObjectProvider<PromptStore> promptStoreProvider;
    private final ObjectProvider<PromptLifecycleFacade> promptLifecycleFacadeProvider;

    public PromptCommands(ObjectProvider<PromptRenderer> promptRendererProvider,
                          ObjectProvider<PromptStore> promptStoreProvider,
                          ObjectProvider<PromptLifecycleFacade> promptLifecycleFacadeProvider) {
        this.promptRendererProvider = promptRendererProvider;
        this.promptStoreProvider = promptStoreProvider;
        this.promptLifecycleFacadeProvider = promptLifecycleFacadeProvider;
    }

    @Command(name = "prompt create", availabilityProvider = "promptAvailabilityProvider")
    public String create(
            @Option(longName = "name", required = true) String name,
            @Option(longName = "group", defaultValue = "default") String group,
            @Option(longName = "userMessage", shortName = 'u', required = true) String userMessage,
            @Option(longName = "placeholder", defaultValue = "{}") Map<String, String> placeholder) {
        PromptSpec template = promptLifecycleFacade().createDefaultPromptSpec();
        if (!(template.getRequest() instanceof ChatCompletionRequest templateRequest)) {
            throw new IllegalStateException("Prompt template request must be type chat/completion.");
        }

        List<ChatCompletionRequest.Message> messages = new ArrayList<>();
        String templateSystemMessage = readSystemMessage(templateRequest);
        if (!templateSystemMessage.isBlank()) {
            messages.add(ChatCompletionRequest.Message.builder()
                    .withRole("system")
                    .withContent(templateSystemMessage)
                    .build());
        }
        messages.add(ChatCompletionRequest.Message.builder()
                .withRole("user")
                .withContent(userMessage)
                .build());

        PromptSpec.Placeholders placeholders = mergePlaceholders(template.getPlaceholders(), placeholder);
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withType(templateRequest.getType())
                .withVendor(templateRequest.getVendor())
                .withModel(templateRequest.getModel())
                .withUrl(templateRequest.getUrl())
                .withModelSnapshot(templateRequest.getModelSnapshot())
                .withParameters(templateRequest.getParameters())
                .withMessages(messages)
                .build();

        PromptSpec.Builder promptSpecBuilder = PromptSpec.builderFrom(template);
        promptSpecBuilder.withId(null);
        promptSpecBuilder.withGroup(group);
        promptSpecBuilder.withName(name);
        promptSpecBuilder.withRequest(request);
        promptSpecBuilder.withPlaceholders(placeholders);

        PromptSpec promptSpec = promptSpecBuilder.build();
        return promptLifecycleFacade().createPromptSpec(promptSpec).getId();
    }

    @Command(name = "prompt change", availabilityProvider = "promptAvailabilityProvider")
    public String change(
            @Option(longName = "id", required = true) String id,
            @Option(longName = "userMessage", shortName = 'u', required = true) String userMessage
    ) {
        return "prompt change is no longer supported in the CLI. Use `promptlm ui` and edit the prompt in the web UI.";
        // promptLMSpecService.updatePrompt(id, )
    }

    @Command(name = "prompt release", availabilityProvider = "promptAvailabilityProvider")
    public String release(
            @Option(longName = "id", required = true) String id
    ) {
        PromptSpec promptSpec = promptLifecycleFacade().release(id);
        return promptSpec.getVersion();
    }

    @Command(name = "prompt show", availabilityProvider = "promptAvailabilityProvider")
    public String show(
            @Option(longName = "id", required = true) String id
    ) {
        Optional<PromptSpec> prompt = promptStore().getLatestVersion(id);
        if (prompt.isPresent()) {
            return promptRenderer().render(prompt.get());
        } else {
            return "No prompt found for id " + id;
        }
    }

    private PromptLifecycleFacade promptLifecycleFacade() {
        return require(promptLifecycleFacadeProvider, "prompt lifecycle");
    }

    private PromptStore promptStore() {
        return require(promptStoreProvider, "prompt store");
    }

    private PromptRenderer promptRenderer() {
        return require(promptRendererProvider, "prompt renderer");
    }

    private static <T> T require(ObjectProvider<T> provider, String dependencyName) {
        T bean = provider.getIfAvailable();
        if (bean != null) {
            return bean;
        }
        throw new IllegalStateException("The requested prompt command is unavailable because the %s is not configured in this CLI runtime."
                .formatted(dependencyName));
    }

    private static String readSystemMessage(ChatCompletionRequest request) {
        List<ChatCompletionRequest.Message> messages = request.getMessages() != null
                ? request.getMessages()
                : List.of();
        return messages.stream()
                .filter(message -> "system".equalsIgnoreCase(message.getRole()))
                .map(ChatCompletionRequest.Message::getContent)
                .findFirst()
                .orElse("");
    }

    private static PromptSpec.Placeholders mergePlaceholders(
            PromptSpec.Placeholders templatePlaceholders,
            Map<String, String> overrides
    ) {
        if (templatePlaceholders == null) {
            throw new IllegalStateException("Prompt template placeholders must be provided by the backend.");
        }
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern(templatePlaceholders.getStartPattern());
        placeholders.setEndPattern(templatePlaceholders.getEndPattern());

        Map<String, String> mergedDefaults = new LinkedHashMap<>();
        mergedDefaults.putAll(templatePlaceholders.getDefaults());
        mergedDefaults.putAll(overrides);

        placeholders.setList(mergedDefaults.entrySet().stream()
                .map(entry -> new PromptSpec.Placeholder(entry.getKey(), entry.getValue()))
                .toList());
        return placeholders;
    }

    @Component("promptAvailabilityProvider")
    static class PromptAvailabilityProvider implements AvailabilityProvider {

        private final ObjectProvider<SerializingAppContext> contextProvider;

        PromptAvailabilityProvider(ObjectProvider<SerializingAppContext> contextProvider) {
            this.contextProvider = contextProvider;
        }

        @Override
        public Availability get() {
            SerializingAppContext context;
            try {
                context = contextProvider.getIfAvailable();
            }
            catch (RuntimeException ex) {
                return Availability.unavailable("the CLI context could not be loaded");
            }
            return context != null
                    && context.getActiveProject() != null
                    && context.getActiveProject().getRepoDir() != null
                    ? Availability.available()
                    : Availability.unavailable("the CLI is not connected to any store. Create a new or select an existing store");
        }
    }

}
