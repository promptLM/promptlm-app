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

package dev.promptlm.domain.promptspec;

import java.util.List;

public interface PromptSpecIdGenerator {
    String generateId(String group, String name, List<ChatCompletionRequest.Message> userMessage);

    default PromptSpec generateAndAttachPromptSpecId(PromptSpec promptSpec) {
        if (promptSpec == null) {
            return null;
        }
        List<ChatCompletionRequest.Message> messages = List.of();
        Request request = promptSpec.getRequest();
        if (request instanceof ChatCompletionRequest chatCompletionRequest && chatCompletionRequest.getMessages() != null) {
            messages = chatCompletionRequest.getMessages();
        }
        String id = generateId(promptSpec.getGroup(), promptSpec.getName(), messages);
        return promptSpec.withId(id);
    }
}
