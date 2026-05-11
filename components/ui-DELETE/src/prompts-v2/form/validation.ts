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

import type { PromptFormDraft, PromptFormErrors } from './types';

const SLUG_RE = /^[A-Za-z0-9_-]+$/;

const countKeys = (obj: object) => Object.keys(obj).length;
const sumNonEmpty = <T extends object>(items: T[]) =>
  items.filter((x) => Object.keys(x).length > 0).length;

/**
 * Validates a draft against the rules from `prompt-form.jsx::validateDraft`.
 * Returns a structured error map plus per-section counts used by the
 * Collapsible badges and the sticky header status line.
 */
export function validateDraft(draft: PromptFormDraft, evalEnabled: boolean): PromptFormErrors {
  const e: PromptFormErrors = {
    metadata: {},
    model: {},
    params: {},
    placeholders: {},
    placeholderItems: [],
    messages: {},
    messageItems: [],
    tools: {},
    toolItems: [],
    evals: {},
    evalItems: [],
    metadataCount: 0,
    modelCount: 0,
    placeholdersCount: 0,
    messagesCount: 0,
    toolsCount: 0,
    evalsCount: 0,
    hasErrors: false,
  };

  if (!draft.name.trim()) {
    e.metadata.name = 'Enter a prompt name.';
  } else if (!SLUG_RE.test(draft.name)) {
    e.metadata.name = "Letters, numbers, '-' or '_' only.";
  }
  if (!draft.group.trim()) {
    e.metadata.group = 'Select a prompt group.';
  } else if (!SLUG_RE.test(draft.group)) {
    e.metadata.group = "Letters, numbers, '-' or '_' only.";
  }
  if (!draft.description.trim()) {
    e.metadata.description = 'Add a short description.';
  }

  if (!draft.request.vendor.trim()) e.model.vendor = 'Select a provider.';
  if (!draft.request.model.trim()) e.model.model = 'Select a model.';

  const p = draft.request.parameters;
  if (p.temperature < 0 || p.temperature > 2) e.params.temperature = '0–2';
  if (p.topP < 0 || p.topP > 1) e.params.topP = '0–1';
  if (p.maxTokens <= 0) e.params.maxTokens = '> 0';
  if (p.frequencyPenalty < -2 || p.frequencyPenalty > 2) e.params.frequencyPenalty = '-2 to 2';
  if (p.presencePenalty < -2 || p.presencePenalty > 2) e.params.presencePenalty = '-2 to 2';

  const phList = draft.placeholders.list;
  if (phList.length > 0 && !draft.placeholders.startPattern) {
    e.placeholders.startPattern = 'Required.';
  }
  if (phList.length > 0 && !draft.placeholders.endPattern) {
    e.placeholders.endPattern = 'Required.';
  }

  const seen = new Map<string, number>();
  for (const ph of phList) {
    const k = ph.name.trim().toLowerCase();
    if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  e.placeholderItems = phList.map((ph) => {
    const item: { name?: string } = {};
    if (!ph.name.trim()) item.name = 'Required.';
    else if ((seen.get(ph.name.trim().toLowerCase()) ?? 0) > 1)
      item.name = 'Names must be unique.';
    return item;
  });

  if (!draft.request.messages.some((m) => m.role === 'user' && m.content.trim())) {
    e.messages.general = 'Add at least one user message with content.';
  }
  e.messageItems = draft.request.messages.map((m) => {
    const item: { content?: string; name?: string } = {};
    if (!m.content.trim()) item.content = 'Empty.';
    if (m.role === 'tool' && !m.name?.trim()) item.name = 'Tool name required.';
    return item;
  });

  e.toolItems = draft.toolConfigs.map((t) => {
    const item: { name?: string; scenario?: string; notes?: string; mockResponse?: string } = {};
    if (!t.name.trim()) item.name = 'Required.';
    if (!t.scenario.trim()) item.scenario = 'Required.';
    if (!t.notes.trim()) item.notes = 'Required.';
    if (!t.mockResponse.trim()) item.mockResponse = 'Required.';
    return item;
  });

  if (evalEnabled) {
    if (draft.evaluations.length === 0) {
      e.evals.general = 'Add at least one evaluator.';
    }
    e.evalItems = draft.evaluations.map((ev) => {
      const item: { evaluator?: string; type?: string; description?: string } = {};
      if (!ev.evaluator.trim()) item.evaluator = 'Required.';
      if (!ev.type.trim()) item.type = 'Required.';
      if (!ev.description.trim()) item.description = 'Required.';
      return item;
    });
  }

  e.metadataCount = countKeys(e.metadata);
  e.modelCount = countKeys(e.model) + countKeys(e.params);
  e.placeholdersCount = countKeys(e.placeholders) + sumNonEmpty(e.placeholderItems);
  e.messagesCount = countKeys(e.messages) + sumNonEmpty(e.messageItems);
  e.toolsCount = sumNonEmpty(e.toolItems);
  e.evalsCount = countKeys(e.evals) + sumNonEmpty(e.evalItems);
  e.hasErrors =
    e.metadataCount +
      e.modelCount +
      e.placeholdersCount +
      e.messagesCount +
      e.toolsCount +
      e.evalsCount >
    0;
  return e;
}
