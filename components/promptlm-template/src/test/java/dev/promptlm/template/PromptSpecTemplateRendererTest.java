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

import tools.jackson.core.exc.StreamReadException;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Request;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PromptSpecTemplateRendererTest {

    @Test
    void mergesMessagesAndPlaceholdersWhenRenderingTemplate() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        PromptSpecTemplateRenderer renderer = new PromptSpecTemplateRenderer(mapper);

        ChatCompletionRequest templateRequest = new ChatCompletionRequest(
                "openai",
                "gpt-4.1",
                null,
                ChatCompletionRequest.TYPE,
                null,
                null,
                List.of(ChatCompletionRequest.Message.builder().withRole("system").withContent("base").build()));
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setList(List.of(
                new PromptSpec.Placeholder("name", "world"),
                new PromptSpec.Placeholder("lang", "en")));
        PromptSpec templateSpec = PromptSpec.builder()
                .withGroup("template-group")
                .withName("template-name")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(templateRequest)
                .withPlaceholders(placeholders)
                .build();

        when(mapper.readValue("template", PromptSpec.class)).thenReturn(templateSpec);

        PromptSpec rendered = renderer.createPromptSpecFromTemplate(
                "template",
                "new-group",
                "new-name",
                List.of(ChatCompletionRequest.Message.builder().withRole("user").withContent("hello").build()),
                Map.of("name", "Alice", "city", "Berlin"),
                new PromptSpec.Placeholders());

        assertEquals("new-group", rendered.getGroup());
        assertEquals("new-name", rendered.getName());
        assertEquals(PromptSpec.PromptStatus.ACTIVE, rendered.getStatus());
        ChatCompletionRequest updated = (ChatCompletionRequest) rendered.getRequest();
        assertEquals(2, updated.getMessages().size());
        assertEquals("base", updated.getMessages().get(0).getContent());
        assertEquals("hello", updated.getMessages().get(1).getContent());
        assertEquals("Alice", rendered.getPlaceholders().getDefaults().get("name"));
        assertEquals("en", rendered.getPlaceholders().getDefaults().get("lang"));
        assertEquals("Berlin", rendered.getPlaceholders().getDefaults().get("city"));
    }

    @Test
    void throwsWhenMessagesOverrideIsUsedWithNonChatRequest() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        PromptSpecTemplateRenderer renderer = new PromptSpecTemplateRenderer(mapper);
        Request nonChatRequest = mock(Request.class);
        PromptSpec templateSpec = PromptSpec.builder()
                .withGroup("template-group")
                .withName("template-name")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(nonChatRequest)
                .build();
        when(mapper.readValue("template", PromptSpec.class)).thenReturn(templateSpec);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                renderer.createPromptSpecFromTemplate(
                        "template",
                        "new-group",
                        "new-name",
                        List.of(ChatCompletionRequest.Message.builder().withRole("user").withContent("hello").build()),
                        Map.of(),
                        new PromptSpec.Placeholders()));

        assertTrue(exception.getMessage().contains("ChatCompletionRequest"));
    }

    @Test
    void wrapsJsonProcessingFailure() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        PromptSpecTemplateRenderer renderer = new PromptSpecTemplateRenderer(mapper);
        when(mapper.readValue("template", PromptSpec.class))
                .thenThrow(new StreamReadException("bad yaml"));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                renderer.createPromptSpecFromTemplate("template", "group", "name", List.of(), Map.of(), new PromptSpec.Placeholders()));

        assertEquals("bad yaml", exception.getCause().getMessage());
    }
}
