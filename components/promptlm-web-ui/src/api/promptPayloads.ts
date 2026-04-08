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
  ExecutePromptRequest,
  Message,
  Placeholder,
  Placeholders,
  PromptSpec,
  PromptSpecCreationRequest,
  PromptSpecRequest,
  PromptSpecRequestParameters,
} from '@promptlm/api-client';

export type EditablePromptMessageRole = 'system' | 'developer' | 'assistant' | 'user' | 'tool';

export type EditablePromptMessage = {
  id?: string;
  role: EditablePromptMessageRole;
  content: string;
  name?: string;
};

export type EditablePromptPlaceholder = {
  name: string;
  value?: string;
};

export type EditablePromptEvaluationDefinition = {
  evaluator: string;
  type: string;
  description?: string;
};

export type PromptDraftInput = {
  id?: string;
  name: string;
  group: string;
  description?: string;
  authors?: string[];
  purpose?: string;
  repositoryUrl?: string;
  version?: string;
  revision?: number;
  placeholders: {
    startPattern?: string;
    endPattern?: string;
    list: EditablePromptPlaceholder[];
    defaults?: Record<string, string>;
  };
  request: {
    type?: string;
    vendor: string;
    model: string;
    url?: string;
    modelSnapshot?: string;
    parameters?: PromptSpecRequestParameters;
    messages: EditablePromptMessage[];
  };
  evaluations?: EditablePromptEvaluationDefinition[];
  extensions?: Record<string, unknown>;
};

const DEFAULT_PLACEHOLDER_START_PATTERN = '{{';
const DEFAULT_PLACEHOLDER_END_PATTERN = '}}';

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const normalizeRequiredString = (value: string | null | undefined, fallback = ''): string => {
  return normalizeOptionalString(value) ?? fallback;
};

const normalizeMessageRole = (role: string | undefined): Message['role'] => {
  const normalizedRole = role?.trim().toUpperCase();
  if (
    normalizedRole === 'SYSTEM' ||
    normalizedRole === 'DEVELOPER' ||
    normalizedRole === 'ASSISTANT' ||
    normalizedRole === 'USER' ||
    normalizedRole === 'TOOL'
  ) {
    return normalizedRole;
  }
  return 'USER';
};

const toEditableMessageRole = (role: Message['role']): EditablePromptMessageRole => {
  const normalizedRole = role?.trim().toLowerCase();
  if (
    normalizedRole === 'system' ||
    normalizedRole === 'developer' ||
    normalizedRole === 'assistant' ||
    normalizedRole === 'user' ||
    normalizedRole === 'tool'
  ) {
    return normalizedRole;
  }
  return 'user';
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeParameters = (parameters?: PromptSpecRequestParameters): PromptSpecRequestParameters => {
  return {
    temperature: isFiniteNumber(parameters?.temperature) ? parameters.temperature : undefined,
    topP: isFiniteNumber(parameters?.topP) ? parameters.topP : undefined,
    maxTokens: isFiniteNumber(parameters?.maxTokens) ? Math.trunc(parameters.maxTokens) : undefined,
    frequencyPenalty: isFiniteNumber(parameters?.frequencyPenalty) ? parameters.frequencyPenalty : undefined,
    presencePenalty: isFiniteNumber(parameters?.presencePenalty) ? parameters.presencePenalty : undefined,
    stream: typeof parameters?.stream === 'boolean' ? parameters.stream : undefined,
  };
};

const normalizeMessages = (messages: EditablePromptMessage[]): Message[] => {
  return messages.map((message) => ({
    role: normalizeMessageRole(message.role),
    content: message.content,
    name: normalizeOptionalString(message.name),
  }));
};

const normalizePlaceholders = (input: PromptDraftInput['placeholders']): Placeholders => {
  const startPattern = normalizeOptionalString(input.startPattern) ?? DEFAULT_PLACEHOLDER_START_PATTERN;
  const endPattern = normalizeOptionalString(input.endPattern) ?? DEFAULT_PLACEHOLDER_END_PATTERN;

  const defaults = new Map<string, string>();
  for (const [rawName, value] of Object.entries(input.defaults ?? {})) {
    const name = normalizeOptionalString(rawName);
    if (!name) {
      continue;
    }
    defaults.set(name, value ?? '');
  }

  const list = new Map<string, Placeholder>();
  for (const placeholder of input.list) {
    const name = normalizeOptionalString(placeholder.name);
    if (!name) {
      continue;
    }
    const defaultValue = placeholder.value ?? defaults.get(name) ?? '';
    list.set(name, {
      name,
      defaultValue,
    });
  }

  return {
    startPattern,
    endPattern,
    list: Array.from(list.values()),
    defaults: Object.fromEntries(Array.from(list.values()).map((placeholder) => [placeholder.name ?? '', placeholder.defaultValue ?? ''])),
  };
};

const normalizeEvaluationDefinitions = (
  evaluations: EditablePromptEvaluationDefinition[] | undefined,
): EditablePromptEvaluationDefinition[] => {
  const normalized: EditablePromptEvaluationDefinition[] = [];
  for (const evaluation of evaluations ?? []) {
    const evaluator = normalizeOptionalString(evaluation.evaluator);
    const type = normalizeOptionalString(evaluation.type);

    if (!evaluator || !type) {
      continue;
    }

    normalized.push({
      evaluator,
      type,
      description: normalizeOptionalString(evaluation.description),
    });
  }

  return normalized;
};

const normalizeExtensions = (input: PromptDraftInput): Record<string, unknown> | undefined => {
  const base = input.extensions ? { ...input.extensions } : {};
  const evaluations = normalizeEvaluationDefinitions(input.evaluations);
  const rawEvaluation = base['x-evaluation'];
  const evaluation =
    rawEvaluation && typeof rawEvaluation === 'object' && rawEvaluation !== null
      ? { ...(rawEvaluation as Record<string, unknown>) }
      : {};

  if (evaluations.length > 0) {
    evaluation.spec = { evaluations };
  } else {
    delete evaluation.spec;
  }

  if (Object.keys(evaluation).length > 0) {
    base['x-evaluation'] = evaluation;
  } else {
    delete base['x-evaluation'];
  }

  return Object.keys(base).length > 0 ? base : undefined;
};

const buildPromptSpecRequest = (request: PromptDraftInput['request']): PromptSpecRequest => {
  return {
    type: normalizeRequiredString(request.type, 'chat/completion'),
    vendor: normalizeRequiredString(request.vendor),
    model: normalizeRequiredString(request.model),
    url: normalizeOptionalString(request.url),
    model_snapshot: normalizeOptionalString(request.modelSnapshot),
    parameters: normalizeParameters(request.parameters),
    messages: normalizeMessages(request.messages),
  };
};

const extractUserMessage = (messages: Message[]): string | undefined => {
  return messages.find((message) => message.role === 'USER')?.content;
};

const toPlaceholderDefaults = (placeholders: Placeholders): Record<string, string> => {
  if (placeholders.defaults) {
    return placeholders.defaults;
  }
  return Object.fromEntries((placeholders.list ?? []).flatMap((placeholder) => {
    if (!placeholder.name) {
      return [];
    }
    return [[placeholder.name, placeholder.defaultValue ?? '']];
  }));
};

const readPromptMessages = (prompt: PromptSpec): EditablePromptMessage[] => {
  const request = prompt.request as PromptSpecRequest | undefined;
  return (request?.messages ?? []).map((message, index) => ({
    id: `msg-${index}`,
    role: toEditableMessageRole(message.role),
    content: message.content ?? '',
    name: message.name ?? undefined,
  }));
};

export const buildPromptDraftInputFromPrompt = (
  prompt: PromptSpec,
  overrides?: {
    systemMessage?: string;
    userMessage?: string;
  },
): PromptDraftInput => {
  const request = prompt.request as PromptSpecRequest | undefined;
  const existingMessages = readPromptMessages(prompt);
  const preservedMessages = existingMessages.filter((message) => message.role !== 'system' && message.role !== 'user');
  const systemMessage =
    overrides?.systemMessage ??
    existingMessages.find((message) => message.role === 'system')?.content ??
    '';
  const userMessage =
    overrides?.userMessage ??
    existingMessages.find((message) => message.role === 'user')?.content ??
    '';

  return {
    id: prompt.id,
    name: prompt.name ?? '',
    group: prompt.group ?? '',
    description: prompt.description,
    authors: prompt.authors ?? [],
    purpose: prompt.purpose,
    repositoryUrl: prompt.repositoryUrl,
    version: prompt.version,
    revision: prompt.revision,
    placeholders: {
      startPattern: prompt.placeholders?.startPattern,
      endPattern: prompt.placeholders?.endPattern,
      list: (prompt.placeholders?.list ?? []).map((placeholder) => ({
        name: placeholder.name ?? '',
        value: placeholder.defaultValue ?? '',
      })),
      defaults: prompt.placeholders?.defaults,
    },
    request: {
      type: request?.type ?? 'chat/completion',
      vendor: request?.vendor ?? '',
      model: request?.model ?? '',
      url: request?.url,
      modelSnapshot: request?.model_snapshot,
      parameters: request?.parameters,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
        ...preservedMessages,
      ],
    },
    extensions: prompt.extensions as Record<string, unknown> | undefined,
  };
};

export const buildPromptSpecCreationRequest = (input: PromptDraftInput): PromptSpecCreationRequest => {
  const request = buildPromptSpecRequest(input.request);
  const placeholders = normalizePlaceholders(input.placeholders);

  return {
    id: normalizeOptionalString(input.id),
    name: normalizeRequiredString(input.name),
    group: normalizeRequiredString(input.group),
    description: normalizeOptionalString(input.description),
    placeholder: toPlaceholderDefaults(placeholders),
    placeholderStartPattern: placeholders.startPattern,
    placeholderEndPattern: placeholders.endPattern,
    userMessage: extractUserMessage(request.messages ?? []),
    type: request.type,
    request,
    vendorAndModel: {
      vendorName: request.vendor,
      model: request.model,
      endpoint: request.url,
    },
    messages: request.messages,
    version: normalizeOptionalString(input.version),
    repositoryUrl: normalizeOptionalString(input.repositoryUrl),
    extensions: normalizeExtensions(input),
  };
};

export const buildExecutePromptRequest = (input: PromptDraftInput): ExecutePromptRequest => {
  const request = buildPromptSpecRequest(input.request);
  const placeholders = normalizePlaceholders(input.placeholders);

  return {
    promptSpec: {
      id: normalizeOptionalString(input.id),
      name: normalizeRequiredString(input.name),
      group: normalizeRequiredString(input.group),
      description: normalizeOptionalString(input.description),
      authors: input.authors ?? [],
      purpose: normalizeOptionalString(input.purpose),
      repositoryUrl: normalizeOptionalString(input.repositoryUrl),
      version: normalizeOptionalString(input.version),
      revision: input.revision,
      request: request as PromptSpec['request'],
      placeholders,
      extensions: normalizeExtensions(input) as PromptSpec['extensions'],
    },
  };
};
