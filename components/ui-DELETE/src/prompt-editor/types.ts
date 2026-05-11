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
 * Type aliases used by the legacy editor draft state and the API payload
 * mapping. The visual editor is now `prompts-v2/form` (`PromptFormPage`),
 * but the webapp's draft reducer (`features/prompt-editor/draftState.ts`)
 * and persistence helpers still pivot through these shapes — keeping them
 * here lets the form shell translate to the new design without forcing a
 * domain rewrite at the same time.
 */

import type { ReactNode } from 'react';

export type PromptEditorMode = 'create' | 'edit';

export type PromptEditorTab = 'editor' | 'preview' | 'test' | 'history';

export type PromptEditorBannerMessage = {
  id?: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  text: string;
  action?: ReactNode;
};

export type PromptEditorTabDefinition = {
  value: PromptEditorTab;
  label: string;
  badge?: string | number;
  disabled?: boolean;
};

export type PromptEditorExecutionOption = {
  id: string;
  label: string;
  helperText?: string;
};

// ── Draft / payload shapes (formerly in PromptEditorSections.tsx) ─────────

export type PromptEditorMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export const DEFAULT_MESSAGE_ROLES: PromptEditorMessageRole[] = [
  'system',
  'user',
  'assistant',
  'tool',
];

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

export type MessageContentSelection = {
  messageIndex: number;
  selectionStart: number;
  selectionEnd: number;
};
