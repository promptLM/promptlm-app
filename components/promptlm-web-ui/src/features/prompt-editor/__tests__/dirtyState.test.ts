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

import { arePromptDraftsEqual } from '../dirtyState';
import { createEmptyPromptDraft, promptEditorReducer } from '../draftState';
import type { PromptEditorState } from '../types';

const cloneEditorState = (state: PromptEditorState): PromptEditorState =>
  JSON.parse(JSON.stringify(state));

describe('arePromptDraftsEqual', () => {
  it('returns true for two freshly-created empty drafts', () => {
    const a = createEmptyPromptDraft();
    const b = createEmptyPromptDraft();
    // Two empty drafts have different message ids (regenerated on each call)
    // — equality must ignore those.
    expect(arePromptDraftsEqual(a, b)).toBe(true);
  });

  it('returns false when the description is edited', () => {
    const base = createEmptyPromptDraft();
    const edited = promptEditorReducer(base, {
      type: 'update-metadata',
      field: 'description',
      value: 'something new',
    });
    expect(arePromptDraftsEqual(base, edited)).toBe(false);
  });

  it('returns false when a message body changes', () => {
    const base = createEmptyPromptDraft();
    const edited = promptEditorReducer(base, {
      type: 'update-message',
      index: 1,
      field: 'content',
      value: 'hello',
    });
    expect(arePromptDraftsEqual(base, edited)).toBe(false);
  });

  it('returns true when only whitespace differs in `name` (sanitisation trims)', () => {
    const base = createEmptyPromptDraft();
    base.draft.name = 'prompt';
    const padded = cloneEditorState(base);
    padded.draft.name = '  prompt  ';
    expect(arePromptDraftsEqual(base, padded)).toBe(true);
  });

  it('returns true when only volatile message ids differ', () => {
    const base = createEmptyPromptDraft();
    const cloned = cloneEditorState(base);
    cloned.draft.request.messages = cloned.draft.request.messages.map((m, i) => ({
      ...m,
      id: `regenerated-${i}`,
    }));
    expect(arePromptDraftsEqual(base, cloned)).toBe(true);
  });

  it('returns false when evaluationEnabled differs', () => {
    const base = createEmptyPromptDraft();
    const toggled: PromptEditorState = { ...base, evaluationEnabled: true };
    expect(arePromptDraftsEqual(base, toggled)).toBe(false);
  });

  it('returns false when a placeholder is added and named', () => {
    const base = createEmptyPromptDraft();
    const withPlaceholder = promptEditorReducer(base, { type: 'add-placeholder' });
    const named = promptEditorReducer(withPlaceholder, {
      type: 'update-placeholder',
      index: 0,
      field: 'name',
      value: 'topic',
    });
    expect(arePromptDraftsEqual(base, named)).toBe(false);
  });

  it('returns false when a model parameter changes', () => {
    const base = createEmptyPromptDraft();
    const edited = promptEditorReducer(base, {
      type: 'update-parameter',
      field: 'temperature',
      value: 0.9,
    });
    expect(arePromptDraftsEqual(base, edited)).toBe(false);
  });
});
