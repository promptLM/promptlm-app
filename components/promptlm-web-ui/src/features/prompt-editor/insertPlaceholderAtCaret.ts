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
 * Helper for issue #187 — "Insert" affordance on placeholder rows.
 *
 * Per #187, when the editor does not currently hold the caret, the click MUST
 * NOT insert — the caller surfaces a hint instead.
 */

export type CaretSelection = {
  messageIndex: number;
  selectionStart: number;
  selectionEnd: number;
};

export type InsertAtCaretResult =
  | {
      type: 'inserted';
      messageIndex: number;
      nextContent: string;
      caretPosition: number;
    }
  | {
      type: 'no-caret';
      hint: string;
    }
  | {
      type: 'invalid-message';
      hint: string;
    };

export const PLACEHOLDER_INSERT_NO_CARET_HINT =
  'Place the cursor in the editor where the placeholder should be inserted.';

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const buildPlaceholderToken = (
  startPattern: string,
  name: string,
  endPattern: string,
): string => `${startPattern}${name}${endPattern}`;

/**
 * Compute the next message content and caret position after inserting a token
 * at the user's caret/selection in a message. If `selection` is null, returns
 * a `no-caret` result so the caller can surface the standard hint.
 */
export const insertPlaceholderAtCaret = (
  messages: ReadonlyArray<{ content: string }>,
  token: string,
  selection: CaretSelection | null,
): InsertAtCaretResult => {
  if (!selection) {
    return { type: 'no-caret', hint: PLACEHOLDER_INSERT_NO_CARET_HINT };
  }

  const target = messages[selection.messageIndex];
  if (!target) {
    return { type: 'invalid-message', hint: PLACEHOLDER_INSERT_NO_CARET_HINT };
  }

  const content = target.content;
  const rawStart = clamp(selection.selectionStart, 0, content.length);
  const rawEnd = clamp(selection.selectionEnd, 0, content.length);
  const start = Math.min(rawStart, rawEnd);
  const end = Math.max(rawStart, rawEnd);

  const nextContent = `${content.slice(0, start)}${token}${content.slice(end)}`;
  const caretPosition = start + token.length;
  return {
    type: 'inserted',
    messageIndex: selection.messageIndex,
    nextContent,
    caretPosition,
  };
};
