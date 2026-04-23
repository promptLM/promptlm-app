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

import { createPlaceholderToken, insertPlaceholderToken } from '../placeholderInsertion';

describe('placeholder insertion helpers', () => {
  it('builds tokens using configured delimiters', () => {
    expect(createPlaceholderToken('[[', 'number_one', ']]')).toBe('[[number_one]]');
  });

  it('inserts token at focused caret location', () => {
    const result = insertPlaceholderToken(
      [{ role: 'user', content: 'Number one plus number two.' }],
      '[[number_one]]',
      {
        messageIndex: 0,
        selectionStart: 7,
        selectionEnd: 7,
      },
    );

    expect(result).toEqual({
      type: 'selection',
      messageIndex: 0,
      nextContent: 'Number [[number_one]]one plus number two.',
      caretPosition: 21,
    });
  });

  it('replaces selected text when inserting token', () => {
    const result = insertPlaceholderToken(
      [{ role: 'user', content: 'Number one plus number two.' }],
      '[[number_two]]',
      {
        messageIndex: 0,
        selectionStart: 16,
        selectionEnd: 26,
      },
    );

    expect(result).toEqual({
      type: 'selection',
      messageIndex: 0,
      nextContent: 'Number one plus [[number_two]].',
      caretPosition: 30,
    });
  });

  it('falls back to appending to the last user message when nothing is focused', () => {
    const result = insertPlaceholderToken(
      [
        { role: 'system', content: 'You are a helper.' },
        { role: 'assistant', content: 'How can I help?' },
        { role: 'user', content: 'Answer: ' },
      ],
      '[[number_one]]',
      null,
    );

    expect(result).toEqual({
      type: 'fallback',
      messageIndex: 2,
      nextContent: 'Answer: [[number_one]]',
      caretPosition: 22,
    });
  });

  it('returns an error when no user message exists for fallback insertion', () => {
    const result = insertPlaceholderToken(
      [
        { role: 'system', content: 'You are a helper.' },
        { role: 'assistant', content: 'How can I help?' },
      ],
      '[[number_one]]',
      null,
    );

    expect(result).toEqual({
      type: 'error',
      message: 'Add a user message before inserting placeholders.',
    });
  });
});
