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

package dev.promptlm.lifecycle;

import dev.promptlm.lifecycle.application.PromptLifecycleService;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PromptLifecycleFacade {

    private final PromptLifecycleService lifecycleService;

    public PromptLifecycleFacade(PromptLifecycleService lifecycleService) {
        this.lifecycleService = lifecycleService;
    }

    public PromptSpec createPrompt(String group,
                                   Map<String, String> placeholder,
                                   String name,
                                   List<ChatCompletionRequest.Message> userMessage,
                                   PromptSpec.Placeholders placeholders,
                                   Map<String, JsonNode> extensions) {
        return lifecycleService.createPrompt(group, placeholder, name, userMessage, placeholders, extensions);
    }

    public PromptSpec createPromptSpec(PromptSpec promptSpec) {
        return lifecycleService.createPromptSpec(promptSpec);
    }

    public PromptSpec createDefaultPromptSpec() {
        return lifecycleService.createDefaultPromptSpec();
    }

    public PromptSpec updatePrompt(String promptSpecId, PromptSpec updatingSpec) {
        return lifecycleService.updatePrompt(promptSpecId, updatingSpec);
    }

    public PromptSpec release(String id) {
        return lifecycleService.releasePrompt(id);
    }
}
