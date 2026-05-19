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

import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetEncoderCacheForTests,
  buildEstimatorPayload,
  estimateInputTokens,
  heuristicTokenCount,
  loadCl100kBaseEncoder,
  renderMessageWithPlaceholders,
} from '../tokenEstimator';

afterEach(() => {
  __resetEncoderCacheForTests();
});

describe('renderMessageWithPlaceholders', () => {
  it('substitutes placeholder markers with their default values', () => {
    const out = renderMessageWithPlaceholders(
      'Hello {{name}}, welcome to {{site}}.',
      [
        { name: 'name', defaultValue: 'Ada' },
        { name: 'site', defaultValue: 'promptLM' },
      ],
      '{{',
      '}}',
    );
    expect(out).toBe('Hello Ada, welcome to promptLM.');
  });

  it('leaves unknown placeholders intact so they still contribute to the count', () => {
    const out = renderMessageWithPlaceholders(
      'Hello {{unknown}}',
      [{ name: 'name', defaultValue: 'Ada' }],
      '{{',
      '}}',
    );
    expect(out).toBe('Hello {{unknown}}');
  });

  it('uses configured delimiters', () => {
    const out = renderMessageWithPlaceholders(
      'Hi <%name%>',
      [{ name: 'name', defaultValue: 'Ada' }],
      '<%',
      '%>',
    );
    expect(out).toBe('Hi Ada');
  });
});

describe('buildEstimatorPayload', () => {
  it('joins messages with role prefix and includes resolved placeholders', () => {
    const payload = buildEstimatorPayload({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Translate "{{phrase}}" to French.' },
      ],
      placeholders: [{ name: 'phrase', defaultValue: 'good morning' }],
    });
    expect(payload).toContain('system: You are a helpful assistant.');
    expect(payload).toContain('user: Translate "good morning" to French.');
  });

  it('appends the tool/function schema JSON when present', () => {
    const payload = buildEstimatorPayload({
      messages: [{ role: 'user', content: 'go' }],
      placeholders: [],
      toolSchema: { name: 'lookup', parameters: { type: 'object' } },
    });
    expect(payload).toContain('"name":"lookup"');
    expect(payload).toContain('"parameters"');
  });

  it('returns empty string for empty input', () => {
    expect(
      buildEstimatorPayload({ messages: [], placeholders: [] }),
    ).toBe('');
  });
});

describe('heuristicTokenCount', () => {
  it('returns 0 for empty input', () => {
    expect(heuristicTokenCount('')).toBe(0);
  });

  it('rounds up to whole tokens at ~4 chars per token', () => {
    // 12 chars / 4 = 3
    expect(heuristicTokenCount('hello world!')).toBe(3);
    // 13 chars / 4 = 3.25 → ceil → 4
    expect(heuristicTokenCount('hello, world!')).toBe(4);
  });
});

describe('estimateInputTokens', () => {
  it('returns 0 for empty input without loading the encoder', async () => {
    const tokens = await estimateInputTokens({ messages: [], placeholders: [] });
    expect(tokens).toBe(0);
  });

  it('estimates a positive token count for a normal prompt body', async () => {
    const tokens = await estimateInputTokens({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Translate "{{phrase}}" to French.' },
      ],
      placeholders: [{ name: 'phrase', defaultValue: 'good morning' }],
    });
    expect(tokens).toBeGreaterThan(5);
    // Sanity upper bound — a ~15-word prompt shouldn't burn 200 tokens.
    expect(tokens).toBeLessThan(200);
  });

  it('produces a larger estimate when a tool schema is added', async () => {
    const base = await estimateInputTokens({
      messages: [{ role: 'user', content: 'go' }],
      placeholders: [],
    });
    const withTool = await estimateInputTokens({
      messages: [{ role: 'user', content: 'go' }],
      placeholders: [],
      toolSchema: {
        name: 'lookup_customer',
        description: 'Look up a customer by id',
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    });
    expect(withTool).toBeGreaterThan(base);
  });

  it('loads the cl100k_base encoding module', async () => {
    const encoder = await loadCl100kBaseEncoder();
    expect(encoder).not.toBeNull();
    expect(encoder!.encode('hello').length).toBeGreaterThan(0);
  });
});
