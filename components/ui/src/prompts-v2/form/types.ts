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
 * Type contract for the v2 prompt form. Mirrors the data shape of the design
 * prototype (`design/handoff/webui/src/prompt-form.jsx`) and the schema
 * bindings documented in `design/handoff/playbook/surfaces/form.html`.
 *
 * Stripped from the form UI but carried in the persistence payload (resolved
 * server-side or by git): `version`, `revision`, `repositoryUrl`,
 * `request.url`. Those are surfaced read-only in the sticky header context
 * strip via `PromptFormContext`.
 */

export type FormMode = 'create' | 'edit';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface FormMessage {
  role: MessageRole;
  content: string;
  /** Required when role === 'tool'. */
  name?: string;
}

export interface FormParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface FormRequest {
  type: 'chat' | 'image' | 'audio';
  vendor: string;
  model: string;
  modelSnapshot: string;
  parameters: FormParameters;
  messages: FormMessage[];
}

export type PlaceholderType = 'string' | 'number' | 'boolean' | 'json';

export interface FormPlaceholder {
  name: string;
  type: PlaceholderType;
  required: boolean;
  description: string;
}

export interface FormPlaceholdersConfig {
  startPattern: string;
  endPattern: string;
  list: FormPlaceholder[];
}

export type ToolScenario = 'happy-path' | 'empty' | 'error' | 'timeout' | 'malformed';

export interface FormToolConfig {
  name: string;
  scenario: ToolScenario;
  notes: string;
  mockResponse: string;
}

export type EvaluationKind = 'llm-judge' | 'rubric' | 'exact' | 'regex' | 'custom';

export interface FormEvaluation {
  evaluator: string;
  type: EvaluationKind;
  description: string;
}

export interface PromptFormDraft {
  name: string;
  group: string;
  description: string;
  request: FormRequest;
  placeholders: FormPlaceholdersConfig;
  toolConfigs: FormToolConfig[];
  evaluations: FormEvaluation[];
}

export interface PromptFormContext {
  /** "1.8.0" — read-only, bumped on save. */
  version: string;
  /** "r34" — current; next will bump. */
  revision: string;
  /** "github.com/acme/agents" — resolved from project / git remote. */
  repositoryUrl: string;
  /** "main" — branch name from git. */
  branch: string;
}

export interface PromptFormErrors {
  metadata: { name?: string; group?: string; description?: string };
  model: { vendor?: string; model?: string };
  params: Partial<Record<keyof FormParameters, string>>;
  placeholders: { startPattern?: string; endPattern?: string };
  placeholderItems: Array<{ name?: string }>;
  messages: { general?: string };
  messageItems: Array<{ content?: string; name?: string }>;
  tools: Record<string, never>;
  toolItems: Array<{ name?: string; scenario?: string; notes?: string; mockResponse?: string }>;
  evals: { general?: string };
  evalItems: Array<{ evaluator?: string; type?: string; description?: string }>;
  metadataCount: number;
  modelCount: number;
  placeholdersCount: number;
  messagesCount: number;
  toolsCount: number;
  evalsCount: number;
  hasErrors: boolean;
}

export const EMPTY_DRAFT: PromptFormDraft = {
  name: '',
  group: '',
  description: '',
  request: {
    type: 'chat',
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    modelSnapshot: '',
    parameters: {
      temperature: 0.2,
      topP: 1.0,
      maxTokens: 1024,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    messages: [
      { role: 'system', content: '' },
      { role: 'user', content: '' },
    ],
  },
  placeholders: { startPattern: '{{', endPattern: '}}', list: [] },
  toolConfigs: [],
  evaluations: [],
};
