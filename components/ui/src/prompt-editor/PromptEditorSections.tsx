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

import React from 'react';
import { Mono, Tag } from '../prompts-v2/atoms';
import {
  Disclosure,
  IconButton,
  SelectField,
  SwitchField,
  TextArea,
  TextField,
} from '../prompts-v2/forms';
import type { SelectOption } from '../prompts-v2/forms';
import type { PromptEditorTab } from './types';
import { SectionCard } from '../components/SectionCard/SectionCard';
import { PromptEditorTabs } from './PromptEditorTabs';

export type PromptEditorMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type PromptEditorMessage = {
  id: string;
  role: PromptEditorMessageRole;
  content: string;
  name?: string;
};

export type PromptEditorPlaceholder = {
  name: string;
  value: string;
};

export type PromptEditorPlaceholderConfig = {
  startPattern?: string | null;
  endPattern?: string | null;
  list: PromptEditorPlaceholder[];
};

export type PromptEditorToolConfig = {
  id: string;
  name: string;
  scenario: string;
  mockResponse: string;
  notes: string;
};

export type PromptEditorEvaluationPlan = {
  evaluator: string;
  type: string;
  description?: string;
};

export type PromptEditorEvaluationResult = PromptEditorEvaluationPlan & {
  success?: boolean;
  score?: number;
  reasoning?: string;
  comments?: string;
};

export type PromptEditorExecution = {
  id: string;
  timestamp: string;
  response?: {
    content?: string;
    usage?: {
      outputTokens?: number;
    };
  };
  placeholders: { name: string; defaultValue?: string | null }[];
  evaluations: PromptEditorEvaluationResult[];
};

export type PromptEditorRequestDraft = {
  vendor: string;
  model: string;
  modelSnapshot?: string | null;
  url?: string | null;
  parameters: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  };
  messages: PromptEditorMessage[];
};

const MESSAGE_ROLE_LABEL: Record<PromptEditorMessageRole, string> = {
  system: 'System',
  user: 'User',
  assistant: 'Assistant',
  tool: 'Tool',
};

const MESSAGE_ROLE_TONES: Record<
  PromptEditorMessageRole,
  'neutral' | 'signal' | 'ok' | 'warn'
> = {
  system: 'signal',
  user: 'neutral',
  assistant: 'ok',
  tool: 'warn',
};

export type ModelConfigurationErrors = {
  vendor?: string;
  model?: string;
  modelSnapshot?: string;
  url?: string;
  parameters?: Partial<Record<keyof PromptEditorRequestDraft['parameters'], string>>;
  general?: string;
};

export const DEFAULT_MESSAGE_ROLES: PromptEditorMessageRole[] = ['system', 'user', 'assistant', 'tool'];

export type PlaceholdersErrors = {
  startPattern?: string;
  endPattern?: string;
  list?: { name?: string; value?: string }[];
  general?: string;
};

export type MetadataErrors = {
  group?: string;
  name?: string;
  description?: string;
  general?: string;
};

export type ToolConfigsErrors = {
  general?: string;
  configs?: {
    name?: string;
    scenario?: string;
    notes?: string;
    mockResponse?: string;
  }[];
};

export type EvaluationPlanErrors = {
  general?: string;
  evaluations?: {
    evaluator?: string;
    type?: string;
    description?: string;
  }[];
};

export type MessagesErrors = {
  general?: string;
  list?: {
    role?: string;
    name?: string;
    content?: string;
  }[];
};

const VENDOR_OPTIONS: SelectOption[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
];

const MODEL_OPTIONS: SelectOption[] = [
  { value: 'gpt-4o', label: 'gpt-4o' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'claude-3-5', label: 'claude-3-5' },
];

const ROW_GRID_2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
};

const ROW_GRID_3: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};

const COL_STACK = (gap = 12): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap,
});

const ROW_INLINE = (gap = 8): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap,
  flexWrap: 'wrap',
});

const InlineAlert: React.FC<{ message: string; tone?: 'fail' | 'warn' | 'signal' }> = ({
  message,
  tone = 'fail',
}) => {
  const palette = {
    fail: {
      bg: 'color-mix(in oklch, var(--pl-fail) 8%, var(--pl-paper))',
      bd: 'color-mix(in oklch, var(--pl-fail) 30%, var(--pl-ink-200))',
      fg: 'oklch(0.42 0.13 25)',
    },
    warn: {
      bg: 'color-mix(in oklch, var(--pl-warn) 14%, var(--pl-paper))',
      bd: 'color-mix(in oklch, var(--pl-warn) 40%, var(--pl-ink-200))',
      fg: 'oklch(0.42 0.10 75)',
    },
    signal: {
      bg: 'color-mix(in oklch, var(--pl-signal) 8%, var(--pl-paper))',
      bd: 'color-mix(in oklch, var(--pl-signal) 30%, var(--pl-ink-200))',
      fg: 'var(--pl-signal-ink)',
    },
  }[tone];
  return (
    <div
      role="alert"
      style={{
        padding: '8px 12px',
        borderRadius: 6,
        background: palette.bg,
        border: `1px solid ${palette.bd}`,
        color: palette.fg,
        fontSize: 12.5,
        lineHeight: 1.45,
      }}
    >
      {message}
    </div>
  );
};

const Subrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      padding: 12,
      border: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    {children}
  </div>
);

const PrimaryButton: React.FC<{
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  testId?: string;
}> = ({ type = 'button', onClick, disabled, children, testId }) => (
  <button
    type={type}
    className="pl-btn pl-btn-primary"
    onClick={onClick}
    disabled={disabled}
    data-testid={testId}
    style={{ height: 30, padding: '0 14px', fontSize: 12.5 }}
  >
    {children}
  </button>
);

const GhostButton: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  testId?: string;
}> = ({ onClick, disabled, children, testId }) => (
  <button
    type="button"
    className="pl-btn pl-btn-ghost"
    onClick={onClick}
    disabled={disabled}
    data-testid={testId}
    style={{ height: 30, padding: '0 12px', fontSize: 12.5 }}
  >
    {children}
  </button>
);

// ───────────────────────── ModelConfigurationCard ─────────────────────────

export type ModelConfigurationCardProps = {
  request: PromptEditorRequestDraft;
  showAdvancedParameters: boolean;
  onToggleAdvancedParameters: () => void;
  onRequestChange: <K extends 'vendor' | 'model' | 'modelSnapshot' | 'url'>(
    field: K,
    value: NonNullable<PromptEditorRequestDraft[K]> | null,
  ) => void;
  onParameterChange: <K extends keyof PromptEditorRequestDraft['parameters']>(
    field: K,
    value: PromptEditorRequestDraft['parameters'][K],
  ) => void;
  onStreamChange: (checked: boolean) => void;
  errors?: ModelConfigurationErrors;
};

export const ModelConfigurationCard: React.FC<ModelConfigurationCardProps> = ({
  request,
  showAdvancedParameters,
  onToggleAdvancedParameters,
  onRequestChange,
  onParameterChange,
  onStreamChange,
  errors,
}) => {
  const numericChange =
    <K extends keyof PromptEditorRequestDraft['parameters']>(field: K) =>
    (raw: string) => {
      const value =
        raw === '' ? undefined : (Number(raw) as PromptEditorRequestDraft['parameters'][K]);
      onParameterChange(field, value);
    };

  return (
    <SectionCard
      title="Model Config"
      subtitle="Chat completion vendor, model, and runtime parameters"
    >
      <div style={COL_STACK(14)}>
        {errors?.general ? <InlineAlert message={errors.general} /> : null}

        <div style={ROW_GRID_2}>
          <SelectField
            label="vendor"
            value={request.vendor}
            onChange={(v) => onRequestChange('vendor', v)}
            options={VENDOR_OPTIONS}
            error={errors?.vendor}
            selectAttrs={{ 'data-testid': 'request-vendor-select' }}
          />
          <SelectField
            label="model"
            value={request.model}
            onChange={(v) => onRequestChange('model', v)}
            options={MODEL_OPTIONS}
            required
            error={errors?.model}
            selectAttrs={{ 'data-testid': 'request-model-select' }}
          />
        </div>

        <div style={ROW_GRID_2}>
          <TextField
            label="model snapshot"
            value={request.modelSnapshot ?? ''}
            onChange={(v) => onRequestChange('modelSnapshot', v)}
            placeholder="2025-02-01"
            error={errors?.modelSnapshot}
            inputAttrs={{ 'data-testid': 'request-model-snapshot-input' }}
          />
          <TextField
            label="api endpoint"
            value={request.url ?? ''}
            onChange={(v) => onRequestChange('url', v)}
            error={errors?.url}
            inputAttrs={{ 'data-testid': 'request-url-input' }}
          />
        </div>

        <Disclosure
          open={showAdvancedParameters}
          onToggle={onToggleAdvancedParameters}
          label="advanced parameters"
          triggerId="model-config-advanced-parameters-toggle"
          regionId="model-config-advanced-parameters"
        >
          <div style={ROW_GRID_3}>
            <TextField
              label="temperature"
              type="number"
              value={request.parameters.temperature?.toString() ?? ''}
              onChange={numericChange('temperature')}
              error={errors?.parameters?.temperature}
              inputAttrs={{
                step: 0.1,
                min: 0,
                max: 2,
                'data-testid': 'request-temperature-input',
              }}
            />
            <TextField
              label="top p"
              type="number"
              value={request.parameters.topP?.toString() ?? ''}
              onChange={numericChange('topP')}
              error={errors?.parameters?.topP}
              inputAttrs={{
                step: 0.05,
                min: 0,
                max: 1,
                'data-testid': 'request-top-p-input',
              }}
            />
            <TextField
              label="max tokens"
              type="number"
              value={request.parameters.maxTokens?.toString() ?? ''}
              onChange={numericChange('maxTokens')}
              error={errors?.parameters?.maxTokens}
              inputAttrs={{ step: 1, min: 1, 'data-testid': 'request-max-tokens-input' }}
            />
            <TextField
              label="frequency penalty"
              type="number"
              value={request.parameters.frequencyPenalty?.toString() ?? ''}
              onChange={numericChange('frequencyPenalty')}
              error={errors?.parameters?.frequencyPenalty}
              inputAttrs={{
                step: 0.1,
                min: -2,
                max: 2,
                'data-testid': 'request-frequency-penalty-input',
              }}
            />
            <TextField
              label="presence penalty"
              type="number"
              value={request.parameters.presencePenalty?.toString() ?? ''}
              onChange={numericChange('presencePenalty')}
              error={errors?.parameters?.presencePenalty}
              inputAttrs={{
                step: 0.1,
                min: -2,
                max: 2,
                'data-testid': 'request-presence-penalty-input',
              }}
            />
            <SelectField
              label="stream responses"
              value={String(Boolean(request.parameters.stream))}
              onChange={(v) => onStreamChange(v === 'true')}
              options={[
                { value: 'false', label: 'false' },
                { value: 'true', label: 'true' },
              ]}
              selectAttrs={{ 'data-testid': 'request-stream-select' }}
            />
          </div>
        </Disclosure>
      </div>
    </SectionCard>
  );
};

// ───────────────────────── PlaceholdersCard ─────────────────────────

export type PlaceholdersCardProps = {
  placeholders: PromptEditorPlaceholderConfig;
  showPlaceholders: boolean;
  onTogglePlaceholders: () => void;
  onAddPlaceholder: () => void;
  onRemovePlaceholder: (index: number) => void;
  onPlaceholderChange: (index: number, field: 'name' | 'value', value: string) => void;
  onPlaceholderPatternChange: (field: 'startPattern' | 'endPattern', value: string) => void;
  errors?: PlaceholdersErrors;
};

export const PlaceholdersCard: React.FC<PlaceholdersCardProps> = ({
  placeholders,
  showPlaceholders,
  onTogglePlaceholders,
  onAddPlaceholder,
  onRemovePlaceholder,
  onPlaceholderChange,
  onPlaceholderPatternChange,
  errors,
}) => (
  <SectionCard title="Placeholders" subtitle="Template variables injected before execution">
    <div style={COL_STACK(14)}>
      {errors?.general ? <InlineAlert message={errors.general} /> : null}

      <div style={ROW_GRID_2}>
        <TextField
          label="start pattern"
          value={placeholders.startPattern ?? ''}
          onChange={(v) => onPlaceholderPatternChange('startPattern', v)}
          error={errors?.startPattern}
        />
        <TextField
          label="end pattern"
          value={placeholders.endPattern ?? ''}
          onChange={(v) => onPlaceholderPatternChange('endPattern', v)}
          error={errors?.endPattern}
        />
      </div>

      <div style={ROW_INLINE(8)}>
        <GhostButton onClick={onAddPlaceholder}>+ Add placeholder</GhostButton>
      </div>

      <Disclosure
        open={showPlaceholders}
        onToggle={onTogglePlaceholders}
        label="placeholder list"
        idPrefix="placeholder-list"
      >
        {placeholders.list.length === 0 ? (
          <Mono size={12} color="var(--pl-ink-600)">
            No placeholders defined yet.
          </Mono>
        ) : (
          <div style={COL_STACK(8)}>
            {placeholders.list.map((placeholder, index) => (
              <Subrow key={index}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 28px',
                    gap: 12,
                    alignItems: 'end',
                  }}
                >
                  <TextField
                    label="name"
                    value={placeholder.name}
                    onChange={(v) => onPlaceholderChange(index, 'name', v)}
                    error={errors?.list?.[index]?.name}
                  />
                  <TextField
                    label="default value"
                    value={placeholder.value}
                    onChange={(v) => onPlaceholderChange(index, 'value', v)}
                    error={errors?.list?.[index]?.value}
                  />
                  <IconButton
                    icon="trash"
                    label="Remove placeholder"
                    onClick={() => onRemovePlaceholder(index)}
                  />
                </div>
              </Subrow>
            ))}
          </div>
        )}
      </Disclosure>
    </div>
  </SectionCard>
);

// ───────────────────────── MetadataCard ─────────────────────────

export type MetadataCardProps = {
  group: string;
  name: string;
  description?: string;
  authorsDisplay: string;
  promptPath: string;
  versionLabel?: string;
  revision?: number;
  showMetadataDetails: boolean;
  onToggleMetadataDetails: () => void;
  onGroupChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  errors?: {
    group?: string;
    name?: string;
    description?: string;
    general?: string;
  };
};

export const MetadataCard: React.FC<MetadataCardProps> = ({
  group,
  name,
  description,
  authorsDisplay,
  promptPath,
  versionLabel,
  revision,
  showMetadataDetails,
  onToggleMetadataDetails,
  onGroupChange,
  onNameChange,
  onDescriptionChange,
  errors,
}) => (
  <SectionCard title="Basic information" subtitle="Describe the prompt and link it to a project">
    <div style={COL_STACK(14)}>
      {errors?.general ? <InlineAlert message={errors.general} /> : null}

      <div style={ROW_GRID_2}>
        <TextField
          label="prompt group"
          value={group}
          onChange={onGroupChange}
          required
          error={
            errors?.group ? (
              <span data-testid="prompt-group-error">{errors.group}</span>
            ) : undefined
          }
          helperText="Only letters, numbers, '-' and '_' are allowed."
          inputAttrs={{ inputMode: 'text', 'data-testid': 'prompt-group-input' }}
        />
        <TextField
          label="prompt name"
          value={name}
          onChange={onNameChange}
          required
          error={
            errors?.name ? (
              <span data-testid="prompt-name-error">{errors.name}</span>
            ) : undefined
          }
          helperText="Only letters, numbers, '-' and '_' are allowed."
          inputAttrs={{ inputMode: 'text', 'data-testid': 'prompt-name-input' }}
        />
      </div>

      <TextArea
        label="description"
        value={description ?? ''}
        onChange={onDescriptionChange}
        rows={3}
        error={errors?.description}
        textareaAttrs={{ 'data-testid': 'description-text' }}
      />

      <Disclosure
        open={showMetadataDetails}
        onToggle={onToggleMetadataDetails}
        label="additional metadata"
        idPrefix="metadata-details"
      >
        <div style={COL_STACK(12)} tabIndex={-1}>
          <div>
            <Mono
              size={9.5}
              color="var(--pl-ink-500)"
              style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              repository path
            </Mono>
            <Mono size={12} color="var(--pl-ink-900)" style={{ display: 'block', marginTop: 2 }}>
              {promptPath}
            </Mono>
          </div>
          <div style={ROW_GRID_2}>
            <div>
              <Mono
                size={9.5}
                color="var(--pl-ink-500)"
                style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                version
              </Mono>
              <Mono size={12} color="var(--pl-ink-900)" style={{ display: 'block', marginTop: 2 }}>
                {versionLabel ?? '0.1.0-SNAPSHOT'}
              </Mono>
              <Mono size={11} color="var(--pl-ink-500)" style={{ marginTop: 2 }}>
                Managed during release
              </Mono>
            </div>
            <div>
              <Mono
                size={9.5}
                color="var(--pl-ink-500)"
                style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                revision
              </Mono>
              <Mono size={12} color="var(--pl-ink-900)" style={{ display: 'block', marginTop: 2 }}>
                {revision ?? 1}
              </Mono>
              <Mono size={11} color="var(--pl-ink-500)" style={{ marginTop: 2 }}>
                Auto-incremented on save
              </Mono>
            </div>
          </div>
          <div>
            <Mono
              size={9.5}
              color="var(--pl-ink-500)"
              style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              authors
            </Mono>
            <Mono size={12} color="var(--pl-ink-900)" style={{ display: 'block', marginTop: 2 }}>
              {authorsDisplay}
            </Mono>
            <Mono size={11} color="var(--pl-ink-500)" style={{ marginTop: 2 }}>
              Determined from your Git identity
            </Mono>
          </div>
        </div>
      </Disclosure>
    </div>
  </SectionCard>
);

// ───────────────────────── ToolConfigsCard ─────────────────────────

export type ToolConfigsCardProps = {
  configs: PromptEditorToolConfig[];
  onAddConfig: () => void;
  onRemoveConfig: (id: string) => void;
  onConfigChange: <K extends keyof PromptEditorToolConfig>(
    id: string,
    field: K,
    value: PromptEditorToolConfig[K],
  ) => void;
  errors?: ToolConfigsErrors;
};

export const ToolConfigsCard: React.FC<ToolConfigsCardProps> = ({
  configs,
  onAddConfig,
  onRemoveConfig,
  onConfigChange,
  errors,
}) => (
  <SectionCard title="MCP Tools" subtitle="Define mockable tools available to this prompt">
    <div style={COL_STACK(12)}>
      {errors?.general ? <InlineAlert message={errors.general} /> : null}

      {configs.length === 0 ? (
        <Mono size={12} color="var(--pl-ink-600)">
          No tools configured yet. Add at least one tool to describe its mock behavior for MCP replay.
        </Mono>
      ) : (
        <div style={COL_STACK(10)}>
          {configs.map((config, index) => {
            const e = errors?.configs?.[index];
            return (
              <Subrow key={config.id}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) 28px',
                    gap: 12,
                    alignItems: 'end',
                  }}
                >
                  <TextField
                    label="tool name"
                    value={config.name}
                    onChange={(v) => onConfigChange(config.id, 'name', v)}
                    placeholder="inventory.search"
                    required
                    error={e?.name}
                    inputAttrs={{ 'data-testid': `tool-name-input-${index}` }}
                  />
                  <TextField
                    label="tool description"
                    value={config.notes}
                    onChange={(v) => onConfigChange(config.id, 'notes', v)}
                    placeholder="Search documentation for relevant answers."
                    error={e?.notes}
                    inputAttrs={{ 'data-testid': `tool-description-input-${index}` }}
                  />
                  <TextField
                    label="scenario label"
                    value={config.scenario}
                    onChange={(v) => onConfigChange(config.id, 'scenario', v)}
                    placeholder="default"
                    error={e?.scenario}
                    helperText={e?.scenario ? undefined : 'Matches fixture behavior key'}
                  />
                  <IconButton
                    icon="trash"
                    label="Remove tool configuration"
                    onClick={() => onRemoveConfig(config.id)}
                  />
                </div>
                <TextArea
                  label="mock response preview"
                  value={config.mockResponse}
                  onChange={(v) => onConfigChange(config.id, 'mockResponse', v)}
                  placeholder='{ "count": 3, "items": [...] }'
                  rows={3}
                  error={e?.mockResponse}
                />
              </Subrow>
            );
          })}
        </div>
      )}

      <div style={ROW_INLINE(8)}>
        <GhostButton onClick={onAddConfig} testId="add-tool-button">
          + Add tool configuration
        </GhostButton>
      </div>
    </div>
  </SectionCard>
);

// ───────────────────────── EvaluationPlanCard ─────────────────────────

export type EvaluationPlanCardProps = {
  enabled: boolean;
  evaluations: PromptEditorEvaluationPlan[];
  onToggleEnabled: (checked: boolean) => void;
  onEvaluationChange: (
    index: number,
    field: keyof PromptEditorEvaluationPlan,
    value: string,
  ) => void;
  onAddEvaluation: () => void;
  onRemoveEvaluation: (index: number) => void;
  errors?: EvaluationPlanErrors;
};

export const EvaluationPlanCard: React.FC<EvaluationPlanCardProps> = ({
  enabled,
  evaluations,
  onToggleEnabled,
  onEvaluationChange,
  onAddEvaluation,
  onRemoveEvaluation,
  errors,
}) => (
  <SectionCard
    title="Evals"
    subtitle="Define automatic or human checks for responses"
    action={<SwitchField checked={enabled} onChange={onToggleEnabled} label="Enable" />}
  >
    <div style={COL_STACK(12)}>
      {errors?.general ? <InlineAlert message={errors.general} /> : null}

      {enabled && evaluations.length ? (
        <div style={COL_STACK(10)}>
          {evaluations.map((evaluation, index) => {
            const e = errors?.evaluations?.[index];
            return (
              <Subrow key={index}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) 28px',
                    gap: 12,
                    alignItems: 'end',
                  }}
                >
                  <TextField
                    label="evaluator"
                    value={evaluation.evaluator}
                    onChange={(v) => onEvaluationChange(index, 'evaluator', v)}
                    error={e?.evaluator}
                    inputAttrs={{ 'data-testid': `evaluation-evaluator-input-${index}` }}
                  />
                  <TextField
                    label="type"
                    value={evaluation.type}
                    onChange={(v) => onEvaluationChange(index, 'type', v)}
                    error={e?.type}
                    inputAttrs={{ 'data-testid': `evaluation-type-input-${index}` }}
                  />
                  <TextField
                    label="description"
                    value={evaluation.description ?? ''}
                    onChange={(v) => onEvaluationChange(index, 'description', v)}
                    error={e?.description}
                    inputAttrs={{ 'data-testid': `evaluation-description-input-${index}` }}
                  />
                  <IconButton
                    icon="trash"
                    label="Remove evaluator"
                    onClick={() => onRemoveEvaluation(index)}
                  />
                </div>
              </Subrow>
            );
          })}
        </div>
      ) : (
        <Mono size={12} color="var(--pl-ink-600)">
          {enabled
            ? 'No evaluators defined yet. Add one to start tracking quality gates.'
            : 'Evaluations are disabled. Toggle the switch to add quality checks.'}
        </Mono>
      )}

      <div style={ROW_INLINE(8)}>
        <GhostButton onClick={onAddEvaluation} testId="add-evaluation-button">
          + Add evaluator
        </GhostButton>
      </div>
    </div>
  </SectionCard>
);

// ───────────────────────── MessagesCard ─────────────────────────

export type MessageContentSelection = {
  messageIndex: number;
  selectionStart: number;
  selectionEnd: number;
};

export type MessagesCardProps = {
  messages: PromptEditorMessage[];
  availableRoles: PromptEditorMessageRole[];
  onAddMessage: (role: PromptEditorMessageRole) => void;
  onMessageChange: (index: number, field: 'role' | 'content' | 'name', value: string) => void;
  onRemoveMessage: (index: number) => void;
  onContentSelectionChange?: (selection: MessageContentSelection | null) => void;
  onTryRun: () => void;
  onNavigateBack: () => void;
  isBusy: boolean;
  isSaving: boolean;
  hasActiveProject: boolean;
  isActiveProjectLoading: boolean;
  errors?: MessagesErrors;
};

export const MessagesCard: React.FC<MessagesCardProps> = ({
  messages,
  availableRoles,
  onAddMessage,
  onMessageChange,
  onRemoveMessage,
  onContentSelectionChange,
  onTryRun,
  onNavigateBack,
  isBusy,
  isSaving,
  hasActiveProject,
  isActiveProjectLoading,
  errors,
}) => {
  const emitSelection = React.useCallback(
    (messageIndex: number, target: HTMLTextAreaElement) => {
      if (!onContentSelectionChange) return;
      const selectionStart = target.selectionStart ?? 0;
      const selectionEnd = target.selectionEnd ?? selectionStart;
      onContentSelectionChange({ messageIndex, selectionStart, selectionEnd });
    },
    [onContentSelectionChange],
  );

  return (
    <SectionCard title="Prompt messages" subtitle="Ordered chat conversation fed to the model">
      <div style={COL_STACK(14)}>
        {errors?.general ? <InlineAlert message={errors.general} /> : null}

        <div style={ROW_INLINE(8)}>
          {availableRoles.map((role) => (
            <GhostButton
              key={role}
              onClick={() => onAddMessage(role)}
              testId={role === 'user' ? 'user-prompt-button' : undefined}
            >
              + Add {MESSAGE_ROLE_LABEL[role]}
            </GhostButton>
          ))}
        </div>

        <div style={COL_STACK(10)} data-testid="prompt-messages">
          {messages.map((message, index) => {
            const e = errors?.list?.[index];
            const isLastUser =
              message.role === 'user' && index === messages.length - 1;
            return (
              <Subrow key={message.id}>
                <div style={{ ...ROW_INLINE(10), justifyContent: 'space-between' }}>
                  <div style={ROW_INLINE(8)}>
                    <Tag tone={MESSAGE_ROLE_TONES[message.role]}>
                      {MESSAGE_ROLE_LABEL[message.role]}
                    </Tag>
                    <div style={{ minWidth: 160 }}>
                      <SelectField
                        label="role"
                        unlabeled
                        value={message.role}
                        onChange={(v) => onMessageChange(index, 'role', v)}
                        options={DEFAULT_MESSAGE_ROLES.map((role) => ({
                          value: role,
                          label: MESSAGE_ROLE_LABEL[role],
                        }))}
                        error={e?.role}
                      />
                    </div>
                  </div>
                  <IconButton
                    icon="trash"
                    label="Remove message"
                    onClick={() => onRemoveMessage(index)}
                  />
                </div>

                {message.role === 'tool' ? (
                  <TextField
                    label="tool name"
                    value={message.name ?? ''}
                    onChange={(v) => onMessageChange(index, 'name', v)}
                    error={e?.name}
                  />
                ) : null}

                <TextArea
                  label="content"
                  value={message.content}
                  onChange={(v) => onMessageChange(index, 'content', v)}
                  rows={message.role === 'system' ? 3 : 2}
                  error={e?.content}
                  textareaAttrs={{
                    'aria-label': `Message content ${index + 1}`,
                    'data-testid': isLastUser ? 'prompt-text' : undefined,
                  }}
                  onSelect={(event) => emitSelection(index, event.currentTarget)}
                  onClick={(event) => emitSelection(index, event.currentTarget)}
                  onKeyUp={(event) => emitSelection(index, event.currentTarget)}
                  onFocus={(event) => emitSelection(index, event.currentTarget)}
                  onBlur={() => onContentSelectionChange?.(null)}
                />
              </Subrow>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <GhostButton onClick={onNavigateBack} disabled={isBusy}>
            Back to Prompts
          </GhostButton>
          <div style={ROW_INLINE(8)}>
            <GhostButton onClick={onTryRun} disabled={isBusy}>
              Run
            </GhostButton>
            <PrimaryButton
              type="submit"
              disabled={isSaving || !hasActiveProject || isActiveProjectLoading}
              testId="save-prompt-button"
            >
              Save
            </PrimaryButton>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

// ───────────────────────── PromptPreviewCard ─────────────────────────

export type PromptPreviewCardProps = {
  draftSummary: string;
  execution?: PromptEditorExecution;
};

export const PromptPreviewCard: React.FC<PromptPreviewCardProps> = ({
  draftSummary,
  execution,
}) => (
  <div style={COL_STACK(16)}>
    <SectionCard title="Prompt summary" subtitle="Current draft state">
      <pre
        style={{
          margin: 0,
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          color: 'var(--pl-ink-900)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}
      >
        {draftSummary}
      </pre>
    </SectionCard>
    {execution ? (
      <SectionCard
        title="Most recent response"
        subtitle={`Executed ${new Date(execution.timestamp).toLocaleString()}`}
      >
        <Mono size={12} color="var(--pl-ink-600)">
          Full output is shown in the response panel below.
        </Mono>
      </SectionCard>
    ) : null}
  </div>
);

// ───────────────────────── PromptEditorTabsLayout ─────────────────────────

export type PromptEditorTabsLayoutProps = {
  tabs: { value: PromptEditorTab; label: string; badge?: string | number; disabled?: boolean }[];
  activeTab: PromptEditorTab;
  onChangeTab: (value: PromptEditorTab) => void;
  executions?: {
    selectedId?: string | null;
    options: { id: string; label: string; helperText?: string }[];
    onSelect: (id: string) => void;
  };
  tabPanelSlot?: React.ReactNode;
};

export const PromptEditorTabsLayout: React.FC<PromptEditorTabsLayoutProps> = ({
  tabs,
  activeTab,
  onChangeTab,
  executions,
  tabPanelSlot,
}) => (
  <PromptEditorTabs
    tabs={tabs}
    value={activeTab}
    onChange={onChangeTab}
    executionOptions={executions}
    tabPanelSlot={tabPanelSlot}
  />
);

// ───────────────────────── LastExecutionCard ─────────────────────────

export type LastExecutionCardProps = {
  lastExecution: PromptEditorExecution;
  executions: PromptEditorExecution[];
  onSelectExecution: (id: string) => void;
};

export const LastExecutionCard: React.FC<LastExecutionCardProps> = ({
  lastExecution,
  executions,
  onSelectExecution,
}) => (
  <SectionCard
    title="Last execution"
    subtitle={`Run at ${new Date(lastExecution.timestamp).toLocaleString()}`}
    action={
      <div style={ROW_INLINE(8)}>
        {executions.length > 1
          ? executions.slice(0, 5).map((execution) => {
              const isActive = execution.id === lastExecution.id;
              return (
                <button
                  key={execution.id}
                  type="button"
                  onClick={() => onSelectExecution(execution.id)}
                  className={isActive ? 'pl-btn pl-btn-primary' : 'pl-btn pl-btn-ghost'}
                  style={{ height: 26, padding: '0 10px', fontSize: 11.5 }}
                >
                  {new Date(execution.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </button>
              );
            })
          : null}
        <Tag tone="signal">
          {lastExecution.response?.usage?.outputTokens ?? 0} output tokens
        </Tag>
      </div>
    }
  >
    <div style={COL_STACK(10)}>
      <Mono size={11.5} color="var(--pl-ink-600)">
        Response preview:
      </Mono>
      <Subrow>
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--pl-mono)',
            fontSize: 12,
            color: 'var(--pl-ink-900)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
          }}
        >
          {lastExecution.response?.content ?? 'No response content captured.'}
        </pre>
      </Subrow>
      {lastExecution.placeholders.length ? (
        <div style={ROW_INLINE(6)}>
          {lastExecution.placeholders.map((placeholder) => (
            <Tag key={placeholder.name}>
              {placeholder.name}: {placeholder.defaultValue ?? ''}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  </SectionCard>
);

// ───────────────────────── EvaluationResultsCard ─────────────────────────

export type EvaluationResultsCardProps = {
  results: PromptEditorEvaluationResult[];
};

export const EvaluationResultsCard: React.FC<EvaluationResultsCardProps> = ({ results }) => (
  <SectionCard title="Evaluation results" subtitle="Quality gates from recent runs">
    <div style={COL_STACK(10)}>
      {results.map((evaluation, index) => (
        <Subrow key={index}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto 1fr',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div>
              <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
                {evaluation.evaluator || 'Unnamed evaluator'}
              </Mono>
              <Mono size={11} color="var(--pl-ink-500)" style={{ display: 'block', marginTop: 2 }}>
                {evaluation.type}
              </Mono>
            </div>
            <div>
              {evaluation.success !== undefined ? (
                <Tag tone={evaluation.success ? 'ok' : 'fail'}>
                  {evaluation.success ? 'Pass' : 'Fail'}
                </Tag>
              ) : null}
            </div>
            <div>
              {evaluation.score !== undefined ? <Tag>Score {evaluation.score}</Tag> : null}
            </div>
            <Mono size={11.5} color="var(--pl-ink-600)">
              {evaluation.reasoning ?? ''}
            </Mono>
          </div>
          {evaluation.comments ? (
            <Mono size={11.5} color="var(--pl-ink-600)" style={{ marginTop: 6 }}>
              {evaluation.comments}
            </Mono>
          ) : null}
        </Subrow>
      ))}
    </div>
  </SectionCard>
);
