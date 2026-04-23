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

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import type {
  MessageContentSelection,
  PromptEditorBannerMessage,
  PromptEditorEvaluationResult,
  PromptEditorExecution,
  PromptEditorTab,
  PromptEditorToolConfig,
} from '@promptlm/ui';
import {
  EvaluationPlanCard,
  EvaluationResultsCard,
  LastExecutionCard,
  MessagesCard,
  MetadataCard,
  ModelConfigurationCard,
  PromptEditorHeader,
  PromptEditorTabsLayout,
  PromptPreviewCard,
  ToolConfigsCard,
} from '@promptlm/ui';

import { toDisplayError } from '@api-common/apiError';
import type { PromptSpec } from '@promptlm/api-client';
import {
  buildExecutePromptRequest,
  type PromptDraftInput,
} from '@/api/promptPayloads';
import { useCapabilities } from '@/api/hooks';
import {
  PlaceholderManager,
  type Placeholder,
  type PlaceholderConfig,
  usePlaceholderProcessor,
} from '@/components/placeholders/PlaceholderManager';

import { createEmptyPromptDraft, createPromptDraftFromPrompt, sanitizePromptDraft, usePromptEditorDraft } from './draftState';
import { mergeExecutions, pickSelectedExecution, releasePromptAction, savePromptDraftAction } from './editorActions';
import { createPlaceholderToken, insertPlaceholderToken } from './placeholderInsertion';
import type { PromptEditorMode } from './types';
import { usePromptEditorData } from './usePromptEditorData';
import { validatePromptEditor } from './validation';

type PromptEditorPageProps = {
  mode: PromptEditorMode;
  promptId: string | null;
};

type ToastState = {
  open: boolean;
  severity: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

const DEFAULT_TOAST: ToastState = {
  open: false,
  severity: 'info',
  message: '',
};

const buildTabDefinitions = (executions: PromptEditorExecution[]) => {
  const previewBadge = executions.length || undefined;
  return [
    { value: 'editor' as PromptEditorTab, label: 'Editor' },
    { value: 'preview' as PromptEditorTab, label: 'Preview', badge: previewBadge },
    { value: 'test' as PromptEditorTab, label: 'Test', disabled: true },
    { value: 'history' as PromptEditorTab, label: 'History', disabled: true },
  ];
};

const toPromptEditorExecution = (
  execution: NonNullable<PromptSpec['executions']>[number],
): PromptEditorExecution => ({
  id: execution.id ?? `execution-${Date.now()}`,
  timestamp: execution.timestamp ?? new Date().toISOString(),
  response: execution.response
    ? {
        content: execution.response.content ?? undefined,
        usage: execution.response.usage
          ? {
              outputTokens: execution.response.usage.outputTokens ?? undefined,
            }
          : undefined,
      }
    : undefined,
  placeholders: (execution.placeholders ?? []).map((placeholder) => ({
    name: placeholder.name ?? '',
    defaultValue: placeholder.defaultValue ?? undefined,
  })),
  evaluations: (execution.evaluations ?? []).map((evaluation) => ({
    evaluator: evaluation.evaluator ?? '',
    type: evaluation.type ?? '',
    description: evaluation.description ?? undefined,
    success: evaluation.success ?? undefined,
    score: evaluation.score ?? undefined,
    reasoning: evaluation.reasoning ?? undefined,
    comments: evaluation.comments ?? undefined,
  })),
});

const readEvaluationResults = (prompt: PromptSpec | null | undefined): PromptEditorEvaluationResult[] => {
  const rawEvaluation = prompt?.extensions?.['x-evaluation'];
  if (!rawEvaluation || typeof rawEvaluation !== 'object') {
    return [];
  }

  const results = (rawEvaluation as { results?: { evaluations?: PromptEditorEvaluationResult[] } }).results;
  return Array.isArray(results?.evaluations) ? results.evaluations : [];
};

const buildDraftSummary = (prompt: ReturnType<typeof createEmptyPromptDraft>['draft']): string =>
  prompt.request.messages
    .map((message) => `${message.role}: ${message.content || '(empty)'}`)
    .join('\n');

const toPlaceholderManagerState = (draft: PromptDraftInput): { config: PlaceholderConfig; placeholders: Placeholder[] } => ({
  config: {
    openSequence: draft.placeholders.startPattern ?? '{{',
    closeSequence: draft.placeholders.endPattern ?? '}}',
  },
  placeholders: draft.placeholders.list.map((placeholder, index) => ({
    id: `placeholder-${index}-${placeholder.name || 'new'}`,
    name: placeholder.name || `placeholder_${index + 1}`,
    values: [placeholder.value ?? ''],
    currentValueIndex: 0,
  })),
});

const withProcessedPlaceholders = (
  draft: PromptDraftInput,
  processText: (text: string) => string,
): PromptDraftInput => ({
  ...draft,
  request: {
    ...draft.request,
    messages: draft.request.messages.map((message) => ({
      ...message,
      content: processText(message.content),
    })),
  },
});

export const PromptEditorPage: React.FC<PromptEditorPageProps> = ({ mode, promptId }) => {
  const navigate = useNavigate();
  const data = usePromptEditorData({ mode, promptId });
  const capabilities = useCapabilities();
  const editor = usePromptEditorDraft(useMemo(() => createEmptyPromptDraft(), []));
  const { replaceState, setRepositoryUrl } = editor;
  const [toast, setToast] = useState<ToastState>(DEFAULT_TOAST);
  const [activeTab, setActiveTab] = useState<PromptEditorTab>('editor');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [showMetadataDetails, setShowMetadataDetails] = useState(false);
  const [showAdvancedParameters, setShowAdvancedParameters] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validationRequested, setValidationRequested] = useState(false);
  const [localExecutions, setLocalExecutions] = useState<PromptEditorExecution[]>([]);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdPromptId, setCreatedPromptId] = useState<string | null>(null);
  const [toolConfigs, setToolConfigs] = useState<PromptEditorToolConfig[]>([]);
  const [messageSelection, setMessageSelection] = useState<MessageContentSelection | null>(null);

  const isEvaluationCapabilityEnabled = Boolean(capabilities.data?.features?.includes('evals'));

  const evaluationEnabledForValidation = isEvaluationCapabilityEnabled ? editor.state.evaluationEnabled : false;

  const evaluationEnabledForPayload = isEvaluationCapabilityEnabled
    ? editor.state.evaluationEnabled
    : Boolean(editor.state.draft.extensions?.['x-evaluation']);

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

  useEffect(() => {
    const activeRepositoryUrl = data.activeProject?.repositoryUrl;
    if (!activeRepositoryUrl) {
      return;
    }

    if (mode === 'create') {
      if (editor.state.draft.repositoryUrl !== activeRepositoryUrl) {
        setRepositoryUrl(activeRepositoryUrl);
      }
      return;
    }

    if (!editor.state.draft.repositoryUrl) {
      setRepositoryUrl(activeRepositoryUrl);
    }
  }, [data.activeProject?.repositoryUrl, editor.state.draft.repositoryUrl, mode, setRepositoryUrl]);

  const placeholderManagerState = useMemo(
    () => toPlaceholderManagerState(editor.state.draft),
    [editor.state.draft],
  );
  const { processText } = usePlaceholderProcessor(
    placeholderManagerState.config,
    placeholderManagerState.placeholders,
  );

  const remoteExecutions = useMemo(
    () => (data.prompt?.executions ?? []).map(toPromptEditorExecution),
    [data.prompt?.executions],
  );

  const allExecutions = useMemo(
    () => mergeExecutions(localExecutions, remoteExecutions),
    [localExecutions, remoteExecutions],
  );

  const selectedExecution = useMemo(() => {
    return pickSelectedExecution(allExecutions, selectedExecutionId);
  }, [allExecutions, selectedExecutionId]);

  const validation = useMemo(
    () => validatePromptEditor(editor.state.draft, evaluationEnabledForValidation, toolConfigs),
    [editor.state.draft, evaluationEnabledForValidation, toolConfigs],
  );

  const displayedValidation = validationRequested ? validation : undefined;

  const draftSummary = useMemo(
    () => buildDraftSummary(editor.state.draft),
    [editor.state.draft],
  );

  const promptPath = useMemo(() => {
    const group = editor.state.draft.group || '[group]';
    const name = editor.state.draft.name || '[name]';
    return ['prompts', group, name, 'promptlm.yml'].join('/');
  }, [editor.state.draft.group, editor.state.draft.name]);

  const authorsDisplay = useMemo(() => {
    const authors = data.prompt?.authors ?? [];
    return authors.length ? authors.join(', ') : 'Resolved from Git author information when saving';
  }, [data.prompt?.authors]);

  const evaluationResults = useMemo(
    () => [...readEvaluationResults(data.prompt), ...(selectedExecution?.evaluations ?? [])],
    [data.prompt, selectedExecution?.evaluations],
  );

  const tabs = useMemo(() => buildTabDefinitions(allExecutions), [allExecutions]);

  const showToast = useCallback((severity: ToastState['severity'], message: string) => {
    setToast({ open: true, severity, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((previous) => ({ ...previous, open: false }));
  }, []);

  const updatePlaceholderManager = useCallback(
    (nextConfig: PlaceholderConfig, nextPlaceholders: Placeholder[]) => {
      replaceState({
        ...editor.state,
        draft: {
          ...editor.state.draft,
          placeholders: {
            ...editor.state.draft.placeholders,
            startPattern: nextConfig.openSequence,
            endPattern: nextConfig.closeSequence,
            list: nextPlaceholders.map((placeholder) => ({
              name: placeholder.name,
              value: placeholder.values[placeholder.currentValueIndex] ?? placeholder.values[0] ?? '',
            })),
            defaults: Object.fromEntries(
              nextPlaceholders.map((placeholder) => [
                placeholder.name,
                placeholder.values[placeholder.currentValueIndex] ?? placeholder.values[0] ?? '',
              ]),
            ),
          },
        },
      });
    },
    [editor.state, replaceState],
  );

  const handlePlaceholderConfigChange = useCallback(
    (nextConfig: PlaceholderConfig) => {
      updatePlaceholderManager(nextConfig, placeholderManagerState.placeholders);
    },
    [placeholderManagerState.placeholders, updatePlaceholderManager],
  );

  const handlePlaceholdersChange = useCallback(
    (nextPlaceholders: Placeholder[]) => {
      updatePlaceholderManager(placeholderManagerState.config, nextPlaceholders);
    },
    [placeholderManagerState.config, updatePlaceholderManager],
  );

  const handleInsertPlaceholder = useCallback(
    (name: string) => {
      const token = createPlaceholderToken(
        placeholderManagerState.config.openSequence,
        name,
        placeholderManagerState.config.closeSequence,
      );
      const insertion = insertPlaceholderToken(editor.state.draft.request.messages, token, messageSelection);
      if (insertion.type === 'error') {
        showToast('error', insertion.message);
        return;
      }

      editor.updateMessage(insertion.messageIndex, 'content', insertion.nextContent);
      if (insertion.type === 'selection') {
        setMessageSelection({
          messageIndex: insertion.messageIndex,
          selectionStart: insertion.caretPosition,
          selectionEnd: insertion.caretPosition,
        });
        return;
      }
      setMessageSelection(null);
    },
    [editor, messageSelection, placeholderManagerState.config.closeSequence, placeholderManagerState.config.openSequence, showToast],
  );

  const handleAddToolConfig = useCallback(() => {
    setToolConfigs((previous) => [
      ...previous,
      {
        id: `tool-${Date.now()}-${previous.length + 1}`,
        name: '',
        scenario: 'default',
        mockResponse: '',
        notes: '',
      },
    ]);
  }, []);

  const handleRemoveToolConfig = useCallback((id: string) => {
    setToolConfigs((previous) => previous.filter((config) => config.id !== id));
  }, []);

  const handleToolConfigChange = useCallback(
    <K extends keyof PromptEditorToolConfig,>(id: string, field: K, value: PromptEditorToolConfig[K]) => {
      setToolConfigs((previous) =>
        previous.map((config) => (config.id === id ? { ...config, [field]: value } : config)),
      );
    },
    [],
  );

  const saveDraft = useCallback(async () => {
    flushSync(() => {
      setValidationRequested(true);
    });

    const currentValidation = validatePromptEditor(editor.state.draft, evaluationEnabledForValidation, toolConfigs);

    const result = await savePromptDraftAction({
      mode,
      createdPromptId,
      promptId: data.promptId,
      activeProjectId: data.activeProjectId,
      activeProjectRepositoryUrl: data.activeProject?.repositoryUrl,
      draft: editor.state.draft,
      evaluationEnabled: evaluationEnabledForPayload,
      validationHasErrors: currentValidation.hasErrors,
      createPrompt: data.createPrompt,
      updatePrompt: data.updatePrompt,
    });

    showToast(result.toast.severity, result.toast.message);

    if (result.updatedPrompt && mode === 'edit') {
      editor.replaceState(createPromptDraftFromPrompt(result.updatedPrompt));
    }

    if (result.shouldRefreshPrompt) {
      await data.refreshPrompt();
    }

    if (result.nextCreatedPromptId !== createdPromptId) {
      setCreatedPromptId(result.nextCreatedPromptId);
    }

    if (result.toast.severity === 'error') {
      return null;
    }

    return result.nextCreatedPromptId;
  }, [createdPromptId, data.activeProject?.repositoryUrl, data.activeProjectId, data.createPrompt, data.promptId, data.refreshPrompt, data.updatePrompt, editor, evaluationEnabledForPayload, evaluationEnabledForValidation, mode, processText, showToast, toolConfigs]);

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (event) => {
      event.preventDefault();
      await saveDraft();
    },
    [saveDraft],
  );

  const handleRelease = useCallback(async () => {
    setIsReleasing(true);
    try {
      const result = await releasePromptAction({
        mode,
        createdPromptId,
        promptId: data.promptId,
        releasePrompt: data.releasePrompt,
      });

      if (!result.toast) {
        return;
      }

      if (result.releasedPrompt && mode === 'edit') {
        editor.replaceState(createPromptDraftFromPrompt(result.releasedPrompt));
      }

      if (result.shouldRefreshPrompt) {
        await data.refreshPrompt();
      }

      if (result.nextCreatedPromptId !== createdPromptId) {
        setCreatedPromptId(result.nextCreatedPromptId);
      }

      showToast(result.toast.severity, result.toast.message);
    } finally {
      setIsReleasing(false);
    }
  }, [createdPromptId, data.promptId, data.refreshPrompt, data.releasePrompt, editor, mode, showToast]);

  const handleTryRun = useCallback(async () => {
    flushSync(() => {
      setValidationRequested(true);
    });

    if (!data.activeProjectId) {
      showToast('error', 'Select an active project before running.');
      return;
    }

    const currentValidation = validatePromptEditor(editor.state.draft, evaluationEnabledForValidation, toolConfigs);
    if (currentValidation.hasErrors) {
      showToast('error', 'Resolve validation errors before running.');
      return;
    }

    const preparedDraft = sanitizePromptDraft(
      editor.state.draft,
      evaluationEnabledForPayload,
      data.activeProject?.repositoryUrl ?? undefined,
    );
    const runtimeDraft = withProcessedPlaceholders(preparedDraft, processText);
    const executeRequest = buildExecutePromptRequest(runtimeDraft);

    setIsRunning(true);
    setLatestResponse(null);
    setCopied(false);
    try {
      const executed =
        mode === 'edit' && data.promptId
          ? await data.executeStoredPrompt(data.promptId, executeRequest)
          : await data.executePrompt(executeRequest);

      const nextExecution =
        executed.executions?.[0] != null
          ? toPromptEditorExecution(executed.executions[0])
          : {
              id: `local-${Date.now()}`,
              timestamp: new Date().toISOString(),
              response: executed.response
                ? {
                    content: executed.response.content ?? undefined,
                    usage: executed.response.usage
                      ? { outputTokens: executed.response.usage.outputTokens ?? undefined }
                      : undefined,
                  }
                : undefined,
              placeholders: runtimeDraft.placeholders.list.map((placeholder) => ({
                name: placeholder.name,
                defaultValue: placeholder.value,
              })),
              evaluations: [],
            };

      setLocalExecutions((previous) => [nextExecution, ...previous.filter((execution) => execution.id !== nextExecution.id)]);
      setSelectedExecutionId(nextExecution.id);
      setActiveTab('preview');
      setLatestResponse(nextExecution.response?.content ?? null);

      if (mode === 'edit') {
        await data.refreshPrompt();
      }

      showToast('success', 'Prompt executed.');
    } catch (error) {
      showToast('error', toDisplayError(error).message);
    } finally {
      setIsRunning(false);
    }
  }, [data.activeProject?.repositoryUrl, data.activeProjectId, data.executePrompt, data.executeStoredPrompt, data.promptId, data.refreshPrompt, editor.state.draft, evaluationEnabledForPayload, evaluationEnabledForValidation, mode, processText, showToast, toolConfigs]);

  const handleCopyResponse = useCallback(async () => {
    if (!latestResponse) {
      return;
    }

    // Keep UI feedback deterministic in headless/test contexts where clipboard
    // APIs may be unavailable or blocked.
    setCopied(true);
    try {
      await navigator.clipboard.writeText(latestResponse);
    } catch {
      // Ignore clipboard failures; the response text is already visible and the
      // copy intent feedback has been shown.
    }
  }, [latestResponse]);

  const handleAddEvaluation = useCallback(() => {
    if (!isEvaluationCapabilityEnabled) {
      return;
    }
    if (!editor.state.evaluationEnabled) {
      editor.setEvaluationEnabled(true);
    }
    editor.addEvaluation();
  }, [editor, isEvaluationCapabilityEnabled]);

  const headerMessages = useMemo<PromptEditorBannerMessage[]>(() => {
    const messages: PromptEditorBannerMessage[] = [];

    if (!data.activeProjectId && !data.isActiveProjectLoading) {
      messages.push({
        severity: 'warning',
        text: 'Select an active project before saving or running a prompt.',
      });
    }

    if (data.activeProjectError) {
      messages.push({
        severity: 'error',
        text: data.activeProjectError.message,
      });
    }

    if (data.promptError && mode === 'edit') {
      messages.push({
        severity: 'error',
        text: data.promptError.message,
      });
    }

    if (data.promptTemplateError && mode === 'create') {
      messages.push({
        severity: 'error',
        text: data.promptTemplateError.message,
      });
    }

    if (data.mutationError) {
      messages.push({
        severity: 'error',
        text: data.mutationError.message,
      });
    }

    return messages;
  }, [data.activeProjectError, data.activeProjectId, data.isActiveProjectLoading, data.mutationError, data.promptError, data.promptTemplateError, mode]);

  const isBusy = data.isSaving || data.isPromptLoading || data.isPromptTemplateLoading;

  if (mode === 'edit' && data.isPromptLoading && !data.prompt) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (mode === 'edit' && !data.prompt && data.promptError) {
    return (
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h5">Prompt not found</Typography>
        <Typography color="text.secondary">{data.promptError.message}</Typography>
      </Stack>
    );
  }

  if (mode === 'create' && data.isPromptTemplateLoading && !data.promptTemplate) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (mode === 'create' && !data.promptTemplate && data.promptTemplateError) {
    return (
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h5">Unable to load prompt template</Typography>
        <Typography color="text.secondary">{data.promptTemplateError.message}</Typography>
        <Button variant="contained" onClick={() => void data.refreshPromptTemplate()}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={closeToast} sx={{ borderRadius: 999, px: 2.5, py: 1 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Stack spacing={3}>
        <PromptEditorHeader
          mode={mode}
          title={mode === 'create' ? 'Create prompt' : editor.state.draft.name || 'Edit prompt'}
          description={
            mode === 'create'
              ? 'Compose a prompt draft and save it into the active project.'
              : editor.state.draft.description || 'Review, test, and release the current prompt draft.'
          }
          isBusy={isBusy}
          isReleasing={isReleasing}
          messages={headerMessages}
          onBack={() => navigate('/prompts')}
          onCreate={() => {
            void saveDraft();
          }}
          onEdit={() => {
            void saveDraft();
          }}
          onRelease={handleRelease}
          createLabel="Save prompt"
          editLabel="Save prompt"
          releaseLabel="Release"
        />

        <PromptEditorTabsLayout
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          executions={
            allExecutions.length > 0
              ? {
                  selectedId: selectedExecutionId ?? allExecutions[0]?.id ?? null,
                  options: allExecutions.map((execution, index) => ({
                    id: execution.id,
                    label: new Date(execution.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    helperText: index === 0 ? 'Latest' : undefined,
                  })),
                  onSelect: setSelectedExecutionId,
                }
              : undefined
          }
          tabPanelSlot={
            activeTab === 'preview' ? (
              <PromptPreviewCard draftSummary={draftSummary} execution={selectedExecution} />
            ) : undefined
          }
        />

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={5} lg={4}>
            <Stack spacing={3}>
              <ModelConfigurationCard
                request={editor.state.draft.request}
                showAdvancedParameters={showAdvancedParameters}
                onToggleAdvancedParameters={() => setShowAdvancedParameters((previous) => !previous)}
                onRequestChange={(field, value) => editor.updateRequestField(field, value ?? '')}
                onParameterChange={(field, value) => editor.updateParameter(field, value)}
                onStreamChange={editor.toggleStream}
                errors={displayedValidation?.modelConfiguration}
              />

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Placeholders
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Template variables resolved at runtime.
                    </Typography>
                  </Box>
                  {displayedValidation?.placeholders?.general ? (
                    <Alert severity="error" variant="outlined">
                      {displayedValidation.placeholders.general}
                    </Alert>
                  ) : null}
                  <PlaceholderManager
                    placeholders={placeholderManagerState.placeholders}
                    config={placeholderManagerState.config}
                    onPlaceholdersChange={handlePlaceholdersChange}
                    onConfigChange={handlePlaceholderConfigChange}
                    onInsertPlaceholder={handleInsertPlaceholder}
                  />
                </Stack>
              </Paper>

              <ToolConfigsCard
                configs={toolConfigs}
                onAddConfig={handleAddToolConfig}
                onRemoveConfig={handleRemoveToolConfig}
                onConfigChange={handleToolConfigChange}
                errors={displayedValidation?.toolConfigs}
              />

              {isEvaluationCapabilityEnabled ? (
                <EvaluationPlanCard
                  enabled={editor.state.evaluationEnabled}
                  evaluations={editor.state.draft.evaluations ?? []}
                  onToggleEnabled={editor.setEvaluationEnabled}
                  onEvaluationChange={editor.updateEvaluation}
                  onAddEvaluation={handleAddEvaluation}
                  onRemoveEvaluation={editor.removeEvaluation}
                  errors={displayedValidation?.evaluationPlan}
                />
              ) : null}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7} lg={8}>
            <Stack spacing={3}>
              <MetadataCard
                group={editor.state.draft.group}
                name={editor.state.draft.name}
                description={editor.state.draft.description}
                authorsDisplay={authorsDisplay}
                promptPath={promptPath}
                versionLabel={editor.state.draft.version}
                revision={editor.state.draft.revision}
                showMetadataDetails={showMetadataDetails}
                onToggleMetadataDetails={() => setShowMetadataDetails((previous) => !previous)}
                onGroupChange={(value) => editor.updateMetadata('group', value)}
                onNameChange={(value) => editor.updateMetadata('name', value)}
                onDescriptionChange={(value) => editor.updateMetadata('description', value)}
                errors={displayedValidation?.metadata}
              />

              <MessagesCard
                messages={editor.state.draft.request.messages}
                availableRoles={editor.availableMessageRoles}
                onAddMessage={editor.addMessage}
                onMessageChange={(index, field, value) => editor.updateMessage(index, field, value)}
                onRemoveMessage={editor.removeMessage}
                onContentSelectionChange={setMessageSelection}
                onTryRun={handleTryRun}
                onNavigateBack={() => navigate('/prompts')}
                isBusy={isBusy}
                isSaving={data.isSaving}
                hasActiveProject={Boolean(data.activeProjectId)}
                isActiveProjectLoading={data.isActiveProjectLoading}
                errors={displayedValidation?.messages}
              />

              {(isRunning || latestResponse || createdPromptId) ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Response
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Run the draft and optionally publish it after saving.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1.5}>
                        {latestResponse ? (
                          <Button variant="outlined" onClick={() => void handleCopyResponse()}>
                            {copied ? 'Copied' : 'Copy'}
                          </Button>
                        ) : null}
                        {createdPromptId ? (
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => void handleRelease()}
                            disabled={isReleasing}
                            data-testid="prompt-editor-release-action"
                          >
                            {isReleasing ? 'Publishing…' : 'Release'}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>

                    {isRunning ? (
                      <Typography color="text.secondary">Generating response...</Typography>
                    ) : latestResponse ? (
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{latestResponse}</Typography>
                      </Paper>
                    ) : (
                      <Typography color="text.secondary">Click "Run" to execute the prompt and see the response here.</Typography>
                    )}
                  </Stack>
                </Paper>
              ) : null}

              {selectedExecution && mode === 'edit' ? (
                <LastExecutionCard
                  lastExecution={selectedExecution}
                  executions={allExecutions}
                  onSelectExecution={setSelectedExecutionId}
                />
              ) : null}

              {evaluationResults.length > 0 ? (
                <EvaluationResultsCard results={evaluationResults} />
              ) : null}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};
