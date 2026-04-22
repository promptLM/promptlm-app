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

import { toDisplayError } from '@api-common/apiError';
import type { PromptSpec, PromptSpecCreationRequest } from '@promptlm/api-client';
import type { PromptEditorExecution } from '@promptlm/ui';
import { buildPromptSpecCreationRequest, type PromptDraftInput } from '@/api/promptPayloads';

import { sanitizePromptDraft } from './draftState';
import type { PromptEditorMode } from './types';

type ActionToast = {
  severity: 'success' | 'error';
  message: string;
};

export type SavePromptDraftInput = {
  mode: PromptEditorMode;
  createdPromptId: string | null;
  promptId: string | null;
  activeProjectId: string | null;
  activeProjectRepositoryUrl?: string | null;
  draft: PromptDraftInput;
  evaluationEnabled: boolean;
  validationHasErrors: boolean;
  createPrompt: (payload: PromptSpecCreationRequest) => Promise<PromptSpec>;
  updatePrompt: (id: string, payload: PromptSpecCreationRequest) => Promise<PromptSpec>;
};

export type SavePromptDraftResult = {
  nextCreatedPromptId: string | null;
  updatedPrompt: PromptSpec | null;
  shouldRefreshPrompt: boolean;
  toast: ActionToast;
};

export const savePromptDraftAction = async ({
  mode,
  createdPromptId,
  promptId,
  activeProjectId,
  activeProjectRepositoryUrl,
  draft,
  evaluationEnabled,
  validationHasErrors,
  createPrompt,
  updatePrompt,
}: SavePromptDraftInput): Promise<SavePromptDraftResult> => {
  if (!activeProjectId) {
    return {
      nextCreatedPromptId: createdPromptId,
      updatedPrompt: null,
      shouldRefreshPrompt: false,
      toast: {
        severity: 'error',
        message: 'Select an active project before saving.',
      },
    };
  }

  if (validationHasErrors) {
    return {
      nextCreatedPromptId: createdPromptId,
      updatedPrompt: null,
      shouldRefreshPrompt: false,
      toast: {
        severity: 'error',
        message: 'Resolve validation errors before saving.',
      },
    };
  }

  const preparedDraft = sanitizePromptDraft(
    draft,
    evaluationEnabled,
    activeProjectRepositoryUrl ?? undefined,
  );
  const payload = buildPromptSpecCreationRequest(preparedDraft);

  try {
    if (mode === 'create' && !createdPromptId) {
      const created = await createPrompt(payload);
      return {
        nextCreatedPromptId: created.id ?? null,
        updatedPrompt: null,
        shouldRefreshPrompt: false,
        toast: {
          severity: 'success',
          message: 'Prompt created.',
        },
      };
    }

    const targetPromptId = mode === 'create' ? createdPromptId : promptId;
    if (!targetPromptId) {
      throw new Error('Prompt id is required');
    }

    const updated = await updatePrompt(targetPromptId, payload);
    return {
      nextCreatedPromptId: updated.id ?? targetPromptId,
      updatedPrompt: mode === 'edit' ? updated : null,
      shouldRefreshPrompt: mode === 'edit',
      toast: {
        severity: 'success',
        message: 'Prompt saved.',
      },
    };
  } catch (error) {
    return {
      nextCreatedPromptId: createdPromptId,
      updatedPrompt: null,
      shouldRefreshPrompt: false,
      toast: {
        severity: 'error',
        message: toDisplayError(error).message,
      },
    };
  }
};

export type ReleasePromptInput = {
  mode: PromptEditorMode;
  createdPromptId: string | null;
  promptId: string | null;
  releasePrompt: (id: string) => Promise<PromptSpec>;
};

export type ReleasePromptResult = {
  releasedPrompt: PromptSpec | null;
  nextCreatedPromptId: string | null;
  shouldRefreshPrompt: boolean;
  toast: ActionToast | null;
};

const readReleaseState = (prompt: PromptSpec): 'requested' | 'released' => {
  const extensions = (prompt.extensions ?? {}) as Record<string, unknown>;
  const promptlm = extensions['x-promptlm'];
  if (!promptlm || typeof promptlm !== 'object') {
    throw new Error('Release response is missing x-promptlm metadata.');
  }

  const release = (promptlm as Record<string, unknown>).release;
  if (!release || typeof release !== 'object') {
    throw new Error('Release response is missing x-promptlm.release metadata.');
  }

  const state = (release as Record<string, unknown>).state;
  if (state === 'requested' || state === 'released') {
    return state;
  }

  throw new Error(`Unsupported release state '${String(state)}'.`);
};

export const releasePromptAction = async ({
  mode,
  createdPromptId,
  promptId,
  releasePrompt,
}: ReleasePromptInput): Promise<ReleasePromptResult> => {
  const releasablePromptId = mode === 'edit' ? promptId : createdPromptId;
  if (!releasablePromptId) {
    return {
      releasedPrompt: null,
      nextCreatedPromptId: createdPromptId,
      shouldRefreshPrompt: false,
      toast: null,
    };
  }

  try {
    const released = await releasePrompt(releasablePromptId);
    const releaseState = readReleaseState(released);
    const toastMessage =
      releaseState === 'requested'
        ? 'Release requested.'
        : mode === 'edit'
          ? 'Prompt released.'
          : 'Prompt published.';

    return {
      releasedPrompt: released,
      nextCreatedPromptId: mode === 'create' ? (released.id ?? releasablePromptId) : createdPromptId,
      shouldRefreshPrompt: mode === 'edit',
      toast: {
        severity: 'success',
        message: toastMessage,
      },
    };
  } catch (error) {
    return {
      releasedPrompt: null,
      nextCreatedPromptId: createdPromptId,
      shouldRefreshPrompt: false,
      toast: {
        severity: 'error',
        message: toDisplayError(error).message,
      },
    };
  }
};

export const mergeExecutions = (
  localExecutions: PromptEditorExecution[],
  remoteExecutions: PromptEditorExecution[],
): PromptEditorExecution[] =>
  [...localExecutions, ...remoteExecutions].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

export const pickSelectedExecution = <
  TExecution extends {
    id: string;
  },
>(
  executions: TExecution[],
  selectedExecutionId: string | null,
): TExecution | undefined => {
  if (!executions.length) {
    return undefined;
  }

  if (!selectedExecutionId) {
    return executions[0];
  }

  return executions.find((execution) => execution.id === selectedExecutionId) ?? executions[0];
};
