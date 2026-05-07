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

import * as React from 'react';
import { FormMono, GhostButton, PrimaryButton } from './atoms';
import {
  IdentityBlock,
  MessagesEditor,
  RailEvals,
  RailModel,
  RailPlaceholders,
  RailTools,
  SpecFileFooter,
} from './sections';
import { validateDraft } from './validation';
import type {
  FormEvaluation,
  FormMessage,
  FormPlaceholdersConfig,
  FormRequest,
  FormToolConfig,
  FormMode,
  PromptFormContext,
  PromptFormDraft,
  PromptFormErrors,
} from './types';

export interface PromptFormPageProps {
  mode: FormMode;
  draft: PromptFormDraft;
  context: PromptFormContext;
  /** Whether the eval surface is enabled. Persists across draft updates. */
  evalEnabled: boolean;
  /** Hide the eval section entirely (e.g. when `featureFlags.evals` is off). */
  evalsAvailable?: boolean;
  isBusy?: boolean;
  isSaving?: boolean;
  onChangeDraft: (draft: PromptFormDraft) => void;
  onToggleEvalEnabled: (enabled: boolean) => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  /** Primary CTA — "Create" in create mode, "Save & release" in edit mode. */
  onSubmit: () => void;
  onContentSelectionChange?: (
    selection: { messageIndex: number; selectionStart: number; selectionEnd: number } | null,
  ) => void;
  /**
   * Optional override for the rail's evaluation visibility — the page caller
   * may want to compute the same flag itself.
   */
}

const HEADER_HEIGHT = 56;

const HeaderMark = () => (
  <span
    style={{
      width: 24,
      height: 24,
      borderRadius: 5,
      background: 'var(--pl-ink-900)',
      color: 'var(--pl-paper)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--pl-mono)',
      fontSize: 10.5,
      fontWeight: 600,
    }}
  >
    <span>p</span>
    <span style={{ color: 'var(--pl-signal)' }}>L</span>
    <span>M</span>
  </span>
);

const ModeBadge: React.FC<{ mode: FormMode }> = ({ mode }) => {
  const isCreate = mode === 'create';
  return (
    <span
      style={{
        padding: '2px 7px',
        background: isCreate ? 'oklch(0.94 0.05 200)' : 'oklch(0.94 0.04 270)',
        color: isCreate ? 'oklch(0.40 0.13 200)' : 'oklch(0.40 0.10 270)',
        fontFamily: 'var(--pl-mono)',
        fontSize: 10,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        borderRadius: 3,
        fontWeight: 500,
      }}
    >
      {isCreate ? 'New' : 'Editing'}
    </span>
  );
};

const StickyHeader: React.FC<{
  mode: FormMode;
  draft: PromptFormDraft;
  context: PromptFormContext;
  errors: PromptFormErrors;
  isBusy: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}> = ({ mode, draft, context, errors, isBusy, isSaving, onCancel, onSaveDraft, onSubmit }) => {
  const isCreate = mode === 'create';
  const totalErrors =
    errors.metadataCount +
    errors.modelCount +
    errors.placeholdersCount +
    errors.messagesCount +
    errors.toolsCount +
    errors.evalsCount;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--pl-paper)',
        borderBottom: '1px solid var(--pl-ink-200)',
        padding: '10px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        height: HEADER_HEIGHT,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <HeaderMark />
        <FormMono
          size={11}
          color="var(--pl-ink-500)"
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
          <span data-testid="prompt-editor-heading-repo">{context.repositoryUrl}</span>
          {'  /  prompts'}
          {draft.group ? (
            <>
              {'  /  '}
              <span style={{ color: 'var(--pl-ink-700)' }}>{draft.group}</span>
            </>
          ) : null}
          {'  /  '}
          <span
            style={{ color: 'var(--pl-ink-900)', fontWeight: 500 }}
            data-testid="prompt-editor-heading"
          >
            {draft.name || (isCreate ? 'new prompt' : 'untitled')}
          </span>
        </FormMono>
      </span>

      <ModeBadge mode={mode} />

      <FormMono
        size={10.5}
        color="var(--pl-ink-500)"
        style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}
      >
        {isCreate ? (
          <>
            v<span style={{ color: 'var(--pl-ink-700)' }}>{context.version}</span> ·{' '}
            <span style={{ color: 'var(--pl-ink-700)' }}>{context.revision}</span>
          </>
        ) : (
          <>
            v<span style={{ color: 'var(--pl-ink-700)' }}>{context.version}</span> → next will bump · {context.branch}
          </>
        )}
      </FormMono>

      <FormMono
        size={11}
        color={errors.hasErrors ? 'oklch(0.50 0.15 25)' : 'oklch(0.45 0.12 155)'}
      >
        {errors.hasErrors ? <>! {totalErrors} errors</> : '✓ ready to save'}
      </FormMono>
      <GhostButton onClick={onCancel} disabled={isBusy}>
        Cancel
      </GhostButton>
      <GhostButton onClick={onSaveDraft} disabled={isBusy || isSaving}>
        Save draft
      </GhostButton>
      <PrimaryButton
        onClick={onSubmit}
        disabled={errors.hasErrors || isBusy || isSaving}
        testId={isCreate ? 'save-prompt-button' : 'prompt-editor-release-action'}
      >
        {isSaving ? 'Saving…' : isCreate ? 'Create' : 'Save & release'}
      </PrimaryButton>
    </header>
  );
};

/**
 * v2 prompt editor — single page with sticky header, two-column layout.
 *
 * Implements the design at `design/handoff/webui/src/prompt-form.jsx`. The
 * caller owns draft state and persistence; this component is a controlled
 * surface.
 */
export const PromptFormPage: React.FC<PromptFormPageProps> = ({
  mode,
  draft,
  context,
  evalEnabled,
  evalsAvailable = true,
  isBusy = false,
  isSaving = false,
  onChangeDraft,
  onToggleEvalEnabled,
  onCancel,
  onSaveDraft,
  onSubmit,
  onContentSelectionChange,
}) => {
  const errors = React.useMemo(
    () => validateDraft(draft, evalEnabled),
    [draft, evalEnabled],
  );

  const set = (patch: Partial<PromptFormDraft>) =>
    onChangeDraft({ ...draft, ...patch });
  const setRequest = (patch: Partial<FormRequest>) =>
    onChangeDraft({ ...draft, request: { ...draft.request, ...patch } });
  const setPlaceholders = (patch: Partial<FormPlaceholdersConfig>) =>
    onChangeDraft({
      ...draft,
      placeholders: { ...draft.placeholders, ...patch },
    });
  const setTools = (next: FormToolConfig[]) =>
    onChangeDraft({ ...draft, toolConfigs: next });
  const setEvaluations = (next: FormEvaluation[]) =>
    onChangeDraft({ ...draft, evaluations: next });
  const setMessages = (next: FormMessage[]) =>
    onChangeDraft({ ...draft, request: { ...draft.request, messages: next } });

  // Per-mode default open state for the rail collapsibles.
  const isCreate = mode === 'create';
  const identityOpen = isCreate || errors.metadataCount > 0;
  const modelOpen = true;
  const phOpen = isCreate || draft.placeholders.list.length > 0;
  const toolsOpen = isCreate || draft.toolConfigs.length > 0 || errors.toolsCount > 0;
  const evalsOpen = errors.evalsCount > 0;

  return (
    <div
      style={{
        background: 'var(--pl-canvas)',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--pl-display)',
        color: 'var(--pl-ink-900)',
      }}
      data-testid="prompt-form-page"
    >
      <StickyHeader
        mode={mode}
        draft={draft}
        context={context}
        errors={errors}
        isBusy={isBusy}
        isSaving={isSaving}
        onCancel={onCancel}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 24,
          padding: '20px 32px 80px',
          maxWidth: 1320,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <main style={{ minWidth: 0 }}>
          <IdentityBlock
            draft={draft}
            errors={errors}
            mode={mode}
            defaultOpen={identityOpen}
            onChange={set}
          />
          <div style={{ paddingTop: 16 }}>
            <MessagesEditor
              messages={draft.request.messages}
              placeholders={draft.placeholders}
              errors={errors.messages}
              itemErrors={errors.messageItems}
              onChange={setMessages}
              onContentSelectionChange={onContentSelectionChange}
            />
          </div>
        </main>

        <aside
          style={{
            alignSelf: 'start',
            position: 'sticky',
            top: HEADER_HEIGHT + 4,
            maxHeight: `calc(100vh - ${HEADER_HEIGHT + 16}px)`,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          <RailModel
            request={draft.request}
            errors={errors.model}
            paramErrors={errors.params}
            defaultOpen={modelOpen}
            onChange={setRequest}
          />
          <RailPlaceholders
            placeholders={draft.placeholders}
            errors={errors.placeholders}
            itemErrors={errors.placeholderItems}
            defaultOpen={phOpen}
            onChange={setPlaceholders}
          />
          <RailTools
            configs={draft.toolConfigs}
            itemErrors={errors.toolItems}
            defaultOpen={toolsOpen}
            onChange={setTools}
          />
          {evalsAvailable ? (
            <RailEvals
              evaluations={draft.evaluations}
              evalEnabled={evalEnabled}
              errors={errors.evals}
              itemErrors={errors.evalItems}
              defaultOpen={evalsOpen}
              onToggleEnabled={onToggleEvalEnabled}
              onChange={setEvaluations}
            />
          ) : null}
          <SpecFileFooter group={draft.group} name={draft.name} />
        </aside>
      </div>
    </div>
  );
};
