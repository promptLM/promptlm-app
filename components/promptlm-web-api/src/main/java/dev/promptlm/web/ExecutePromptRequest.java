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

package dev.promptlm.web;

import dev.promptlm.domain.promptspec.PromptSpec;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request class for prompt execution.
 *
 * <p>The {@code draft} flag is the authoritative discriminator between the two
 * reconciled flavours of editor Run:
 * <ul>
 *   <li>{@code draft = false} (default) — the body (if any) is executed and a
 *       MANUAL Execution is appended to the stored prompt's history. This is
 *       what HappyPath#runPromptPersistsManualExecution pins (issue #140).</li>
 *   <li>{@code draft = true} — the body is executed but the run is ephemeral;
 *       nothing is recorded. The editor sets this when it knows the user has
 *       unsaved edits (issue #183).</li>
 * </ul>
 *
 * <p>An earlier implementation tried to infer "draft-ness" by comparing the
 * body's {@code PromptSpec#computeSemanticHash} against the stored spec's, but
 * that proved fragile: every TS-side normalisation difference (role casing,
 * synthesised system messages, placeholder shape) was enough to misclassify a
 * clean Run as a draft and silently drop the MANUAL Execution. The explicit
 * boolean removes the guesswork.
 */
public class ExecutePromptRequest {
    private PromptSpec promptSpec;

    @Schema(description = "Marks this run as a draft (unsaved edits). When true, "
            + "the body is executed but no MANUAL Execution is recorded against the "
            + "stored prompt — the run is ephemeral. Default false: a clean editor Run "
            + "(no unsaved edits) records a MANUAL Execution.",
            defaultValue = "false")
    private boolean draft;

    public ExecutePromptRequest() {
        // Default constructor for Jackson
    }

    public ExecutePromptRequest(PromptSpec promptSpec) {
        this.promptSpec = promptSpec;
    }

    public ExecutePromptRequest(PromptSpec promptSpec, boolean draft) {
        this.promptSpec = promptSpec;
        this.draft = draft;
    }

    public PromptSpec getPromptSpec() {
        return promptSpec;
    }

    public void setPromptSpec(PromptSpec promptSpec) {
        this.promptSpec = promptSpec;
    }

    public boolean isDraft() {
        return draft;
    }

    public void setDraft(boolean draft) {
        this.draft = draft;
    }
}
