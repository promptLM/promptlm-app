// Copyright 2025 promptLM
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Build the request body for the editor's "Run" action on `/prompts/<id>/edit`.
 *
 * Issue #183: Run must execute the *current form state*, not the stored YAML.
 * The form state lives in `editor.state.draft`; this helper sanitises it the
 * same way the Save path does, then maps it to the
 * `ExecutePromptRequest` shape the backend expects.
 *
 * Issue #140 reconciliation: the editor knows whether the user has unsaved
 * edits via `usePromptFormDirty` and passes it here as `isDirty`. We
 * propagate that into `request.draft`, which the backend uses as the
 * authoritative discriminator between a clean Run (records a MANUAL
 * Execution) and a draft Run (ephemeral). An earlier design inferred this
 * from body-vs-stored semantic-hash divergence and chronically misclassified
 * clean Runs as drafts — see PromptSpecController#executeStoredPrompt.
 *
 * The companion backend change in `PromptSpecController.executeStoredPrompt`
 * makes the body authoritative when supplied. The path id remains the source
 * of truth for which prompt's history the execution is recorded under.
 */
import type { ExecutePromptRequest } from '@promptlm/api-client';

import { buildExecutePromptRequest, type PromptDraftInput } from '@/api/promptPayloads';
import { sanitizePromptDraft } from './draftState';

export type BuildEditorRunRequestInput = {
  draft: PromptDraftInput;
  evaluationEnabled: boolean;
  repositoryUrl?: string | null;
  /**
   * Whether the editor form has unsaved edits relative to the stored prompt.
   * Sourced from `usePromptFormDirty` in PromptFormShell.
   *
   * - `false` (default) → clean Run: backend records a MANUAL Execution
   *   against the stored prompt (issue #140, HappyPath
   *   `runPromptPersistsManualExecution`).
   * - `true` → unsaved-edit Run: backend executes the body but skips
   *   recording — the user is experimenting (issue #183).
   */
  isDirty?: boolean;
};

export const buildEditorRunRequest = ({
  draft,
  evaluationEnabled,
  repositoryUrl,
  isDirty = false,
}: BuildEditorRunRequestInput): ExecutePromptRequest => {
  const sanitized = sanitizePromptDraft(draft, evaluationEnabled, repositoryUrl);
  const body = buildExecutePromptRequest(sanitized);
  return { ...body, draft: isDirty };
};
