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
import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.release.OnInfraFailure;
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

    /**
     * Release variant that lets the caller override what happens on a pre-release-execute
     * infrastructure failure (vendor 5xx / network timeout / outage). Default behavior of
     * {@link #releasePrompt(String)} is {@link OnInfraFailure#REJECT}.
     */
    default PromptSpec releasePrompt(String promptSpecId, OnInfraFailure onInfraFailure) {
        return releasePrompt(promptSpecId);
    }

    PromptSpec completeReleasePrompt(String promptSpecId, String pullRequestReference);

    PromptSpec persistEvaluatedPrompt(PromptSpec evaluatedPromptSpec);

    /**
     * Append a dev-run execution to the latest version of the given prompt and persist.
     * Caps the stored executions list at {@link #MAX_DEV_EXECUTIONS} entries (oldest dropped)
     * and stores via the same repository path as {@link #updatePrompt} so the YAML/git layer
     * sees a single coherent write. Does not bump revision — dev runs don't change request
     * shape; revision-bumping edits clear executions separately in {@link #updatePrompt}.
     */
    PromptSpec recordExecution(String promptSpecId, Execution execution);

    /** Ring-buffer cap applied by {@link #recordExecution}. */
    int MAX_DEV_EXECUTIONS = 5;
}
