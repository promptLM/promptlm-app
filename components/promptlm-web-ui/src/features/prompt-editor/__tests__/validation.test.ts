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

import type { PromptDraftInput } from '@/api/promptPayloads';
import type { PromptEditorToolConfig } from '@promptlm/ui';

import { validatePromptEditor } from '../validation';

const buildDraft = (): PromptDraftInput => ({
  name: 'support-prompt',
  group: 'support',
  description: 'Assist support agents.',
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [{ name: 'customer_name', value: 'Taylor' }],
    defaults: { customer_name: 'Taylor' },
  },
  request: {
    type: 'chat/completion',
    vendor: 'openai',
    model: 'gpt-4o',
    url: 'https://api.example.com/v1/chat/completions',
    modelSnapshot: '2026-03-01',
    parameters: {
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 512,
      stream: false,
    },
    messages: [
      { id: 'system-1', role: 'system', content: 'You are a helpful assistant.' },
      { id: 'user-1', role: 'user', content: 'Help the customer.' },
    ],
  },
  evaluations: [{ evaluator: 'quality-check', type: 'automatic', description: 'Check tone' }],
});

const buildToolConfigs = (): PromptEditorToolConfig[] => [
  {
    id: 'tool-1',
    name: 'inventory.search',
    scenario: 'default',
    notes: 'Search inventory records.',
    mockResponse: '{ "items": [] }',
  },
];

describe('validatePromptEditor', () => {
  it('accepts a complete draft', () => {
    const result = validatePromptEditor(buildDraft(), true, buildToolConfigs());

    expect(result.hasErrors).toBe(false);
    expect(result.metadata).toEqual({});
    expect(result.messages).toEqual({});
    expect(result.toolConfigs).toEqual({});
  });

  it('reports section-local validation errors', () => {
    const draft = buildDraft();
    draft.name = 'bad name';
    draft.group = '';
    draft.request.vendor = '';
    draft.request.model = '';
    draft.request.url = 'notaurl';
    draft.request.parameters = { temperature: 9 };
    draft.placeholders = {
      startPattern: '',
      endPattern: '',
      list: [{ name: '', value: '' }],
    };
    draft.request.messages = [{ id: 'tool-1', role: 'tool', content: '', name: '' }];
    draft.evaluations = [{ evaluator: '', type: '', description: '' }];
    const toolConfigs: PromptEditorToolConfig[] = [
      {
        id: 'tool-1',
        name: '',
        scenario: '',
        notes: '',
        mockResponse: '',
      },
    ];

    const result = validatePromptEditor(draft, true, toolConfigs);

    expect(result.hasErrors).toBe(true);
    expect(result.metadata.name).toContain('letters, numbers');
    expect(result.metadata.group).toContain('Select a prompt group');
    expect(result.modelConfiguration.vendor).toContain('Select an LLM provider');
    expect(result.modelConfiguration.model).toContain('Select a deployed model');
    expect(result.placeholders.list?.[0]?.name).toContain('required');
    expect(result.messages.general).toContain('user message');
    expect(result.messages.list?.[0]?.name).toContain('tool name');
    expect(result.toolConfigs.configs?.[0]?.name).toContain('required');
    expect(result.toolConfigs.configs?.[0]?.scenario).toContain('required');
    expect(result.toolConfigs.configs?.[0]?.notes).toContain('required');
    expect(result.toolConfigs.configs?.[0]?.mockResponse).toContain('required');
    expect(result.evaluationPlan.evaluations?.[0]?.evaluator).toContain('required');
  });

  it('reports duplicate placeholder names inline', () => {
    const draft = buildDraft();
    draft.placeholders.list = [
      { name: 'Customer_Name', value: 'Taylor' },
      { name: 'customer_name', value: 'Avery' },
    ];

    const result = validatePromptEditor(draft, true, buildToolConfigs());

    expect(result.hasErrors).toBe(true);
    expect(result.placeholders.general).toContain('must be unique');
    expect(result.placeholders.list?.[0]?.name).toContain('must be unique');
    expect(result.placeholders.list?.[1]?.name).toContain('must be unique');
  });
});
