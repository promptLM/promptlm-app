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

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PromptTemplateAdapterTest {

    @Test
    void delegatesRenderToTemplateRenderer() {
        PromptSpecTemplateRenderer renderer = mock(PromptSpecTemplateRenderer.class);
        PromptTemplateAdapter adapter = new PromptTemplateAdapter(renderer);
        PromptSpec expected = mock(PromptSpec.class);
        List<ChatCompletionRequest.Message> messages = List.of(ChatCompletionRequest.Message.builder()
                .withRole("user")
                .withContent("hi")
                .build());
        Map<String, String> placeholders = Map.of("name", "Alice");

        PromptSpec.Placeholders placeholderConfig = new PromptSpec.Placeholders();
        when(renderer.createPromptSpecFromTemplate("template", "group", "name", messages, placeholders, placeholderConfig))
                .thenReturn(expected);

        PromptSpec actual = adapter.render("template", "group", "name", messages, placeholders, placeholderConfig);

        assertEquals(expected, actual);
        verify(renderer).createPromptSpecFromTemplate("template", "group", "name", messages, placeholders, placeholderConfig);
    }
}
