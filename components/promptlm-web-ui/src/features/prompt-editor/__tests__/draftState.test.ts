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

import { describe, expect, it } from 'vitest';

import type { PromptSpec } from '@promptlm/api-client';

import {
  createEmptyPromptDraft,
  createPromptDraftFromPrompt,
  promptEditorReducer,
  sanitizePromptDraft,
} from '../draftState';

describe('promptEditorReducer', () => {
  it('adds and updates tool messages through the shared message state', () => {
    const initial = createEmptyPromptDraft();
    const withTool = promptEditorReducer(initial, { type: 'add-message', role: 'tool' });
    const toolIndex = withTool.draft.request.messages.length - 1;
    const next = promptEditorReducer(withTool, {
      type: 'update-message',
      index: toolIndex,
      field: 'name',
      value: 'inventory.search',
    });

    const toolMessage = next.draft.request.messages.at(-1);
    expect(toolMessage?.role).toBe('tool');
    expect(toolMessage?.name).toBe('inventory.search');
  });

  it('keeps only one system message at the front when sanitizing', () => {
    const initial = createEmptyPromptDraft();
    const draft = {
      ...initial.draft,
      name: '  prompt-name  ',
      group: '  support  ',
      request: {
        ...initial.draft.request,
        messages: [
          { id: 'sys-1', role: 'system', content: 'First system' },
          { id: 'sys-2', role: 'system', content: 'Second system' },
          { id: 'usr-1', role: 'user', content: 'Hello' },
        ],
      },
      evaluations: [{ evaluator: 'qa', type: 'automatic', description: '  check  ' }],
    };

    const sanitized = sanitizePromptDraft(draft, true, 'https://example.com/repo');

    expect(sanitized.name).toBe('prompt-name');
    expect(sanitized.group).toBe('support');
    expect(sanitized.request.messages[0]?.role).toBe('system');
    expect(sanitized.request.messages[1]?.role).toBe('assistant');
    expect(sanitized.repositoryUrl).toBe('https://example.com/repo');
    expect(sanitized.evaluations).toEqual([
      { evaluator: 'qa', type: 'automatic', description: 'check' },
    ]);
  });
});

describe('createPromptDraftFromPrompt', () => {
  it('hydrates evaluation definitions from prompt extensions', () => {
    const prompt: PromptSpec = {
      id: 'prompt-1',
      name: 'Support Prompt',
      group: 'support',
      description: 'Existing prompt',
      request: {
        type: 'chat/completion',
        vendor: 'openai',
        model: 'gpt-4o',
        messages: [
          { role: 'SYSTEM', content: 'System message' },
          { role: 'USER', content: 'User message' },
        ],
      } as PromptSpec['request'],
      placeholders: {
        startPattern: '{{',
        endPattern: '}}',
        list: [{ name: 'customer_name', defaultValue: 'Taylor' }],
      },
      extensions: {
        'x-evaluation': {
          spec: {
            evaluations: [
              { evaluator: 'policy-check', type: 'automatic', description: 'Validate policy wording' },
            ],
          },
        },
      } as PromptSpec['extensions'],
    };

    const state = createPromptDraftFromPrompt(prompt);

    expect(state.evaluationEnabled).toBe(true);
    expect(state.draft.request.messages).toHaveLength(2);
    expect(state.draft.evaluations).toEqual([
      { evaluator: 'policy-check', type: 'automatic', description: 'Validate policy wording' },
    ]);
  });
});
