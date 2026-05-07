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

import { describe, it, expect } from 'vitest';
import {
  requestShapeHash,
  PROMPT_FORM_EMPTY_DRAFT,
  type PromptFormDraft,
  type PromptFormPlaceholder,
} from '@promptlm/ui';

const baseDraft = (): PromptFormDraft => ({
  ...PROMPT_FORM_EMPTY_DRAFT,
  request: {
    ...PROMPT_FORM_EMPTY_DRAFT.request,
    parameters: { ...PROMPT_FORM_EMPTY_DRAFT.request.parameters },
    messages: PROMPT_FORM_EMPTY_DRAFT.request.messages.map((m) => ({ ...m })),
  },
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [
      { name: 'question', type: 'string', required: true, description: 'q' },
      { name: 'tone', type: 'string', required: false, description: 't' },
    ],
  },
});

describe('requestShapeHash — Q5 lock semantics', () => {
  it('is stable across two identical inputs', () => {
    const a = baseDraft();
    const b = baseDraft();
    expect(requestShapeHash(a)).toBe(requestShapeHash(b));
  });

  it('does NOT change when only placeholder VALUES change (Q3 / Q5)', () => {
    const a = baseDraft();
    const b: PromptFormDraft = {
      ...baseDraft(),
      placeholders: {
        ...baseDraft().placeholders,
        list: baseDraft().placeholders.list.map((p) => ({ ...p, description: `${p.description}!` })),
      },
    };
    expect(requestShapeHash(a)).toBe(requestShapeHash(b));
  });

  it('does NOT change when placeholder list order changes', () => {
    const a = baseDraft();
    const b = baseDraft();
    b.placeholders.list = [...baseDraft().placeholders.list].reverse();
    expect(requestShapeHash(a)).toBe(requestShapeHash(b));
  });

  it('CHANGES when a placeholder is renamed', () => {
    const a = baseDraft();
    const b = baseDraft();
    b.placeholders.list[0] = { ...b.placeholders.list[0], name: 'query' };
    expect(requestShapeHash(a)).not.toBe(requestShapeHash(b));
  });

  it('CHANGES when a placeholder is added', () => {
    const a = baseDraft();
    const b = baseDraft();
    const extra: PromptFormPlaceholder = {
      name: 'extra',
      type: 'string',
      required: false,
      description: '',
    };
    b.placeholders.list = [...b.placeholders.list, extra];
    expect(requestShapeHash(a)).not.toBe(requestShapeHash(b));
  });

  it('CHANGES when a placeholder type changes', () => {
    const a = baseDraft();
    const b = baseDraft();
    b.placeholders.list[0] = { ...b.placeholders.list[0], type: 'number' };
    expect(requestShapeHash(a)).not.toBe(requestShapeHash(b));
  });

  it('CHANGES when message content changes', () => {
    const a = baseDraft();
    const b = baseDraft();
    b.request.messages = b.request.messages.map((m, i) =>
      i === 0 ? { ...m, content: `${m.content}-edited` } : m,
    );
    expect(requestShapeHash(a)).not.toBe(requestShapeHash(b));
  });

  it('CHANGES when model snapshot or temperature changes', () => {
    const a = baseDraft();
    const b1 = baseDraft();
    b1.request.modelSnapshot = '2025-04-14';
    expect(requestShapeHash(a)).not.toBe(requestShapeHash(b1));

    const b2 = baseDraft();
    b2.request.parameters = { ...b2.request.parameters, temperature: 0.5 };
    expect(requestShapeHash(a)).not.toBe(requestShapeHash(b2));
  });

  it('returns an 8-char hex string', () => {
    const h = requestShapeHash(baseDraft());
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });
});
