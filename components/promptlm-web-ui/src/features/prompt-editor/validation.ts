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

import type {
  EditablePromptEvaluationDefinition,
  EditablePromptMessage,
  PromptDraftInput,
} from '@/api/promptPayloads';
import type {
  EvaluationPlanErrors,
  MessagesErrors,
  MetadataErrors,
  ModelConfigurationErrors,
  PlaceholdersErrors,
  PromptEditorToolConfig,
  ToolConfigsErrors,
} from '@promptlm/ui';

export type PromptEditorValidationResult = {
  metadata: MetadataErrors;
  modelConfiguration: ModelConfigurationErrors;
  placeholders: PlaceholdersErrors;
  toolConfigs: ToolConfigsErrors;
  evaluationPlan: EvaluationPlanErrors;
  messages: MessagesErrors;
  hasErrors: boolean;
};

const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;
const URL_PATTERN = /^https?:\/\//i;

const hasText = (value: string | null | undefined) => Boolean(value?.trim().length);
const normalizePlaceholderName = (value: string) => value.trim().toLowerCase();

const collectErrors = (value: unknown): boolean => {
  if (value == null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some((item) => collectErrors(item));
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) => collectErrors(item));
  }
  return Boolean(value);
};

const validateMetadata = (draft: PromptDraftInput): MetadataErrors => {
  const errors: MetadataErrors = {};

  if (!hasText(draft.group)) {
    errors.group = 'Select a prompt group.';
  } else if (!SLUG_PATTERN.test(draft.group)) {
    errors.group = "Group may only contain letters, numbers, '-' or '_' characters.";
  }

  if (!hasText(draft.name)) {
    errors.name = 'Enter a prompt name.';
  } else if (!SLUG_PATTERN.test(draft.name)) {
    errors.name = "Name may only contain letters, numbers, '-' or '_' characters.";
  }

  if (!hasText(draft.description ?? '')) {
    errors.description = 'Add a short description so collaborators understand the prompt.';
  }

  return errors;
};

const validateModelConfiguration = (draft: PromptDraftInput): ModelConfigurationErrors => {
  const errors: ModelConfigurationErrors = {};

  if (!hasText(draft.request.vendor)) {
    errors.vendor = 'Select an LLM provider.';
  }
  if (!hasText(draft.request.model)) {
    errors.model = 'Select a deployed model.';
  }
  if (hasText(draft.request.url) && !URL_PATTERN.test(draft.request.url ?? '')) {
    errors.url = 'Provide a valid HTTP(S) endpoint.';
  }

  const parameters = draft.request.parameters ?? {};
  const parameterErrors: NonNullable<ModelConfigurationErrors['parameters']> = {};

  if (parameters.temperature != null && (parameters.temperature < 0 || parameters.temperature > 2)) {
    parameterErrors.temperature = 'Temperature must be between 0 and 2.';
  }
  if (parameters.topP != null && (parameters.topP < 0 || parameters.topP > 1)) {
    parameterErrors.topP = 'Top P must be between 0 and 1.';
  }
  if (parameters.maxTokens != null && parameters.maxTokens <= 0) {
    parameterErrors.maxTokens = 'Max tokens must be greater than 0.';
  }
  if (parameters.frequencyPenalty != null && (parameters.frequencyPenalty < -2 || parameters.frequencyPenalty > 2)) {
    parameterErrors.frequencyPenalty = 'Frequency penalty must be between -2 and 2.';
  }
  if (parameters.presencePenalty != null && (parameters.presencePenalty < -2 || parameters.presencePenalty > 2)) {
    parameterErrors.presencePenalty = 'Presence penalty must be between -2 and 2.';
  }

  if (collectErrors(parameterErrors)) {
    errors.parameters = parameterErrors;
  }

  return errors;
};

const validatePlaceholders = (draft: PromptDraftInput): PlaceholdersErrors => {
  const errors: PlaceholdersErrors = {};
  const hasEntries = draft.placeholders.list.length > 0;
  const placeholderNameCounts = new Map<string, number>();

  draft.placeholders.list.forEach((placeholder) => {
    const normalizedName = normalizePlaceholderName(placeholder.name);
    if (!normalizedName) {
      return;
    }
    placeholderNameCounts.set(normalizedName, (placeholderNameCounts.get(normalizedName) ?? 0) + 1);
  });

  if (hasEntries && !hasText(draft.placeholders.startPattern)) {
    errors.startPattern = 'Start pattern is required when defining placeholders.';
  }
  if (hasEntries && !hasText(draft.placeholders.endPattern)) {
    errors.endPattern = 'End pattern is required when defining placeholders.';
  }

  let hasDuplicatePlaceholderNames = false;
  const listErrors = draft.placeholders.list.map((placeholder) => {
    const placeholderErrors: NonNullable<PlaceholdersErrors['list']>[number] = {};
    if (!hasText(placeholder.name)) {
      placeholderErrors.name = 'Placeholder name is required.';
    } else if ((placeholderNameCounts.get(normalizePlaceholderName(placeholder.name)) ?? 0) > 1) {
      placeholderErrors.name = 'Placeholder names must be unique.';
      hasDuplicatePlaceholderNames = true;
    }
    return placeholderErrors;
  });

  if (listErrors.some((item) => collectErrors(item))) {
    errors.list = listErrors;
  }
  if (hasDuplicatePlaceholderNames) {
    errors.general = 'Placeholder names must be unique.';
  }

  return errors;
};

const validateToolConfigs = (toolConfigs: PromptEditorToolConfig[]): ToolConfigsErrors => {
  const errors: ToolConfigsErrors = {};

  if (!toolConfigs.length) {
    return errors;
  }

  const configErrors = toolConfigs.map((config) => {
    const itemErrors: NonNullable<ToolConfigsErrors['configs']>[number] = {};

    if (!hasText(config.name)) {
      itemErrors.name = 'Tool name is required.';
    }
    if (!hasText(config.scenario)) {
      itemErrors.scenario = 'Scenario label is required.';
    }
    if (!hasText(config.notes)) {
      itemErrors.notes = 'Tool description is required.';
    }
    if (!hasText(config.mockResponse)) {
      itemErrors.mockResponse = 'Mock response preview is required.';
    }

    return itemErrors;
  });

  if (configErrors.some((item) => collectErrors(item))) {
    errors.general = 'Complete required tool configuration fields before saving or running.';
    errors.configs = configErrors;
  }

  return errors;
};

const validateEvaluationPlan = (
  evaluationEnabled: boolean,
  evaluations: EditablePromptEvaluationDefinition[],
): EvaluationPlanErrors => {
  const errors: EvaluationPlanErrors = {};

  if (!evaluationEnabled) {
    return errors;
  }

  if (evaluations.length === 0) {
    errors.general = 'Add at least one evaluator or disable the evaluation plan.';
    return errors;
  }

  const evaluationErrors = evaluations.map((evaluation) => {
    const itemErrors: NonNullable<EvaluationPlanErrors['evaluations']>[number] = {};
    if (!hasText(evaluation.evaluator)) {
      itemErrors.evaluator = 'Evaluator name is required.';
    }
    if (!hasText(evaluation.type)) {
      itemErrors.type = 'Specify the evaluation type.';
    }
    if (!hasText(evaluation.description ?? '')) {
      itemErrors.description = 'Describe what this evaluation checks.';
    }
    return itemErrors;
  });

  if (evaluationErrors.some((item) => collectErrors(item))) {
    errors.evaluations = evaluationErrors;
  }

  return errors;
};

const validateMessages = (messages: EditablePromptMessage[]): MessagesErrors => {
  const errors: MessagesErrors = {};

  if (!messages.some((message) => message.role === 'user' && hasText(message.content))) {
    errors.general = 'Add at least one user message with content.';
  }

  const messageErrors = messages.map((message) => {
    const itemErrors: NonNullable<MessagesErrors['list']>[number] = {};
    if (!hasText(message.content)) {
      itemErrors.content = 'Message content cannot be empty.';
    }
    if (message.role === 'tool' && !hasText(message.name)) {
      itemErrors.name = 'Tool messages must include the tool name.';
    }
    return itemErrors;
  });

  if (messageErrors.some((item) => collectErrors(item))) {
    errors.list = messageErrors;
  }

  return errors;
};

export const validatePromptEditor = (
  draft: PromptDraftInput,
  evaluationEnabled: boolean,
  toolConfigs: PromptEditorToolConfig[] = [],
): PromptEditorValidationResult => {
  const metadata = validateMetadata(draft);
  const modelConfiguration = validateModelConfiguration(draft);
  const placeholders = validatePlaceholders(draft);
  const validatedToolConfigs = validateToolConfigs(toolConfigs);
  const evaluationPlan = validateEvaluationPlan(evaluationEnabled, draft.evaluations ?? []);
  const messages = validateMessages(draft.request.messages);

  return {
    metadata,
    modelConfiguration,
    placeholders,
    toolConfigs: validatedToolConfigs,
    evaluationPlan,
    messages,
    hasErrors:
      collectErrors(metadata) ||
      collectErrors(modelConfiguration) ||
      collectErrors(placeholders) ||
      collectErrors(validatedToolConfigs) ||
      collectErrors(evaluationPlan) ||
      collectErrors(messages),
  };
};
