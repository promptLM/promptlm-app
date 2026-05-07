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

package dev.promptlm.release;

import dev.promptlm.domain.promptspec.Execution;

/**
 * Hard-block thrown by the pre-release-execute gate when the underlying execution failed
 * for prompt-class reasons (schema assertion, validation, evaluator hard-fail, tool-call error).
 * The release pointer must not move; the gating Execution is still recorded for audit.
 */
public class PreReleasePromptFailure extends PromptReleaseException {

    public static final String CODE = "PRE_RELEASE_PROMPT_FAILURE";

    private final Execution failedExecution;

    public PreReleasePromptFailure(String promptSpecId, Execution failedExecution, Throwable cause) {
        super("Pre-release execution failed for prompt %s".formatted(promptSpecId), cause);
        this.failedExecution = failedExecution;
    }

    public Execution failedExecution() {
        return failedExecution;
    }

    public String code() {
        return CODE;
    }
}
