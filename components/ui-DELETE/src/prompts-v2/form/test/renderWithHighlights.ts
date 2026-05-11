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

import * as React from 'react';

/**
 * Tokenize `template` against `${start}name${end}` placeholders and produce
 * an array of React nodes. Resolved placeholders inline as text; unresolved
 * placeholders are wrapped in a yellow-highlight `<span>` so the user can
 * spot which slots are still unfilled.
 *
 * Pure: returns plain React elements; never uses `dangerouslySetInnerHTML`.
 */

const escapeRegex = (raw: string): string =>
  raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HIGHLIGHT_STYLE: React.CSSProperties = {
  background: 'oklch(0.94 0.10 95)',
  color: 'oklch(0.40 0.10 75)',
  padding: '0 3px',
  borderRadius: 3,
  fontFamily: 'var(--pl-mono)',
  fontSize: '0.95em',
};

export interface RenderWithHighlightsOptions {
  startPattern?: string;
  endPattern?: string;
  values: Readonly<Record<string, string>>;
}

export const renderWithHighlights = (
  template: string,
  { startPattern = '{{', endPattern = '}}', values }: RenderWithHighlightsOptions,
): React.ReactNode[] => {
  const re = new RegExp(
    `${escapeRegex(startPattern)}\\s*([\\w.-]+)\\s*${escapeRegex(endPattern)}`,
    'g',
  );

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    const [whole, name] = match;
    if (match.index > cursor) {
      nodes.push(template.slice(cursor, match.index));
    }
    const v = values[name];
    if (v === undefined || v === '') {
      nodes.push(
        React.createElement(
          'span',
          { key: `ph-${key += 1}`, style: HIGHLIGHT_STYLE, 'data-placeholder': name },
          whole,
        ),
      );
    } else {
      nodes.push(v);
    }
    cursor = match.index + whole.length;
  }
  if (cursor < template.length) {
    nodes.push(template.slice(cursor));
  }

  return nodes;
};
