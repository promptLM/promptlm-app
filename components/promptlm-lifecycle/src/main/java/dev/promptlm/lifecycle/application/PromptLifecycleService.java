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

package dev.promptlm.lifecycle.application;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;

/**
 * Core service interface for managing the full lifecycle of a prompt specification:
 * creation, update, execution persistence, and release.
 */
public interface PromptLifecycleService {

    PromptSpec createPrompt(String group,
                           Map<String, String> placeholder,
                           String name,
                           List<ChatCompletionRequest.Message> userMessage,
                           PromptSpec.Placeholders placeholders,
                           Map<String, JsonNode> extensions);

    PromptSpec createPromptSpec(PromptSpec promptSpec) throws PromptSpecAlreadyExistsException;

    PromptSpec createDefaultPromptSpec();

    PromptSpec updatePrompt(String promptSpecId, PromptSpec updatingSpec);

    PromptSpec releasePrompt(String promptSpecId);

    PromptSpec completeReleasePrompt(String promptSpecId, String pullRequestReference);

    PromptSpec persistEvaluatedPrompt(PromptSpec evaluatedPromptSpec);
}
