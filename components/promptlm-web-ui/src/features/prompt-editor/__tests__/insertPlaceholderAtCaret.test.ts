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

import {
  PLACEHOLDER_INSERT_NO_CARET_HINT,
  buildPlaceholderToken,
  insertPlaceholderAtCaret,
} from '../insertPlaceholderAtCaret';

describe('insertPlaceholderAtCaret', () => {
  it('builds a token using the configured delimiters', () => {
    expect(buildPlaceholderToken('{{', 'user_name', '}}')).toBe('{{user_name}}');
    expect(buildPlaceholderToken('[[', 'topic', ']]')).toBe('[[topic]]');
  });

  it('inserts the token at the caret position when no text is selected', () => {
    const result = insertPlaceholderAtCaret(
      [{ content: 'Hello world' }],
      '{{name}}',
      { messageIndex: 0, selectionStart: 6, selectionEnd: 6 },
    );

    expect(result).toEqual({
      type: 'inserted',
      messageIndex: 0,
      nextContent: 'Hello {{name}}world',
      caretPosition: 14,
    });
  });

  it('replaces selected text with the token', () => {
    const result = insertPlaceholderAtCaret(
      [{ content: 'Hello world' }],
      '{{name}}',
      { messageIndex: 0, selectionStart: 6, selectionEnd: 11 },
    );

    expect(result).toEqual({
      type: 'inserted',
      messageIndex: 0,
      nextContent: 'Hello {{name}}',
      caretPosition: 14,
    });
  });

  it('normalises selection ranges that arrive end-before-start', () => {
    const result = insertPlaceholderAtCaret(
      [{ content: 'Hello world' }],
      '{{x}}',
      { messageIndex: 0, selectionStart: 11, selectionEnd: 6 },
    );

    expect(result).toEqual({
      type: 'inserted',
      messageIndex: 0,
      nextContent: 'Hello {{x}}',
      caretPosition: 11,
    });
  });

  it('clamps selection indices outside the content length', () => {
    const result = insertPlaceholderAtCaret(
      [{ content: 'hi' }],
      '{{x}}',
      { messageIndex: 0, selectionStart: -3, selectionEnd: 99 },
    );

    expect(result).toEqual({
      type: 'inserted',
      messageIndex: 0,
      nextContent: '{{x}}',
      caretPosition: 5,
    });
  });

  it('returns a no-caret hint when no selection is supplied', () => {
    const result = insertPlaceholderAtCaret(
      [{ content: 'Hello world' }],
      '{{name}}',
      null,
    );

    expect(result).toEqual({
      type: 'no-caret',
      hint: PLACEHOLDER_INSERT_NO_CARET_HINT,
    });
  });

  it('returns an invalid-message hint when the indexed message is missing', () => {
    const result = insertPlaceholderAtCaret(
      [{ content: 'one' }],
      '{{name}}',
      { messageIndex: 5, selectionStart: 0, selectionEnd: 0 },
    );

    expect(result.type).toBe('invalid-message');
  });
});
