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
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ExpandMore, AddCircleOutline, DeleteOutline } from '@mui/icons-material';
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

const MESSAGE_ROLE_COLORS: Record<PromptEditorMessageRole, 'default' | 'primary' | 'secondary' | 'success'> = {
  system: 'secondary',
  user: 'primary',
  assistant: 'success',
  tool: 'default',
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
  const advancedParametersRegionId = 'model-config-advanced-parameters';
  const advancedParametersToggleId = 'model-config-advanced-parameters-toggle';
  const temperatureInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleNumericParameterChange = <K extends keyof PromptEditorRequestDraft['parameters']>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const parsedValue = rawValue === '' ? undefined : Number(rawValue);
      onParameterChange(field, parsedValue as PromptEditorRequestDraft['parameters'][K]);
    };

  return (
    <SectionCard title="Model Config" subtitle="Chat completion vendor, model, and runtime parameters">
      {errors?.general ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      ) : null}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Vendor"
            value={request.vendor}
            onChange={(event) => onRequestChange('vendor', event.target.value)}
            fullWidth
            error={Boolean(errors?.vendor)}
            helperText={errors?.vendor}
            SelectProps={{
              SelectDisplayProps: {
                'data-testid': 'request-vendor-select',
              } as React.HTMLAttributes<HTMLDivElement>,
            }}
          >
            <MenuItem value="openai">OpenAI</MenuItem>
            <MenuItem value="anthropic">Anthropic</MenuItem>
            <MenuItem value="google">Google</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Model"
            value={request.model}
            onChange={(event) => onRequestChange('model', event.target.value)}
            placeholder="gpt-4.1-mini"
            fullWidth
            required
            error={Boolean(errors?.model)}
            helperText={errors?.model}
            SelectProps={{
              SelectDisplayProps: {
                'data-testid': 'request-model-select',
              } as React.HTMLAttributes<HTMLDivElement>,
            }}
          >
            <MenuItem value="gpt-4o">gpt-4o</MenuItem>
            <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
            <MenuItem value="claude-3-5">claude-3-5</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Model snapshot"
            value={request.modelSnapshot ?? ''}
            onChange={(event) => onRequestChange('modelSnapshot', event.target.value)}
            placeholder="2025-02-01"
            fullWidth
            error={Boolean(errors?.modelSnapshot)}
            helperText={errors?.modelSnapshot}
            inputProps={{ ['data-testid']: 'request-model-snapshot-input' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="API endpoint"
            value={request.url ?? ''}
            onChange={(event) => onRequestChange('url', event.target.value)}
            fullWidth
            error={Boolean(errors?.url)}
            helperText={errors?.url}
            inputProps={{ ['data-testid']: 'request-url-input' }}
          />
        </Grid>
      </Grid>
      <Box display="flex" justifyContent="flex-start">
        <Button
          id={advancedParametersToggleId}
          size="small"
          onClick={onToggleAdvancedParameters}
          aria-expanded={showAdvancedParameters}
          aria-controls={advancedParametersRegionId}
          endIcon={
            <ExpandMore
              sx={{ transform: showAdvancedParameters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
            />
          }
        >
          {showAdvancedParameters ? 'Hide advanced parameters' : 'Show advanced parameters'}
        </Button>
      </Box>
      <Collapse
        id={advancedParametersRegionId}
        role="region"
        aria-labelledby={advancedParametersToggleId}
        in={showAdvancedParameters}
        unmountOnExit
        onEntered={() => temperatureInputRef.current?.focus()}
      >
        <Divider sx={{ my: 1.5 }} />
        <Grid container spacing={2}>
          <Grid item xs={6} md={4}>
            <TextField
              label="Temperature"
              type="number"
              value={request.parameters.temperature ?? ''}
              onChange={handleNumericParameterChange('temperature')}
              inputRef={temperatureInputRef}
              fullWidth
              error={Boolean(errors?.parameters?.temperature)}
              helperText={errors?.parameters?.temperature}
              inputProps={{ step: 0.1, min: 0, max: 2, ['data-testid']: 'request-temperature-input' }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              label="Top P"
              type="number"
              value={request.parameters.topP ?? ''}
              onChange={handleNumericParameterChange('topP')}
              fullWidth
              error={Boolean(errors?.parameters?.topP)}
              helperText={errors?.parameters?.topP}
              inputProps={{ step: 0.05, min: 0, max: 1, ['data-testid']: 'request-top-p-input' }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              label="Max tokens"
              type="number"
              value={request.parameters.maxTokens ?? ''}
              onChange={handleNumericParameterChange('maxTokens')}
              fullWidth
              error={Boolean(errors?.parameters?.maxTokens)}
              helperText={errors?.parameters?.maxTokens}
              inputProps={{ step: 1, min: 1, ['data-testid']: 'request-max-tokens-input' }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              label="Frequency penalty"
              type="number"
              value={request.parameters.frequencyPenalty ?? ''}
              onChange={handleNumericParameterChange('frequencyPenalty')}
              fullWidth
              error={Boolean(errors?.parameters?.frequencyPenalty)}
              helperText={errors?.parameters?.frequencyPenalty}
              inputProps={{ step: 0.1, min: -2, max: 2, ['data-testid']: 'request-frequency-penalty-input' }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              label="Presence penalty"
              type="number"
              value={request.parameters.presencePenalty ?? ''}
              onChange={handleNumericParameterChange('presencePenalty')}
              fullWidth
              error={Boolean(errors?.parameters?.presencePenalty)}
              helperText={errors?.parameters?.presencePenalty}
              inputProps={{ step: 0.1, min: -2, max: 2, ['data-testid']: 'request-presence-penalty-input' }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              select
              label="Stream responses"
              value={String(Boolean(request.parameters.stream))}
              onChange={(event) => onStreamChange(event.target.value === 'true')}
              fullWidth
              SelectProps={{
                SelectDisplayProps: {
                  'data-testid': 'request-stream-select',
                } as React.HTMLAttributes<HTMLDivElement>,
              }}
            >
              <MenuItem value="false">false</MenuItem>
              <MenuItem value="true">true</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Collapse>
    </SectionCard>
  );
};

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
}) => {
  const placeholderListRegionId = 'placeholder-list-region';
  const placeholderListToggleId = 'placeholder-list-toggle';
  const firstPlaceholderNameInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <SectionCard title="Placeholders" subtitle="Template variables injected before execution">
      {errors?.general ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      ) : null}
      <Grid container spacing={2}>
        <Grid item xs={6} md={4}>
          <TextField
            label="Start pattern"
            value={placeholders.startPattern ?? ''}
            onChange={(event) => onPlaceholderPatternChange('startPattern', event.target.value)}
            fullWidth
            error={Boolean(errors?.startPattern)}
            helperText={errors?.startPattern}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <TextField
            label="End pattern"
            value={placeholders.endPattern ?? ''}
            onChange={(event) => onPlaceholderPatternChange('endPattern', event.target.value)}
            fullWidth
            error={Boolean(errors?.endPattern)}
            helperText={errors?.endPattern}
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
        <Button size="small" onClick={onAddPlaceholder} startIcon={<AddCircleOutline />}>
          Add placeholder
        </Button>
        <Button
          id={placeholderListToggleId}
          size="small"
          onClick={onTogglePlaceholders}
          aria-expanded={showPlaceholders}
          aria-controls={placeholderListRegionId}
          endIcon={
            <ExpandMore sx={{ transform: showPlaceholders ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          }
        >
          {showPlaceholders ? 'Hide placeholder list' : 'Show placeholder list'}
        </Button>
      </Stack>
      <Collapse
        id={placeholderListRegionId}
        role="region"
        aria-labelledby={placeholderListToggleId}
        in={showPlaceholders}
        unmountOnExit
        onEntered={() => firstPlaceholderNameInputRef.current?.focus()}
      >
        <Stack spacing={2}>
          {placeholders.list.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No placeholders defined yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {placeholders.list.map((placeholder, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: 'divider' }}>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={5}>
                      <TextField
                        label="Name"
                        value={placeholder.name}
                        onChange={(event) => onPlaceholderChange(index, 'name', event.target.value)}
                        inputRef={index === 0 ? firstPlaceholderNameInputRef : undefined}
                        fullWidth
                        error={Boolean(errors?.list?.[index]?.name)}
                        helperText={errors?.list?.[index]?.name}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Default value"
                        value={placeholder.value}
                        onChange={(event) => onPlaceholderChange(index, 'value', event.target.value)}
                        fullWidth
                        error={Boolean(errors?.list?.[index]?.value)}
                        helperText={errors?.list?.[index]?.value}
                      />
                    </Grid>
                    <Grid item xs={1} display="flex" justifyContent="flex-end">
                      <Tooltip title="Remove placeholder">
                        <span>
                          <IconButton size="small" onClick={() => onRemovePlaceholder(index)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Collapse>
    </SectionCard>
  );
};

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
}) => {
  const metadataDetailsRegionId = 'metadata-details-region';
  const metadataDetailsToggleId = 'metadata-details-toggle';
  const metadataDetailsContentRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <SectionCard title="Basic information" subtitle="Describe the prompt and link it to a project">
      {errors?.general ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      ) : null}
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prompt group"
              value={group}
              onChange={(event) => onGroupChange(event.target.value)}
              required
              error={Boolean(errors?.group)}
              helperText={
                errors?.group ? (
                  <span data-testid="prompt-group-error">{errors.group}</span>
                ) : (
                  "Only letters, numbers, '-' and '_' are allowed."
                )
              }
              inputProps={{ inputMode: 'text', ['data-testid']: 'prompt-group-input' }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prompt name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
              error={Boolean(errors?.name)}
              helperText={
                errors?.name ? (
                  <span data-testid="prompt-name-error">{errors.name}</span>
                ) : (
                  "Only letters, numbers, '-' and '_' are allowed."
                )
              }
              inputProps={{ inputMode: 'text', ['data-testid']: 'prompt-name-input' }}
              fullWidth
            />
          </Grid>
        </Grid>
        <TextField
          label="Description"
          value={description ?? ''}
          onChange={(event) => onDescriptionChange(event.target.value)}
          multiline
          minRows={3}
          fullWidth
          inputProps={{ ['data-testid']: 'description-text' }}
          error={Boolean(errors?.description)}
          helperText={errors?.description}
        />
        <Box display="flex" justifyContent="flex-start">
          <Button
            id={metadataDetailsToggleId}
            size="small"
            onClick={onToggleMetadataDetails}
            aria-expanded={showMetadataDetails}
            aria-controls={metadataDetailsRegionId}
            endIcon={
              <ExpandMore
                sx={{ transform: showMetadataDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              />
            }
          >
            {showMetadataDetails ? 'Hide additional metadata' : 'Show additional metadata'}
          </Button>
        </Box>
      </Stack>
      <Collapse
        id={metadataDetailsRegionId}
        role="region"
        aria-labelledby={metadataDetailsToggleId}
        in={showMetadataDetails}
        unmountOnExit
        onEntered={() => metadataDetailsContentRef.current?.focus()}
      >
        <Divider sx={{ my: 2 }} />
        <Stack ref={metadataDetailsContentRef} tabIndex={-1} spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              Repository path
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {promptPath}
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }}>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Version
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {versionLabel ?? '0.1.0-SNAPSHOT'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Managed during release
              </Typography>
            </Stack>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Revision
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {revision ?? 1}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Auto-incremented on save
              </Typography>
            </Stack>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              Authors
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{authorsDisplay}</Typography>
            <Typography variant="caption" color="text.secondary">
              Determined from your Git identity
            </Typography>
          </Stack>
        </Stack>
      </Collapse>
    </SectionCard>
  );
};

export type ToolConfigsCardProps = {
  configs: PromptEditorToolConfig[];
  onAddConfig: () => void;
  onRemoveConfig: (id: string) => void;
  onConfigChange: <K extends keyof PromptEditorToolConfig>(id: string, field: K, value: PromptEditorToolConfig[K]) => void;
  errors?: ToolConfigsErrors;
};

export const ToolConfigsCard: React.FC<ToolConfigsCardProps> = ({ configs, onAddConfig, onRemoveConfig, onConfigChange, errors }) => (
  <SectionCard title="MCP Tools" subtitle="Define mockable tools available to this prompt">
    {errors?.general ? (
      <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
        {errors.general}
      </Alert>
    ) : null}
    <Stack spacing={2}>
      {configs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No tools configured yet. Add at least one tool to describe its mock behavior for MCP replay.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {configs.map((config, index) => {
            const configErrors = errors?.configs?.[index];
            return (
              <Paper key={config.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: 'divider' }}>
                <Grid container spacing={1.5} alignItems="flex-start">
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Tool name"
                      value={config.name}
                      onChange={(event) => onConfigChange(config.id, 'name', event.target.value)}
                      placeholder="inventory.search"
                      fullWidth
                      required
                      error={Boolean(configErrors?.name)}
                      helperText={configErrors?.name}
                      inputProps={{ ['data-testid']: `tool-name-input-${index}` }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Tool description"
                      value={config.notes}
                      onChange={(event) => onConfigChange(config.id, 'notes', event.target.value)}
                      placeholder="Search documentation for relevant answers."
                      helperText={configErrors?.notes}
                      error={Boolean(configErrors?.notes)}
                      fullWidth
                      inputProps={{ ['data-testid']: `tool-description-input-${index}` }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Scenario label"
                      value={config.scenario}
                      onChange={(event) => onConfigChange(config.id, 'scenario', event.target.value)}
                      placeholder="default"
                      fullWidth
                      error={Boolean(configErrors?.scenario)}
                      helperText={configErrors?.scenario ?? 'Matches fixture behavior key'}
                    />
                  </Grid>
                  <Grid item xs={12} md={1} display="flex" justifyContent="flex-end" alignItems="center">
                    <Tooltip title="Remove tool configuration">
                      <span>
                        <IconButton size="small" onClick={() => onRemoveConfig(config.id)}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Mock response preview"
                      value={config.mockResponse}
                      onChange={(event) => onConfigChange(config.id, 'mockResponse', event.target.value)}
                      placeholder={'{ "count": 3, "items": [...] }'}
                      multiline
                      minRows={3}
                      fullWidth
                      error={Boolean(configErrors?.mockResponse)}
                      helperText={configErrors?.mockResponse}
                    />
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}
      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          size="small"
          onClick={onAddConfig}
          startIcon={<AddCircleOutline />}
          data-testid="add-tool-button"
        >
          Add tool configuration
        </Button>
      </Stack>
    </Stack>
  </SectionCard>
);

export type EvaluationPlanCardProps = {
  enabled: boolean;
  evaluations: PromptEditorEvaluationPlan[];
  onToggleEnabled: (checked: boolean) => void;
  onEvaluationChange: (index: number, field: keyof PromptEditorEvaluationPlan, value: string) => void;
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
    action={<FormControlLabel control={<Switch checked={enabled} onChange={(event) => onToggleEnabled(event.target.checked)} />} label="Enable" />}
  >
    {errors?.general ? (
      <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
        {errors.general}
      </Alert>
    ) : null}
    <Stack spacing={2}>
      {enabled && evaluations.length ? (
        evaluations.map((evaluation, index) => {
          const evaluationErrors = errors?.evaluations?.[index];
          return (
            <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: 'divider' }}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Evaluator"
                    value={evaluation.evaluator}
                    onChange={(event) => onEvaluationChange(index, 'evaluator', event.target.value)}
                    fullWidth
                    error={Boolean(evaluationErrors?.evaluator)}
                    helperText={evaluationErrors?.evaluator}
                    inputProps={{ ['data-testid']: `evaluation-evaluator-input-${index}` }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Type"
                    value={evaluation.type}
                    onChange={(event) => onEvaluationChange(index, 'type', event.target.value)}
                    fullWidth
                    error={Boolean(evaluationErrors?.type)}
                    helperText={evaluationErrors?.type}
                    inputProps={{ ['data-testid']: `evaluation-type-input-${index}` }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Description"
                    value={evaluation.description ?? ''}
                    onChange={(event) => onEvaluationChange(index, 'description', event.target.value)}
                    fullWidth
                    error={Boolean(evaluationErrors?.description)}
                    helperText={evaluationErrors?.description}
                    inputProps={{ ['data-testid']: `evaluation-description-input-${index}` }}
                  />
                </Grid>
                <Grid item xs={12} sm={1} display="flex" justifyContent="flex-end">
                  <Tooltip title="Remove evaluator">
                    <span>
                      <IconButton size="small" onClick={() => onRemoveEvaluation(index)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>
          );
        })
      ) : (
        <Typography variant="body2" color="text.secondary">
          {enabled ? 'No evaluators defined yet. Add one to start tracking quality gates.' : 'Evaluations are disabled. Toggle the switch to add quality checks.'}
        </Typography>
      )}
      <Button
        variant="outlined"
        size="small"
        onClick={onAddEvaluation}
        startIcon={<AddCircleOutline />}
        data-testid="add-evaluation-button"
      >
        Add evaluator
      </Button>
    </Stack>
  </SectionCard>
);

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

export type MessageContentSelection = {
  messageIndex: number;
  selectionStart: number;
  selectionEnd: number;
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
      if (!onContentSelectionChange) {
        return;
      }
      const selectionStart = target.selectionStart ?? 0;
      const selectionEnd = target.selectionEnd ?? selectionStart;
      onContentSelectionChange({
        messageIndex,
        selectionStart,
        selectionEnd,
      });
    },
    [onContentSelectionChange],
  );

  return (
    <SectionCard title="Prompt messages" subtitle="Ordered chat conversation fed to the model">
      {errors?.general ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      ) : null}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {availableRoles.map((role) => (
          <Button
            key={role}
            variant="outlined"
            size="small"
            onClick={() => onAddMessage(role)}
            data-testid={role === 'user' ? 'user-prompt-button' : undefined}
          >
            Add {MESSAGE_ROLE_LABEL[role]}
          </Button>
        ))}
      </Stack>
      <Stack spacing={2} sx={{ mt: 1 }} data-testid="prompt-messages">
        {messages.map((message, index) => {
          const messageErrors = errors?.list?.[index];
          return (
            <Paper key={message.id} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" color={MESSAGE_ROLE_COLORS[message.role]} label={MESSAGE_ROLE_LABEL[message.role]} />
                    <FormControl sx={{ minWidth: 160 }} size="small" error={Boolean(messageErrors?.role)}>
                      <Select value={message.role} onChange={(event) => onMessageChange(index, 'role', event.target.value)}>
                        {DEFAULT_MESSAGE_ROLES.map((role) => (
                          <MenuItem key={role} value={role}>
                            {MESSAGE_ROLE_LABEL[role]}
                          </MenuItem>
                        ))}
                      </Select>
                      {messageErrors?.role ? <FormHelperText>{messageErrors.role}</FormHelperText> : null}
                    </FormControl>
                  </Stack>
                  <Tooltip title="Remove message">
                    <span>
                      <IconButton size="small" onClick={() => onRemoveMessage(index)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
                {message.role === 'tool' ? (
                  <TextField
                    label="Tool name"
                    size="small"
                    value={message.name ?? ''}
                    onChange={(event) => onMessageChange(index, 'name', event.target.value)}
                    fullWidth
                    error={Boolean(messageErrors?.name)}
                    helperText={messageErrors?.name}
                  />
                ) : null}
                <Stack spacing={0.75}>
                  <Typography variant="caption" color={messageErrors?.content ? 'error' : 'text.secondary'}>
                    Content
                  </Typography>
                  <Box
                    component="textarea"
                    value={message.content}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                      onMessageChange(index, 'content', event.target.value);
                      emitSelection(index, event.currentTarget);
                    }}
                    onFocus={(event: React.FocusEvent<HTMLTextAreaElement>) => emitSelection(index, event.currentTarget)}
                    onClick={(event: React.MouseEvent<HTMLTextAreaElement>) => emitSelection(index, event.currentTarget)}
                    onSelect={(event: React.SyntheticEvent<HTMLTextAreaElement>) => emitSelection(index, event.currentTarget)}
                    onKeyUp={(event: React.KeyboardEvent<HTMLTextAreaElement>) => emitSelection(index, event.currentTarget)}
                    onBlur={() => onContentSelectionChange?.(null)}
                    rows={message.role === 'system' ? 3 : 2}
                    data-testid={message.role === 'user' && index === messages.length - 1 ? 'prompt-text' : undefined}
                    aria-label={`Message content ${index + 1}`}
                    sx={{
                      width: '100%',
                      resize: 'vertical',
                      borderRadius: 1,
                      border: 1,
                      borderColor: messageErrors?.content ? 'error.main' : 'divider',
                      px: 1.75,
                      py: 1.25,
                      font: 'inherit',
                      color: 'text.primary',
                      backgroundColor: 'background.paper',
                      '&:focus': {
                        outline: 'none',
                        borderColor: messageErrors?.content ? 'error.main' : 'primary.main',
                        boxShadow: (theme) =>
                          `0 0 0 2px ${messageErrors?.content ? theme.palette.error.light : theme.palette.primary.light}`,
                      },
                    }}
                  />
                  {messageErrors?.content ? <FormHelperText error>{messageErrors.content}</FormHelperText> : null}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mt: 2 }}
      >
        <Button variant="text" onClick={onNavigateBack} disabled={isBusy}>
          Back to Prompts
        </Button>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="outlined" onClick={onTryRun} disabled={isBusy}>
            Run
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !hasActiveProject || isActiveProjectLoading}
            data-testid="save-prompt-button"
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
};

export type PromptPreviewCardProps = {
  draftSummary: string;
  execution?: PromptEditorExecution;
};

export const PromptPreviewCard: React.FC<PromptPreviewCardProps> = ({ draftSummary, execution }) => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <SectionCard title="Prompt summary" subtitle="Current draft state">
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {draftSummary}
      </Typography>
    </SectionCard>
    {execution ? (
      <SectionCard title="Most recent response" subtitle={`Executed ${new Date(execution.timestamp).toLocaleString()}`}>
        <Typography variant="body2" color="text.secondary">
          Full output is shown in the response panel below.
        </Typography>
      </SectionCard>
    ) : null}
  </Stack>
);

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

export type LastExecutionCardProps = {
  lastExecution: PromptEditorExecution;
  executions: PromptEditorExecution[];
  onSelectExecution: (id: string) => void;
};

export const LastExecutionCard: React.FC<LastExecutionCardProps> = ({ lastExecution, executions, onSelectExecution }) => (
  <SectionCard
    title="Last execution"
    subtitle={`Run at ${new Date(lastExecution.timestamp).toLocaleString()}`}
    action={
      <Stack direction="row" spacing={1} alignItems="center">
        {executions.length > 1 ? (
          <Stack direction="row" spacing={0.5}>
            {executions.slice(0, 5).map((execution) => {
              const isActive = execution.id === lastExecution.id;
              return (
                <Button
                  key={execution.id}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  onClick={() => onSelectExecution(execution.id)}
                >
                  {new Date(execution.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Button>
              );
            })}
          </Stack>
        ) : null}
        <Chip
          label={`${lastExecution.response?.usage?.outputTokens ?? 0} output tokens`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Stack>
    }
  >
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Response preview:
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {lastExecution.response?.content ?? 'No response content captured.'}
        </Typography>
      </Paper>
      {lastExecution.placeholders.length ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {lastExecution.placeholders.map((placeholder) => (
            <Chip key={placeholder.name} label={`${placeholder.name}: ${placeholder.defaultValue ?? ''}`} size="small" variant="outlined" />
          ))}
        </Stack>
      ) : null}
    </Stack>
  </SectionCard>
);

export type EvaluationResultsCardProps = {
  results: PromptEditorEvaluationResult[];
};

export const EvaluationResultsCard: React.FC<EvaluationResultsCardProps> = ({ results }) => (
  <SectionCard title="Evaluation results" subtitle="Quality gates from recent runs">
    <Stack spacing={2}>
      {results.map((evaluation, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: 'divider' }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.primary">
                {evaluation.evaluator || 'Unnamed evaluator'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {evaluation.type}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={2}>
              {evaluation.success !== undefined ? (
                <Chip size="small" label={evaluation.success ? 'Pass' : 'Fail'} color={evaluation.success ? 'success' : 'error'} />
              ) : null}
            </Grid>
            <Grid item xs={6} sm={2}>
              {evaluation.score !== undefined ? <Chip size="small" label={`Score ${evaluation.score}`} variant="outlined" /> : null}
            </Grid>
            <Grid item xs={12} sm={4}>
              {evaluation.reasoning ? (
                <Typography variant="body2" color="text.secondary">
                  {evaluation.reasoning}
                </Typography>
              ) : null}
            </Grid>
          </Grid>
          {evaluation.comments ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {evaluation.comments}
            </Typography>
          ) : null}
        </Paper>
      ))}
    </Stack>
  </SectionCard>
);
