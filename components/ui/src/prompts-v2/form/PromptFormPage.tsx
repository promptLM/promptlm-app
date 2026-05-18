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
import { TabStrip, type FormTabId } from './TabStrip';
import { ReleaseRail, type ReleaseRailProps, type ReleaseRailState } from './release/ReleaseRail';
import { TestTab } from './test/TestTab';
import type { TestRunRecord, RepoHistoryItem } from './test/types';
import { RunResponsePanel, type EditorRunRecord } from './RunResponsePanel';
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
import { evaluateReleaseGates } from './releaseGates';

export interface PromptFormReleaseFlowProps {
  /**
   * When `true`, the release-flow + test-tab UI shell is mounted. Default
   * `false` keeps the original sticky-header behaviour for the v1 ship.
   */
  releaseFlowEnabled?: boolean;
  /** Live executions filtered to the current request shape (Q5 lock). */
  testExecutions?: ReadonlyArray<TestRunRecord>;
  /** Older runs surfaced in the History flyover (PR 2 hooks the real API). */
  testRepoHistory?: ReadonlyArray<RepoHistoryItem>;
  /** True when request-shape edits since the last run cleared executions[]. */
  testRequestChanged?: boolean;
  /** Map of placeholder name → current value (component state in PR 1). */
  testValues?: Record<string, string>;
  onChangeTestValues?: (next: Record<string, string>) => void;
  testValuesDirty?: boolean;
  onSaveTestValues?: () => void;
  onResetTestValues?: () => void;
  /** Run / re-run callbacks; PR 1 wires these to mocks. */
  onTestRun?: () => void;
  onTestRerun?: () => void;
  testRunState?: 'idle' | 'running' | 'error';
  onClearTestRequestChanged?: () => void;
  /** Optional override for the rail's current state machine value. */
  releaseRailState?: ReleaseRailState;
  /** Diff summary for the rail's diff section. */
  releaseRailDiff?: ReleaseRailProps['diff'];
  /** Last-run summary for the rail. Falls back to executions[0] when omitted. */
  releaseRailLastRun?: ReleaseRailProps['lastRun'];
  /** Error message body when the rail is in a blocked state. */
  releaseRailErrorMessage?: string;
  onReleaseRailRetry?: () => void;
  /** When true, the placeholder shape is dirty (Q3-aware: only schema edits). */
  placeholderShapeDirty?: boolean;
  /** Optional next-version label for the rail header (defaults to "next"). */
  nextVersion?: string;
}

export interface PromptFormPageProps extends PromptFormReleaseFlowProps {
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
  /** Editor-tab inline run — executes the prompt and populates the response panel. */
  onEditorRun?: () => void;
  /** Current state of the editor-tab run. */
  editorRunState?: 'idle' | 'running';
  /** Last completed run record for the editor-tab response panel. */
  lastEditorRun?: EditorRunRecord | null;
  /**
   * Issue #185 — when `true`, render the "Modified" chip in the sticky
   * header to signal the form has unsaved changes. The chip sits next to the
   * existing revision label so issue #184 (topbar revision) can coordinate
   * with the same signal.
   */
  isDirty?: boolean;
  /**
   * Optional pre-formatted input-token estimate label (e.g. `~1,200 tokens`).
   * Surfaced next to the Messages section's message count. Issue #182.
   */
  inputTokenEstimateLabel?: string | null;
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
  releaseFlowEnabled: boolean;
  releaseDisabledReason: string | null;
  onEditorRun?: () => void;
  isEditorRunning?: boolean;
  isDirty?: boolean;
}> = ({
  mode,
  draft,
  context,
  errors,
  isBusy,
  isSaving,
  onCancel,
  onSaveDraft,
  onSubmit,
  releaseFlowEnabled,
  releaseDisabledReason,
  onEditorRun,
  isEditorRunning,
  isDirty = false,
}) => {
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
        ) : context.revisionId ? (
          // Issue #184: when the backend supplies a revision identifier
          // (release tag or short SHA), surface it as the primary indicator
          // of which committed revision the user is editing against. Rendered
          // in its own span so #185's "modified" chip can render adjacent.
          <>
            v<span style={{ color: 'var(--pl-ink-700)' }}>{context.version}</span> ·{' '}
            <span
              style={{ color: 'var(--pl-ink-700)' }}
              data-testid="prompt-editor-revision-id"
            >
              {context.revisionId}
            </span>
          </>
        ) : (
          <>
            v<span style={{ color: 'var(--pl-ink-700)' }}>{context.version}</span> → next will bump · {context.branch}
          </>
        )}
      </FormMono>

      {isDirty && (
        <span
          data-testid="prompt-editor-dirty-indicator"
          aria-label="Form has unsaved changes"
          title="Form has unsaved changes"
          style={{
            padding: '2px 7px',
            background: 'oklch(0.94 0.05 80)',
            color: 'oklch(0.42 0.13 70)',
            fontFamily: 'var(--pl-mono)',
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            borderRadius: 3,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          Modified
        </span>
      )}

      <FormMono
        size={11}
        color={errors.hasErrors ? 'oklch(0.50 0.15 25)' : 'oklch(0.45 0.12 155)'}
      >
        {errors.hasErrors ? <>! {totalErrors} errors</> : '✓ ready to save'}
      </FormMono>
      {context.viewOnRemoteUrl && (
        <a
          href={context.viewOnRemoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="prompt-editor-view-on-remote"
          title="Open this prompt on GitHub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 28,
            padding: '0 10px',
            fontFamily: 'var(--pl-display)',
            fontSize: 12,
            color: 'var(--pl-ink-700)',
            textDecoration: 'none',
            border: '1px solid var(--pl-ink-200)',
            borderRadius: 4,
            background: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden="true" style={{ fontFamily: 'var(--pl-mono)', fontSize: 11 }}>↗</span>
          View on GitHub
        </a>
      )}
      {onEditorRun && (
        <GhostButton
          onClick={onEditorRun}
          disabled={isBusy || isEditorRunning}
          testId="prompt-editor-run-action"
        >
          <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, marginRight: 5 }}>▷</span>
          {isEditorRunning ? 'Running…' : 'Run'}
        </GhostButton>
      )}
      <GhostButton onClick={onCancel} disabled={isBusy}>
        Cancel
      </GhostButton>
      <GhostButton onClick={onSaveDraft} disabled={isBusy || isSaving}>
        Save draft
      </GhostButton>
      <span title={releaseDisabledReason ?? undefined} style={{ display: 'inline-flex' }}>
        <PrimaryButton
          onClick={onSubmit}
          disabled={errors.hasErrors || isBusy || isSaving || Boolean(releaseDisabledReason)}
          testId={
            releaseFlowEnabled
              ? 'prompt-release-action'
              : isCreate
                ? 'save-prompt-button'
                : 'prompt-editor-release-action'
          }
        >
          {isSaving
            ? 'Saving…'
            : releaseFlowEnabled
              ? 'Release'
              : isCreate
                ? 'Create'
                : 'Save & release'}
        </PrimaryButton>
      </span>
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
  releaseFlowEnabled = false,
  testExecutions = [],
  testRepoHistory = [],
  testRequestChanged = false,
  testValues,
  onChangeTestValues,
  testValuesDirty = false,
  onSaveTestValues,
  onResetTestValues,
  onTestRun,
  onTestRerun,
  testRunState = 'idle',
  onClearTestRequestChanged,
  releaseRailState,
  releaseRailDiff = null,
  releaseRailLastRun,
  releaseRailErrorMessage,
  onReleaseRailRetry,
  placeholderShapeDirty = false,
  nextVersion,
  onEditorRun,
  editorRunState = 'idle',
  lastEditorRun = null,
  isDirty = false,
  inputTokenEstimateLabel = null,
}) => {
  const errors = React.useMemo(
    () => validateDraft(draft, evalEnabled),
    [draft, evalEnabled],
  );

  const [activeTab, setActiveTab] = React.useState<FormTabId>('editor');
  const [railOpen, setRailOpen] = React.useState(false);
  const [internalRailState, setInternalRailState] = React.useState<ReleaseRailState>('idle');
  const railState = releaseRailState ?? internalRailState;

  const gatesEval = React.useMemo(
    () =>
      evaluateReleaseGates({
        errors,
        executions: testExecutions,
        placeholderShapeDirty,
      }),
    [errors, testExecutions, placeholderShapeDirty],
  );

  const fallbackTestValues = React.useMemo<Record<string, string>>(() => ({}), []);
  const effectiveTestValues = testValues ?? fallbackTestValues;

  const handleHeaderSubmit = () => {
    if (!releaseFlowEnabled) {
      onSubmit();
      return;
    }
    setRailOpen(true);
  };

  const handleRailRelease = () => {
    if (releaseRailState !== undefined) {
      // Parent owns the state machine.
      onSubmit();
      return;
    }
    setInternalRailState('saving');
    // Mocked PR-1 transitions: saving → running → released. The parent's
    // onSubmit is invoked at the running step so PR-2 wiring can intercept
    // the same callback.
    setTimeout(() => setInternalRailState('running'), 220);
    setTimeout(() => {
      onSubmit();
      setInternalRailState('released');
    }, 520);
    setTimeout(() => {
      setInternalRailState('idle');
      setRailOpen(false);
    }, 2200);
  };

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
        onSubmit={handleHeaderSubmit}
        releaseFlowEnabled={releaseFlowEnabled}
        releaseDisabledReason={
          releaseFlowEnabled && !gatesEval.canRelease ? gatesEval.blockingTooltip : null
        }
        onEditorRun={onEditorRun}
        isEditorRunning={editorRunState === 'running'}
        isDirty={isDirty}
      />

      {releaseFlowEnabled ? (
        <TabStrip
          active={activeTab}
          onChange={setActiveTab}
          testRunCount={testExecutions.length}
        />
      ) : null}

      {releaseFlowEnabled && activeTab === 'test' ? (
        <TestTab
          draft={draft}
          executions={testExecutions}
          repoHistory={testRepoHistory}
          requestChanged={testRequestChanged}
          values={effectiveTestValues}
          onChangeValues={onChangeTestValues ?? (() => undefined)}
          valuesDirty={testValuesDirty}
          onSaveValues={onSaveTestValues}
          onResetValues={onResetTestValues}
          onRun={onTestRun ?? (() => undefined)}
          onRerun={onTestRerun}
          runState={testRunState}
          onClearRequestChanged={onClearTestRequestChanged}
        />
      ) : null}

      {releaseFlowEnabled && activeTab === 'test' ? null : (
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
              estimateLabel={inputTokenEstimateLabel}
            />
            {onEditorRun && (
              <RunResponsePanel
                runState={editorRunState}
                lastRun={lastEditorRun}
                modelLabel={`${draft.request.vendor}/${draft.request.model}`}
              />
            )}
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
      )}

      {releaseFlowEnabled ? (
        <ReleaseRail
          open={railOpen}
          state={railState}
          currentVersion={context.version}
          nextVersion={nextVersion ?? 'next'}
          gates={gatesEval.gates}
          diff={releaseRailDiff}
          lastRun={
            releaseRailLastRun ??
            (testExecutions[0]
              ? {
                  status:
                    testExecutions[0].status === 'ok' || testExecutions[0].status === 'error' || testExecutions[0].status === 'pending'
                      ? testExecutions[0].status
                      : 'pending',
                  durationMs: testExecutions[0].durationMs,
                  tokensIn: testExecutions[0].tokensIn,
                  tokensOut: testExecutions[0].tokensOut,
                }
              : null)
          }
          errorMessage={releaseRailErrorMessage}
          onRelease={handleRailRelease}
          onCancel={() => setRailOpen(false)}
          onClose={() => setRailOpen(false)}
          onRetry={onReleaseRailRetry}
        />
      ) : null}
    </div>
  );
};
