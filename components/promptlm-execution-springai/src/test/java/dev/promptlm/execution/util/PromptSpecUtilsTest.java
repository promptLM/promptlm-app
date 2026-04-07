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
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.Message;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

class PromptSpecUtilsTest {

    @Test
    void extractMessagesAllowsNullPlaceholderDefaultValues() {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withMessages(List.of(
                        ChatCompletionRequest.Message.builder()
                                .withRole("user")
                                .withContent("Hello {{customer_name}}")
                                .build()
                ))
                .build();

        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern("{{");
        placeholders.setEndPattern("}}");
        placeholders.setList(List.of(new PromptSpec.Placeholder("customer_name", null)));

        List<Message> messages = assertDoesNotThrow(() -> PromptSpecUtils.extractMessages(request, placeholders));

        assertEquals(1, messages.size());
        assertEquals("Hello {{customer_name}}", messages.get(0).getText());
    }
}

