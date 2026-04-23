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

import type { PromptDraftInput } from '@/api/promptPayloads';
import type { MessageContentSelection } from '@promptlm/ui';

const USER_ROLE = 'user';

export type InsertPlaceholderTokenResult =
  | {
      type: 'selection';
      messageIndex: number;
      nextContent: string;
      caretPosition: number;
    }
  | {
      type: 'fallback';
      messageIndex: number;
      nextContent: string;
      caretPosition: number;
    }
  | {
      type: 'error';
      message: string;
    };

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const normalizeSelectionRange = (
  selectionStart: number,
  selectionEnd: number,
  contentLength: number,
): { start: number; end: number } => {
  const boundedStart = clamp(selectionStart, 0, contentLength);
  const boundedEnd = clamp(selectionEnd, 0, contentLength);
  if (boundedStart <= boundedEnd) {
    return { start: boundedStart, end: boundedEnd };
  }
  return { start: boundedEnd, end: boundedStart };
};

const findLastUserMessageIndex = (messages: PromptDraftInput['request']['messages']): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role.toLowerCase() === USER_ROLE) {
      return index;
    }
  }
  return -1;
};

export const createPlaceholderToken = (openSequence: string, name: string, closeSequence: string): string => {
  return `${openSequence}${name}${closeSequence}`;
};

export const insertPlaceholderToken = (
  messages: PromptDraftInput['request']['messages'],
  token: string,
  selection: MessageContentSelection | null,
): InsertPlaceholderTokenResult => {
  if (selection) {
    const selectedMessage = messages[selection.messageIndex];
    if (selectedMessage) {
      const content = selectedMessage.content;
      const { start, end } = normalizeSelectionRange(selection.selectionStart, selection.selectionEnd, content.length);
      return {
        type: 'selection',
        messageIndex: selection.messageIndex,
        nextContent: `${content.slice(0, start)}${token}${content.slice(end)}`,
        caretPosition: start + token.length,
      };
    }
  }

  const lastUserMessageIndex = findLastUserMessageIndex(messages);
  if (lastUserMessageIndex >= 0) {
    const content = messages[lastUserMessageIndex].content;
    return {
      type: 'fallback',
      messageIndex: lastUserMessageIndex,
      nextContent: `${content}${token}`,
      caretPosition: content.length + token.length,
    };
  }

  return {
    type: 'error',
    message: 'Add a user message before inserting placeholders.',
  };
};
