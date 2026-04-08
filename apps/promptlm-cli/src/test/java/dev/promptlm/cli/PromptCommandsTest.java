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

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Request;
import dev.promptlm.lifecycle.PromptLifecycleFacade;
import dev.promptlm.infrastructure.config.SerializingAppContext;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.shell.core.command.availability.Availability;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PromptCommandsTest {

    @Test
    void changePointsUsersToUi() {
        PromptCommands commands = new PromptCommands(mock(ObjectProvider.class), mock(ObjectProvider.class), mock(ObjectProvider.class));

        String result = commands.change("prompt-id", "updated message");

        assertEquals("prompt change is no longer supported in the CLI. Use `promptlm ui` and edit the prompt in the web UI.", result);
    }

    @Test
    void createUsesBackendTemplateAsDraftSource() {
        @SuppressWarnings("unchecked")
        ObjectProvider<PromptLifecycleFacade> lifecycleProvider = mock(ObjectProvider.class);
        PromptLifecycleFacade lifecycleFacade = mock(PromptLifecycleFacade.class);
        when(lifecycleProvider.getIfAvailable()).thenReturn(lifecycleFacade);

        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern("{{");
        placeholders.setEndPattern("}}");
        placeholders.setList(List.of(new PromptSpec.Placeholder("customer_name", "Taylor")));

        PromptSpec template = PromptSpec.builder()
                .withGroup("support")
                .withName("support-prompt")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("Assist support agents")
                .withRequest(ChatCompletionRequest.builder()
                        .withType(ChatCompletionRequest.TYPE)
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of(
                                ChatCompletionRequest.Message.builder()
                                        .withRole("system")
                                        .withContent("You are a helpful assistant.")
                                        .build(),
                                ChatCompletionRequest.Message.builder()
                                        .withRole("user")
                                        .withContent("Help the customer.")
                                        .build()
                        ))
                        .build())
                .withPlaceholders(placeholders)
                .build();
        when(lifecycleFacade.createDefaultPromptSpec()).thenReturn(template);

        PromptSpec createdPrompt = template.withId("support/new-prompt");
        when(lifecycleFacade.createPromptSpec(any(PromptSpec.class))).thenReturn(createdPrompt);

        PromptCommands commands = new PromptCommands(
                mock(ObjectProvider.class),
                mock(ObjectProvider.class),
                lifecycleProvider
        );

        String id = commands.create(
                "new-prompt",
                "support",
                "Help account owner.",
                Map.of("customer_name", "Avery")
        );

        assertEquals("support/new-prompt", id);

        ArgumentCaptor<PromptSpec> createdCaptor = ArgumentCaptor.forClass(PromptSpec.class);
        verify(lifecycleFacade).createPromptSpec(createdCaptor.capture());
        PromptSpec created = createdCaptor.getValue();
        assertEquals("support", created.getGroup());
        assertEquals("new-prompt", created.getName());
        ChatCompletionRequest request = (ChatCompletionRequest) created.getRequest();
        assertEquals("openai", request.getVendor());
        assertEquals("gpt-4o", request.getModel());
        assertEquals("You are a helpful assistant.", request.getMessages().getFirst().getContent());
        assertEquals("Help account owner.", request.getMessages().getLast().getContent());
        assertEquals("Avery", created.getPlaceholders().getDefaults().get("customer_name"));
    }

    @Test
    void createFailsWhenBackendTemplateRequestIsNotChatCompletion() {
        @SuppressWarnings("unchecked")
        ObjectProvider<PromptLifecycleFacade> lifecycleProvider = mock(ObjectProvider.class);
        PromptLifecycleFacade lifecycleFacade = mock(PromptLifecycleFacade.class);
        when(lifecycleProvider.getIfAvailable()).thenReturn(lifecycleFacade);

        Request nonChatRequest = mock(Request.class);
        PromptSpec template = PromptSpec.builder()
                .withGroup("support")
                .withName("support-prompt")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("Assist support agents")
                .withRequest(nonChatRequest)
                .build();
        when(lifecycleFacade.createDefaultPromptSpec()).thenReturn(template);

        PromptCommands commands = new PromptCommands(
                mock(ObjectProvider.class),
                mock(ObjectProvider.class),
                lifecycleProvider
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> commands.create(
                "new-prompt",
                "support",
                "Help account owner.",
                Map.of("customer_name", "Avery")
        ));
        assertTrue(ex.getMessage().contains("chat/completion"));
    }

    @Test
    void availabilityIsUnavailableWhenContextCannotBeLoaded() {
        @SuppressWarnings("unchecked")
        ObjectProvider<SerializingAppContext> contextProvider = mock(ObjectProvider.class);
        when(contextProvider.getIfAvailable()).thenThrow(new IllegalStateException("boom"));

        Availability availability = new PromptCommands.PromptAvailabilityProvider(contextProvider).get();

        assertFalse(availability.isAvailable());
        assertTrue(availability.reason().contains("could not be loaded"));
    }
}
