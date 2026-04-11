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

import { useCallback, useMemo, useReducer } from 'react';

import type { PromptSpec } from '@promptlm/api-client';
import { DEFAULT_MESSAGE_ROLES } from '@promptlm/ui';

import {
  buildPromptDraftInputFromPrompt,
  type EditablePromptEvaluationDefinition,
  type EditablePromptMessage,
  type EditablePromptMessageRole,
  type PromptDraftInput,
} from '@/api/promptPayloads';

import type {
  PromptEditorEvaluationField,
  PromptEditorMessageField,
  PromptEditorMetadataField,
  PromptEditorParameterField,
  PromptEditorPlaceholderField,
  PromptEditorRequestField,
  PromptEditorState,
} from './types';

const DEFAULT_PLACEHOLDER_START_PATTERN = '{{';
const DEFAULT_PLACEHOLDER_END_PATTERN = '}}';

const createMessageId = () => `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const createEvaluationId = () => `eval-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const readEvaluationDefinitions = (prompt: PromptSpec): EditablePromptEvaluationDefinition[] => {
  const rawEvaluation = prompt.extensions?.['x-evaluation'];
  if (!rawEvaluation || typeof rawEvaluation !== 'object') {
    return [];
  }

  const spec = (rawEvaluation as { spec?: { evaluations?: EditablePromptEvaluationDefinition[] } }).spec;
  return Array.isArray(spec?.evaluations)
    ? spec.evaluations.map((evaluation) => ({
        evaluator: evaluation.evaluator ?? '',
        type: evaluation.type ?? '',
        description: evaluation.description ?? '',
      }))
    : [];
};

export const createEmptyPromptDraft = (): PromptEditorState => ({
  draft: {
    name: '',
    group: '',
    description: '',
    placeholders: {
      startPattern: DEFAULT_PLACEHOLDER_START_PATTERN,
      endPattern: DEFAULT_PLACEHOLDER_END_PATTERN,
      list: [],
      defaults: {},
    },
    request: {
      type: 'chat/completion',
      vendor: '',
      model: '',
      url: '',
      modelSnapshot: '',
      parameters: {
        temperature: undefined,
        topP: undefined,
        maxTokens: undefined,
        frequencyPenalty: undefined,
        presencePenalty: undefined,
        stream: false,
      },
      messages: [
        { id: createMessageId(), role: 'system', content: '' },
        { id: createMessageId(), role: 'user', content: '' },
      ],
    },
    evaluations: [],
  },
  evaluationEnabled: false,
});

export const createPromptDraftFromPrompt = (prompt: PromptSpec): PromptEditorState => {
  const baseDraft = buildPromptDraftInputFromPrompt(prompt);
  const evaluations = readEvaluationDefinitions(prompt);

  return {
    draft: {
      ...baseDraft,
      request: {
        ...baseDraft.request,
        messages: baseDraft.request.messages.map((message) => ({
          ...message,
          id: message.id ?? createMessageId(),
        })),
      },
      evaluations,
    },
    evaluationEnabled: evaluations.length > 0,
  };
};

const SLUG_ALLOWED_PATTERN = /[^A-Za-z0-9_-]/g;

const sanitizeSlug = (value: string) => value.replace(SLUG_ALLOWED_PATTERN, '');

const normalizeMessages = (messages: EditablePromptMessage[]): EditablePromptMessage[] => {
  const rest: EditablePromptMessage[] = [];
  let systemMessage: EditablePromptMessage | undefined;

  messages.forEach((message) => {
    if (message.role === 'system') {
      if (!systemMessage) {
        systemMessage = { ...message };
      } else {
        rest.push({ ...message, role: 'assistant' });
      }
      return;
    }
    rest.push({ ...message });
  });

  return systemMessage ? [systemMessage, ...rest] : rest;
};

export const sanitizePromptDraft = (
  draft: PromptDraftInput,
  evaluationEnabled: boolean,
  repositoryUrl?: string | null,
): PromptDraftInput => {
  const name = sanitizeSlug(draft.name.trim());
  const group = sanitizeSlug(draft.group.trim());
  const placeholders = draft.placeholders.list
    .map((placeholder) => ({
      name: placeholder.name.trim(),
      value: placeholder.value?.trim() ?? '',
    }))
    .filter((placeholder) => placeholder.name.length > 0 || placeholder.value.length > 0);
  const defaults = Object.fromEntries(
    placeholders
      .filter((placeholder) => placeholder.name.length > 0)
      .map((placeholder) => [placeholder.name, placeholder.value ?? '']),
  );
  const messages = normalizeMessages(
    draft.request.messages.map((message) => ({
      ...message,
      name: message.name?.trim() || undefined,
    })),
  );
  const evaluations = evaluationEnabled
    ? (draft.evaluations ?? [])
        .map((evaluation) => ({
          evaluator: evaluation.evaluator.trim(),
          type: evaluation.type.trim(),
          description: evaluation.description?.trim() || undefined,
        }))
        .filter((evaluation) => evaluation.evaluator.length > 0 || evaluation.type.length > 0 || Boolean(evaluation.description))
    : [];

  return {
    ...draft,
    name,
    group,
    description: draft.description?.trim() || undefined,
    repositoryUrl: draft.repositoryUrl?.trim() || repositoryUrl || undefined,
    placeholders: {
      startPattern: draft.placeholders.startPattern?.trim() || DEFAULT_PLACEHOLDER_START_PATTERN,
      endPattern: draft.placeholders.endPattern?.trim() || DEFAULT_PLACEHOLDER_END_PATTERN,
      list: placeholders,
      defaults,
    },
    request: {
      ...draft.request,
      type: draft.request.type?.trim() || 'chat/completion',
      vendor: draft.request.vendor.trim(),
      model: draft.request.model.trim(),
      url: draft.request.url?.trim() || undefined,
      modelSnapshot: draft.request.modelSnapshot?.trim() || undefined,
      messages,
    },
    evaluations,
  };
};

type PromptEditorAction =
  | { type: 'replace'; state: PromptEditorState }
  | { type: 'update-metadata'; field: PromptEditorMetadataField; value: PromptDraftInput[PromptEditorMetadataField] }
  | { type: 'update-request'; field: PromptEditorRequestField; value: PromptDraftInput['request'][PromptEditorRequestField] }
  | { type: 'update-parameter'; field: PromptEditorParameterField; value: PromptDraftInput['request']['parameters'][PromptEditorParameterField] }
  | { type: 'toggle-stream'; value: boolean }
  | { type: 'add-message'; role: EditablePromptMessageRole }
  | { type: 'update-message'; index: number; field: PromptEditorMessageField; value: EditablePromptMessage[PromptEditorMessageField] }
  | { type: 'remove-message'; index: number }
  | { type: 'add-placeholder' }
  | { type: 'update-placeholder'; index: number; field: PromptEditorPlaceholderField; value: string }
  | { type: 'remove-placeholder'; index: number }
  | { type: 'update-placeholder-pattern'; field: 'startPattern' | 'endPattern'; value: string }
  | { type: 'set-evaluation-enabled'; value: boolean }
  | { type: 'add-evaluation' }
  | { type: 'update-evaluation'; index: number; field: PromptEditorEvaluationField; value: string }
  | { type: 'remove-evaluation'; index: number }
  | { type: 'set-repository-url'; value: string | undefined };

export const promptEditorReducer = (
  state: PromptEditorState,
  action: PromptEditorAction,
): PromptEditorState => {
  switch (action.type) {
    case 'replace':
      return action.state;
    case 'update-metadata':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.field]: action.value,
        },
      };
    case 'update-request':
      return {
        ...state,
        draft: {
          ...state.draft,
          request: {
            ...state.draft.request,
            [action.field]: action.value,
          },
        },
      };
    case 'update-parameter':
      return {
        ...state,
        draft: {
          ...state.draft,
          request: {
            ...state.draft.request,
            parameters: {
              ...state.draft.request.parameters,
              [action.field]: action.value,
            },
          },
        },
      };
    case 'toggle-stream':
      return {
        ...state,
        draft: {
          ...state.draft,
          request: {
            ...state.draft.request,
            parameters: {
              ...state.draft.request.parameters,
              stream: action.value,
            },
          },
        },
      };
    case 'add-message':
      return {
        ...state,
        draft: {
          ...state.draft,
          request: {
            ...state.draft.request,
            messages: [
              ...state.draft.request.messages,
              { id: createMessageId(), role: action.role, content: '', name: undefined },
            ],
          },
        },
      };
    case 'update-message':
      return {
        ...state,
        draft: {
          ...state.draft,
          request: {
            ...state.draft.request,
            messages: state.draft.request.messages.map((message, index) =>
              index === action.index ? { ...message, [action.field]: action.value } : message,
            ),
          },
        },
      };
    case 'remove-message':
      return {
        ...state,
        draft: {
          ...state.draft,
          request: {
            ...state.draft.request,
            messages: state.draft.request.messages.filter((_, index) => index !== action.index),
          },
        },
      };
    case 'add-placeholder':
      return {
        ...state,
        draft: {
          ...state.draft,
          placeholders: {
            ...state.draft.placeholders,
            list: [...state.draft.placeholders.list, { name: '', value: '' }],
          },
        },
      };
    case 'update-placeholder':
      return {
        ...state,
        draft: {
          ...state.draft,
          placeholders: {
            ...state.draft.placeholders,
            list: state.draft.placeholders.list.map((placeholder, index) =>
              index === action.index ? { ...placeholder, [action.field]: action.value } : placeholder,
            ),
          },
        },
      };
    case 'remove-placeholder':
      return {
        ...state,
        draft: {
          ...state.draft,
          placeholders: {
            ...state.draft.placeholders,
            list: state.draft.placeholders.list.filter((_, index) => index !== action.index),
          },
        },
      };
    case 'update-placeholder-pattern':
      return {
        ...state,
        draft: {
          ...state.draft,
          placeholders: {
            ...state.draft.placeholders,
            [action.field]: action.value,
          },
        },
      };
    case 'set-evaluation-enabled':
      return {
        ...state,
        evaluationEnabled: action.value,
      };
    case 'add-evaluation':
      return {
        ...state,
        evaluationEnabled: true,
        draft: {
          ...state.draft,
          evaluations: [
            ...(state.draft.evaluations ?? []),
            { evaluator: '', type: '', description: '', id: createEvaluationId() } as EditablePromptEvaluationDefinition,
          ],
        },
      };
    case 'update-evaluation':
      return {
        ...state,
        draft: {
          ...state.draft,
          evaluations: (state.draft.evaluations ?? []).map((evaluation, index) =>
            index === action.index ? { ...evaluation, [action.field]: action.value } : evaluation,
          ),
        },
      };
    case 'remove-evaluation':
      return {
        ...state,
        draft: {
          ...state.draft,
          evaluations: (state.draft.evaluations ?? []).filter((_, index) => index !== action.index),
        },
      };
    case 'set-repository-url':
      if (state.draft.repositoryUrl === action.value) {
        return state;
      }
      return {
        ...state,
        draft: {
          ...state.draft,
          repositoryUrl: action.value,
        },
      };
    default:
      return state;
  }
};

export const usePromptEditorDraft = (initialState?: PromptEditorState) => {
  const [state, dispatch] = useReducer(promptEditorReducer, initialState ?? createEmptyPromptDraft());

  const replaceState = useCallback((nextState: PromptEditorState) => {
    dispatch({ type: 'replace', state: nextState });
  }, []);

  return useMemo(
    () => ({
      state,
      availableMessageRoles: DEFAULT_MESSAGE_ROLES,
      replaceState,
      updateMetadata: (field: PromptEditorMetadataField, value: PromptDraftInput[PromptEditorMetadataField]) =>
        dispatch({ type: 'update-metadata', field, value }),
      updateRequestField: (field: PromptEditorRequestField, value: PromptDraftInput['request'][PromptEditorRequestField]) =>
        dispatch({ type: 'update-request', field, value }),
      updateParameter: (
        field: PromptEditorParameterField,
        value: PromptDraftInput['request']['parameters'][PromptEditorParameterField],
      ) => dispatch({ type: 'update-parameter', field, value }),
      toggleStream: (value: boolean) => dispatch({ type: 'toggle-stream', value }),
      addMessage: (role: EditablePromptMessageRole) => dispatch({ type: 'add-message', role }),
      updateMessage: (index: number, field: PromptEditorMessageField, value: EditablePromptMessage[PromptEditorMessageField]) =>
        dispatch({ type: 'update-message', index, field, value }),
      removeMessage: (index: number) => dispatch({ type: 'remove-message', index }),
      addPlaceholder: () => dispatch({ type: 'add-placeholder' }),
      updatePlaceholder: (index: number, field: PromptEditorPlaceholderField, value: string) =>
        dispatch({ type: 'update-placeholder', index, field, value }),
      removePlaceholder: (index: number) => dispatch({ type: 'remove-placeholder', index }),
      updatePlaceholderPattern: (field: 'startPattern' | 'endPattern', value: string) =>
        dispatch({ type: 'update-placeholder-pattern', field, value }),
      setEvaluationEnabled: (value: boolean) => dispatch({ type: 'set-evaluation-enabled', value }),
      addEvaluation: () => dispatch({ type: 'add-evaluation' }),
      updateEvaluation: (index: number, field: PromptEditorEvaluationField, value: string) =>
        dispatch({ type: 'update-evaluation', index, field, value }),
      removeEvaluation: (index: number) => dispatch({ type: 'remove-evaluation', index }),
      setRepositoryUrl: (value: string | undefined) => dispatch({ type: 'set-repository-url', value }),
    }),
    [replaceState, state],
  );
};
