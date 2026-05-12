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
 * Request-shape hash for the Q5 lock on the Test tab.
 *
 * The Test tab's live `executions[]` strip resets when the *shape* of the
 * request changes — model / snapshot / parameters / messages / placeholder
 * list-shape (renames, adds, removes). Placeholder *value* edits and form
 * metadata (name, group, description, eval / MCP / repo url) do not reset
 * history.
 *
 * The hash is deliberately stable, deterministic, and content-only:
 *   - JSON-canonicalised by sorted keys at every level so object key order
 *     can't influence the result;
 *   - placeholder list reduced to a sorted [name, type, required] tuple so
 *     reorders and value edits don't trigger a reset, but renames/adds/
 *     removes/type changes do;
 *   - djb2 string hash so the result is short and readable in dev tools.
 */

import type { FormPlaceholdersConfig, FormRequest } from './types';

export interface RequestShapeInputs {
  request: FormRequest;
  placeholders: FormPlaceholdersConfig;
}

const sortedJson = (value: unknown): string => {
  if (value === null || value === undefined) return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return '[' + value.map(sortedJson).join(',') + ']';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + sortedJson(obj[k])).join(',') + '}';
  }
  return JSON.stringify(value);
};

const djb2 = (input: string): string => {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};

/**
 * Produce a deterministic 8-character hex hash representing the request
 * shape. Two `RequestShapeInputs` produce the same hash iff their request
 * shape (per the Q5 contract) is equivalent.
 */
export const requestShapeHash = ({
  request,
  placeholders,
}: RequestShapeInputs): string => {
  const placeholderShape = [...placeholders.list]
    .map((p) => ({ name: p.name, type: p.type, required: p.required }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const payload = sortedJson({
    request: {
      type: request.type,
      vendor: request.vendor,
      model: request.model,
      modelSnapshot: request.modelSnapshot,
      parameters: request.parameters,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name ?? null,
      })),
    },
    placeholderShape,
    patterns: {
      start: placeholders.startPattern,
      end: placeholders.endPattern,
    },
  });

  return djb2(payload);
};
