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
 * Issue #185 — detect whether the prompt editor form has unsaved changes.
 *
 * Equality is defined in terms of the canonical, on-the-wire shape: the
 * inputs are first run through `sanitizePromptDraft` so that whitespace
 * trimming, slug sanitisation, and placeholder ordering don't show up as
 * spurious dirty signals. Message `id` values are stripped before comparison
 * because they are regenerated on every hydration (`msg-${Date.now()}-...`)
 * and have no semantic meaning.
 *
 * The `evaluationEnabled` flag is part of the comparison so toggling
 * evaluations counts as dirty (`set-evaluation-enabled` does not modify any
 * persisted field by itself, but the user has plainly changed the form).
 */

import { useEffect, useState } from 'react';

import { sanitizePromptDraft } from './draftState';
import type { PromptEditorState } from './types';
import type { EditablePromptMessage, PromptDraftInput } from '@/api/promptPayloads';

const stripMessageIds = (messages: EditablePromptMessage[]) =>
  messages.map(({ id: _id, ...rest }) => rest);

const canonicaliseDraft = (state: PromptEditorState): unknown => {
  const sanitized = sanitizePromptDraft(state.draft, state.evaluationEnabled, state.draft.repositoryUrl);
  // The `id` field on messages is volatile (regenerated on hydration). Strip
  // it before comparing so equal content doesn't read as dirty.
  const stripped: PromptDraftInput = {
    ...sanitized,
    request: {
      ...sanitized.request,
      messages: stripMessageIds(sanitized.request.messages),
    },
  };
  return stripped;
};

/**
 * Returns true if two prompt editor states are semantically equal — that is,
 * if saving either one would produce the same persisted document.
 */
export const arePromptDraftsEqual = (a: PromptEditorState, b: PromptEditorState): boolean => {
  if (a.evaluationEnabled !== b.evaluationEnabled) return false;
  // Use JSON.stringify as a deep-equality shortcut. Both sides came out of
  // `sanitizePromptDraft`, so key ordering inside objects is stable enough
  // for this comparison to be reliable in practice. The function is a hot
  // path on every keystroke; this trades a small false-negative risk for
  // simplicity (the user's worst case is a transient "Modified" chip that
  // disappears on the next keystroke).
  return JSON.stringify(canonicaliseDraft(a)) === JSON.stringify(canonicaliseDraft(b));
};

type UsePromptFormDirtyArgs = {
  current: PromptEditorState;
  baseline: PromptEditorState | null;
};

/**
 * Tracks whether the editor's current state diverges from a baseline.
 *
 * `baseline` is `null` while the editor is still hydrating — in that window
 * we report `isDirty === false` so the "Modified" chip doesn't flash before
 * the persisted draft arrives. Once a baseline is set, every state change
 * is compared against it.
 */
export const usePromptFormDirty = ({ current, baseline }: UsePromptFormDirtyArgs): boolean => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (baseline === null) {
      setIsDirty(false);
      return;
    }
    setIsDirty(!arePromptDraftsEqual(current, baseline));
  }, [current, baseline]);

  return isDirty;
};
