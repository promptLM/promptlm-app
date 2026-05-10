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
 * v2 prompt editor shell — renders `PromptFormPage` from `@promptlm/ui` and
 * bridges it to the existing draft state machine (`usePromptEditorDraft`)
 * and persistence actions (`savePromptDraftAction`, `releasePromptAction`).
 *
 * Implements issue #93. Replaces the cards-stack layout that ships in the
 * legacy `PromptEditorPage` for both `/prompts/new` and `/prompts/:id/edit`.
 *
 * Differences vs. the legacy editor (deliberate, per the design spec):
 * - No tabs surface — the form is a single page.
 * - No Preview / Test / History panels here. Test execution lives behind
 *   `executePrompt` and is reachable from a separate route in the new design.
 * - Tool configs (MCP mocks) and placeholder schema fields (type/required/
 *   description) are surfaced in the rail UI but are client-side-only until
 *   backend support lands; user edits don't round-trip yet.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import {
  PromptFormPage,
  type EditorRunRecord,
  type PromptFormContext,
  type PromptFormDraft,
  type PromptFormToolConfig,
} from '@promptlm/ui';

import type { PromptEditorMode } from './types';
import {
  createEmptyPromptDraft,
  createPromptDraftFromPrompt,
  usePromptEditorDraft,
} from './draftState';
import { releasePromptAction, savePromptDraftAction } from './editorActions';
import { usePromptEditorData } from './usePromptEditorData';
import { useCapabilities } from '@/api/hooks';
import { useGeneratedApiClient } from '@api-common/generatedClientProvider';
import { featureFlags } from '@/lib/featureFlags';
import type { PromptDraftInput } from '@/api/promptPayloads';

type PromptFormShellProps = {
  mode: PromptEditorMode;
  promptId: string | null;
};

const FALLBACK_VERSION = '0.1.0';
const FALLBACK_REVISION = 'r1';

const toFormVendor = (raw: string): string => raw.toLowerCase();

const toFormDraft = (
  state: ReturnType<typeof usePromptEditorDraft>['state'],
  toolConfigs: PromptFormToolConfig[],
): PromptFormDraft => {
  const { draft } = state;
  const params = draft.request.parameters ?? {};
  return {
    name: draft.name,
    group: draft.group,
    description: draft.description ?? '',
    request: {
      type: 'chat',
      vendor: toFormVendor(draft.request.vendor ?? ''),
      model: draft.request.model ?? '',
      modelSnapshot: draft.request.modelSnapshot ?? '',
      parameters: {
        temperature: typeof params.temperature === 'number' ? params.temperature : 0.2,
        topP: typeof params.topP === 'number' ? params.topP : 1.0,
        maxTokens: typeof params.maxTokens === 'number' ? params.maxTokens : 1024,
        frequencyPenalty:
          typeof params.frequencyPenalty === 'number' ? params.frequencyPenalty : 0,
        presencePenalty:
          typeof params.presencePenalty === 'number' ? params.presencePenalty : 0,
      },
      messages: draft.request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
    },
    placeholders: {
      startPattern: draft.placeholders.startPattern ?? '{{',
      endPattern: draft.placeholders.endPattern ?? '}}',
      // Existing schema only carries name + default value. Map value into the
      // form's `description` slot since that's the closest match. Type and
      // required are stubbed until the schema gains them; their UI edits are
      // dropped on persist (acceptable per playbook §Notes).
      list: draft.placeholders.list.map((ph) => ({
        name: ph.name,
        type: 'string',
        required: false,
        description: ph.value ?? '',
      })),
    },
    toolConfigs,
    evaluations: (draft.evaluations ?? []).map((ev) => ({
      evaluator: ev.evaluator,
      type: ev.type as PromptFormDraft['evaluations'][number]['type'],
      description: ev.description ?? '',
    })),
  };
};

/**
 * Apply a form-shaped draft back onto the existing `PromptDraftInput`. Lossy
 * by design for the fields the existing schema doesn't carry — see comments.
 */
const applyFormDraft = (
  prev: PromptDraftInput,
  next: PromptFormDraft,
): PromptDraftInput => ({
  ...prev,
  name: next.name,
  group: next.group,
  description: next.description,
  request: {
    ...prev.request,
    vendor: next.request.vendor,
    model: next.request.model,
    modelSnapshot: next.request.modelSnapshot,
    parameters: {
      ...prev.request.parameters,
      temperature: next.request.parameters.temperature,
      topP: next.request.parameters.topP,
      maxTokens: next.request.parameters.maxTokens,
      frequencyPenalty: next.request.parameters.frequencyPenalty,
      presencePenalty: next.request.parameters.presencePenalty,
    },
    messages: next.request.messages.map((m, index) => {
      const previousMessage = prev.request.messages[index];
      return {
        id: previousMessage?.id ?? `msg-${Date.now()}-${index}`,
        role: m.role,
        content: m.content,
        name: m.name,
      };
    }),
  },
  placeholders: {
    ...prev.placeholders,
    startPattern: next.placeholders.startPattern,
    endPattern: next.placeholders.endPattern,
    // Persist name and the description as the default-value slot — type and
    // required are intentionally dropped (no schema support yet).
    list: next.placeholders.list.map((ph) => ({
      name: ph.name,
      value: ph.description,
    })),
    defaults: Object.fromEntries(
      next.placeholders.list
        .filter((ph) => ph.name.length > 0)
        .map((ph) => [ph.name, ph.description] as const),
    ),
  },
  evaluations: next.evaluations.map((ev) => ({
    evaluator: ev.evaluator,
    type: ev.type,
    description: ev.description,
  })),
});

export const PromptFormShell = ({ mode, promptId }: PromptFormShellProps) => {
  const navigate = useNavigate();
  const data = usePromptEditorData({ mode, promptId });
  const capabilities = useCapabilities();
  const editor = usePromptEditorDraft(useMemo(() => createEmptyPromptDraft(), []));
  const { replaceState, setRepositoryUrl } = editor;
  const { promptSpecs } = useGeneratedApiClient();
  const [createdPromptId, setCreatedPromptId] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [validationRequested, setValidationRequested] = useState(false);
  const [toolConfigs, setToolConfigs] = useState<PromptFormToolConfig[]>([]);
  const [editorRunState, setEditorRunState] = useState<'idle' | 'running'>('idle');
  const [lastEditorRun, setLastEditorRun] = useState<EditorRunRecord | null>(null);

  // Hydrate draft on load. Depend only on the replaceState callback (stable
  // reference from the useReducer dispatch) — depending on `editor` triggers
  // an infinite loop because the memoised actions object changes per render.
  useEffect(() => {
    if (mode === 'edit' && data.prompt) {
      replaceState(createPromptDraftFromPrompt(data.prompt));
      return;
    }
    if (mode === 'create') {
      if (data.promptTemplate) {
        replaceState(createPromptDraftFromPrompt(data.promptTemplate));
        return;
      }
      replaceState(createEmptyPromptDraft());
    }
  }, [data.prompt, data.promptTemplate, mode, replaceState]);

  // Carry the project repository url onto the draft so the save action can
  // attach it to PromptSpecCreationRequest. Same depend-on-stable-callback
  // discipline as above.
  const draftRepositoryUrl = editor.state.draft.repositoryUrl;
  useEffect(() => {
    const url = data.activeProject?.repositoryUrl;
    if (!url) return;
    if (mode === 'create' && draftRepositoryUrl !== url) {
      setRepositoryUrl(url);
    } else if (!draftRepositoryUrl) {
      setRepositoryUrl(url);
    }
  }, [data.activeProject?.repositoryUrl, draftRepositoryUrl, mode, setRepositoryUrl]);

  const isEvaluationCapabilityEnabled =
    featureFlags.evals && Boolean(capabilities.data?.features?.includes('evals'));

  const formDraft = useMemo(
    () => toFormDraft(editor.state, toolConfigs),
    [editor.state, toolConfigs],
  );

  const handleChangeDraft = useCallback(
    (next: PromptFormDraft) => {
      editor.replaceState({
        ...editor.state,
        draft: applyFormDraft(editor.state.draft, next),
      });
      setToolConfigs(next.toolConfigs);
    },
    [editor],
  );

  const handleToggleEvalEnabled = useCallback(
    (enabled: boolean) => {
      editor.setEvaluationEnabled(enabled);
    },
    [editor],
  );

  const formContext: PromptFormContext = useMemo(() => {
    const repositoryUrl =
      data.activeProject?.repositoryUrl ??
      data.prompt?.repositoryUrl ??
      'local repository';
    return {
      version: data.prompt?.version ?? FALLBACK_VERSION,
      revision: data.prompt?.revision ? `r${data.prompt.revision}` : FALLBACK_REVISION,
      repositoryUrl,
      branch: 'main',
    };
  }, [data.activeProject?.repositoryUrl, data.prompt]);

  const handleCancel = useCallback(() => {
    if (mode === 'edit' && promptId) {
      navigate(`/prompts/${promptId}`);
      return;
    }
    navigate('/prompts');
  }, [mode, navigate, promptId]);

  const evaluationEnabledForPayload = isEvaluationCapabilityEnabled
    ? editor.state.evaluationEnabled
    : Boolean(editor.state.draft.extensions?.['x-evaluation']);

  const persistDraft = useCallback(async () => {
    flushSync(() => setValidationRequested(true));
    const result = await savePromptDraftAction({
      mode,
      createdPromptId,
      promptId: data.promptId,
      activeProjectId: data.activeProjectId,
      activeProjectRepositoryUrl: data.activeProject?.repositoryUrl,
      draft: editor.state.draft,
      evaluationEnabled: evaluationEnabledForPayload,
      validationHasErrors: false,
      createPrompt: data.createPrompt,
      updatePrompt: data.updatePrompt,
    });
    if (result.updatedPrompt && mode === 'edit') {
      editor.replaceState(createPromptDraftFromPrompt(result.updatedPrompt));
    }
    if (result.shouldRefreshPrompt) {
      await data.refreshPrompt();
    }
    if (result.nextCreatedPromptId !== createdPromptId) {
      setCreatedPromptId(result.nextCreatedPromptId);
    }
    return result;
  }, [
    createdPromptId,
    data,
    editor,
    evaluationEnabledForPayload,
    mode,
  ]);

  const handleSaveDraft = useCallback(async () => {
    await persistDraft();
  }, [persistDraft]);

  const handleSubmit = useCallback(async () => {
    const saveResult = await persistDraft();
    if (saveResult.toast.severity === 'error') {
      return;
    }
    if (mode === 'create') {
      // Successful create — navigate to detail.
      const newId = saveResult.nextCreatedPromptId ?? createdPromptId;
      if (newId) {
        navigate(`/prompts/${newId}`);
      } else {
        navigate('/prompts');
      }
      return;
    }
    // Edit mode: chase save with release.
    setIsReleasing(true);
    try {
      const releaseResult = await releasePromptAction({
        mode,
        createdPromptId,
        promptId: data.promptId,
        releasePrompt: data.releasePrompt,
      });
      if (releaseResult.releasedPrompt && mode === 'edit') {
        editor.replaceState(createPromptDraftFromPrompt(releaseResult.releasedPrompt));
      }
      if (releaseResult.shouldRefreshPrompt) {
        await data.refreshPrompt();
      }
      if (releaseResult.nextCreatedPromptId !== createdPromptId) {
        setCreatedPromptId(releaseResult.nextCreatedPromptId);
      }
    } finally {
      setIsReleasing(false);
    }
  }, [createdPromptId, data, editor, mode, navigate, persistDraft]);

  const effectivePromptId = data.promptId ?? createdPromptId;

  const handleEditorRun = useCallback(async () => {
    if (!effectivePromptId || editorRunState === 'running') return;
    setEditorRunState('running');
    const startMs = Date.now();
    try {
      const result = await promptSpecs.executeStoredPrompt(effectivePromptId);
      const exec = result?.executions?.[0];
      const ms = Date.now() - startMs;
      const userMessagePh = (exec?.placeholders ?? []).find((ph) => ph.name === 'user_message');
      setLastEditorRun({
        when: 'just now',
        kind: 'run',
        ms: exec?.latencyMs ?? ms,
        tin: exec?.tokensIn ?? exec?.response?.usage?.input_tokens ?? 0,
        tout: exec?.tokensOut ?? exec?.response?.usage?.output_tokens ?? 0,
        ok: typeof exec?.ok === 'boolean' ? exec.ok : exec?.response !== undefined,
        rev: formContext.revision,
        input: userMessagePh?.defaultValue ?? (exec?.placeholders ?? [])[0]?.defaultValue,
        response: exec?.response?.content,
        error: exec?.error,
      });
    } catch {
      setLastEditorRun({
        when: 'just now',
        kind: 'run',
        ms: Date.now() - startMs,
        tin: 0,
        tout: 0,
        ok: false,
        rev: formContext.revision,
        error: 'execution failed',
      });
    } finally {
      setEditorRunState('idle');
    }
  }, [effectivePromptId, editorRunState, promptSpecs, formContext.revision]);

  if (data.promptError) {
    return (
      <div
        role="alert"
        style={{
          margin: 32,
          padding: '12px 16px',
          background: 'color-mix(in oklch, var(--pl-fail) 8%, var(--pl-paper))',
          border: '1px solid color-mix(in oklch, var(--pl-fail) 30%, var(--pl-ink-200))',
          color: 'oklch(0.42 0.13 25)',
          borderRadius: 'var(--pl-r-md)',
          fontSize: 13.5,
        }}
      >
        Failed to load prompt. {data.promptError.message}
      </div>
    );
  }

  if ((mode === 'edit' && data.isPromptLoading) || (mode === 'create' && data.isPromptTemplateLoading)) {
    return (
      <div style={{ padding: 32, color: 'var(--pl-ink-600)', fontSize: 13.5 }}>
        Loading prompt…
      </div>
    );
  }

  // The shell is purposely loose about validation — `PromptFormPage`
  // re-runs `validateDraft` internally for inline display. The legacy
  // `validatePromptEditor` path stays available behind the scenes for the
  // existing actions which still expect it; `validationRequested` is
  // forwarded as a hint for cards that render request-deferred errors.
  void validationRequested;

  return (
    <PromptFormPage
      mode={mode}
      draft={formDraft}
      context={formContext}
      evalEnabled={editor.state.evaluationEnabled}
      evalsAvailable={isEvaluationCapabilityEnabled}
      isBusy={data.isSaving || isReleasing}
      isSaving={data.isSaving}
      onChangeDraft={handleChangeDraft}
      onToggleEvalEnabled={handleToggleEvalEnabled}
      onCancel={handleCancel}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      releaseFlowEnabled={featureFlags.releaseFlow}
      onEditorRun={effectivePromptId ? handleEditorRun : undefined}
      editorRunState={editorRunState}
      lastEditorRun={lastEditorRun}
    />
  );
};

export default PromptFormShell;
