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
  buildExecutePromptRequest,
  buildPromptDraftInputFromPrompt,
  buildPromptSpecCreationRequest,
  type PromptDraftInput,
} from '@/api/promptPayloads';

const sampleDraft: PromptDraftInput = {
  id: 'draft-1',
  name: 'Sample Prompt',
  group: 'test',
  version: '1.0.0',
  revision: 2,
  description: 'desc',
  authors: ['me'],
  purpose: 'purpose',
  repositoryUrl: 'http://repo',
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [
      { name: 'first', value: 'A' },
      { name: 'second', value: 'B' },
    ],
    defaults: { first: 'A', second: 'B' },
  },
  request: {
    type: 'chat/completion',
    vendor: 'openai',
    model: 'gpt-4',
    url: 'http://model',
    modelSnapshot: 'snapshot-1',
    parameters: {
      temperature: 0.5,
      topP: 0.8,
      maxTokens: 120,
      frequencyPenalty: 0.1,
      presencePenalty: 0.2,
      stream: true,
    },
    messages: [
      { id: 'm1', role: 'system', content: 'sys' },
      { id: 'm2', role: 'user', content: 'usr' },
    ],
  },
  extensions: {
    'x-custom': { foo: 'bar' },
  },
};

describe('buildPromptSpecCreationRequest', () => {
  it('maps draft input into generated PromptSpecCreationRequest shape', () => {
    const payload = buildPromptSpecCreationRequest(sampleDraft);

    expect(payload).toMatchObject({
      id: 'draft-1',
      name: 'Sample Prompt',
      group: 'test',
      description: 'desc',
      placeholderStartPattern: '{{',
      placeholderEndPattern: '}}',
      placeholder: { first: 'A', second: 'B' },
      userMessage: 'usr',
      type: 'chat/completion',
      vendorAndModel: {
        vendorName: 'openai',
        model: 'gpt-4',
        endpoint: 'http://model',
      },
      version: '1.0.0',
      repositoryUrl: 'http://repo',
      extensions: { 'x-custom': { foo: 'bar' } },
    });

    expect(payload.messages).toEqual([
      { role: 'SYSTEM', content: 'sys', name: undefined },
      { role: 'USER', content: 'usr', name: undefined },
    ]);

    expect(payload.request).toEqual({
      type: 'chat/completion',
      vendor: 'openai',
      model: 'gpt-4',
      url: 'http://model',
      model_snapshot: 'snapshot-1',
      parameters: {
        temperature: 0.5,
        topP: 0.8,
        maxTokens: 120,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
        stream: true,
      },
      messages: [
        { role: 'SYSTEM', content: 'sys', name: undefined },
        { role: 'USER', content: 'usr', name: undefined },
      ],
    });
  });

  it('normalizes metadata, message roles, and placeholders to the generated schema shape', () => {
    const payload = buildPromptSpecCreationRequest({
      ...sampleDraft,
      id: '   ',
      name: '  Prompt X  ',
      group: '   ',
      description: '   ',
      repositoryUrl: '  https://example.org/repo  ',
      placeholders: {
        startPattern: '   ',
        endPattern: '',
        list: [
          { name: '  first  ', value: undefined },
          { name: 'second', value: 'B2' },
          { name: '   ', value: 'ignored' },
          { name: 'second', value: 'B3' },
        ],
        defaults: {
          first: 'A-from-defaults',
          second: 'B-from-defaults',
          stale: 'drop-me',
        },
      },
      request: {
        ...sampleDraft.request,
        type: '   ',
        vendor: '  openai  ',
        model: '  gpt-4.1  ',
        url: '  https://api.example.com  ',
        modelSnapshot: '  snapshot-2  ',
        parameters: {
          temperature: Number.NaN,
          topP: 0.91,
          maxTokens: 99.9,
          frequencyPenalty: Number.POSITIVE_INFINITY,
          presencePenalty: 0.4,
          stream: true,
        },
        messages: [
          { id: '  ', role: 'tool', content: 'tool-content', name: '  helper  ' },
          { id: 'msg-user', role: 'user', content: 'actual-user', name: undefined },
        ],
      },
    });

    expect(payload.id).toBeUndefined();
    expect(payload.name).toBe('Prompt X');
    expect(payload.group).toBe('');
    expect(payload.description).toBeUndefined();
    expect(payload.repositoryUrl).toBe('https://example.org/repo');
    expect(payload.placeholder).toEqual({
      first: 'A-from-defaults',
      second: 'B3',
    });
    expect(payload.messages).toEqual([
      { role: 'TOOL', content: 'tool-content', name: 'helper' },
      { role: 'USER', content: 'actual-user', name: undefined },
    ]);
    expect(payload.request).toMatchObject({
      type: 'chat/completion',
      vendor: 'openai',
      model: 'gpt-4.1',
      url: 'https://api.example.com',
      model_snapshot: 'snapshot-2',
      parameters: {
        topP: 0.91,
        maxTokens: 99,
        presencePenalty: 0.4,
        stream: true,
      },
    });
  });
});

describe('buildExecutePromptRequest', () => {
  it('maps draft input into the generated execute request shape', () => {
    const payload = buildExecutePromptRequest(sampleDraft);

    expect(payload.promptSpec).toMatchObject({
      id: 'draft-1',
      name: 'Sample Prompt',
      group: 'test',
      description: 'desc',
      authors: ['me'],
      purpose: 'purpose',
      repositoryUrl: 'http://repo',
      version: '1.0.0',
      revision: 2,
      request: {
        type: 'chat/completion',
        vendor: 'openai',
        model: 'gpt-4',
        url: 'http://model',
        model_snapshot: 'snapshot-1',
      },
      placeholders: {
        startPattern: '{{',
        endPattern: '}}',
        defaults: { first: 'A', second: 'B' },
      },
      extensions: { 'x-custom': { foo: 'bar' } },
    });
  });

  it('preserves existing x-evaluation extensions when no evaluation definitions are provided', () => {
    const payload = buildExecutePromptRequest({
      ...sampleDraft,
      evaluations: [],
      extensions: {
        ...sampleDraft.extensions,
        'x-evaluation': {
          results: {
            evaluations: [
              {
                evaluator: 'policy-check',
                type: 'automatic',
                description: 'Validate policy wording',
                success: true,
              },
            ],
          },
        },
      },
    });

    expect(payload.promptSpec.extensions).toMatchObject({
      'x-custom': { foo: 'bar' },
      'x-evaluation': {
        results: {
          evaluations: [
            {
              evaluator: 'policy-check',
              type: 'automatic',
              description: 'Validate policy wording',
              success: true,
            },
          ],
        },
      },
    });
  });
});

describe('buildPromptDraftInputFromPrompt', () => {
  it('preserves non-primary messages while replacing edited system and user content', () => {
    const prompt: PromptSpec = {
      id: 'prompt-1',
      name: 'Existing Prompt',
      group: 'support',
      description: 'desc',
      repositoryUrl: 'https://example.com/repo',
      version: '1.0.0',
      revision: 3,
      authors: ['Ada'],
      purpose: 'help',
      request: {
        type: 'chat/completion',
        vendor: 'openai',
        model: 'gpt-4o',
        url: 'https://api.example.com',
        model_snapshot: 'snapshot-1',
        parameters: { temperature: 0.4 },
        messages: [
          { role: 'SYSTEM', content: 'old system' },
          { role: 'USER', content: 'old user' },
          { role: 'TOOL', content: 'tool body', name: 'helper' },
        ],
      },
      placeholders: {
        startPattern: '{{',
        endPattern: '}}',
        list: [{ name: 'customer', defaultValue: 'Alice' }],
        defaults: { customer: 'Alice' },
      },
      extensions: { 'x-custom': { foo: 'bar' } as never },
    };

    const draft = buildPromptDraftInputFromPrompt(prompt, {
      systemMessage: 'new system',
      userMessage: 'new user',
    });

    expect(draft.request.messages).toEqual([
      { role: 'system', content: 'new system' },
      { role: 'user', content: 'new user' },
      { id: 'msg-2', role: 'tool', content: 'tool body', name: 'helper' },
    ]);
    expect(draft.placeholders.defaults).toEqual({ customer: 'Alice' });
    expect(draft.extensions).toEqual({ 'x-custom': { foo: 'bar' } });
  });
});
