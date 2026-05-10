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
 * Inline renderer for LLM response text. Handles:
 *   **bold** → <strong>
 *   [source:section] or [a:b, c:d] → cyan chip(s)
 */
export function renderResponseText(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];

  // First pass: split on **bold** markers
  const bolded: Array<{ kind: 'plain' | 'bold'; text: string }> = [];
  let rest = text;
  let bi = 0;
  while (true) {
    const m = rest.match(/\*\*([^*]+)\*\*/);
    if (!m) { bolded.push({ kind: 'plain', text: rest }); break; }
    if (m.index! > 0) bolded.push({ kind: 'plain', text: rest.slice(0, m.index) });
    bolded.push({ kind: 'bold', text: m[1] });
    rest = rest.slice(m.index! + m[0].length);
    if (++bi > 200) break;
  }

  // Second pass on each plain piece: extract [source:section] citation chips
  bolded.forEach((piece, idx) => {
    if (piece.kind === 'bold') {
      out.push(
        <strong key={`b${idx}`} style={{ fontWeight: 600, color: 'var(--pl-ink-900)' }}>
          {piece.text}
        </strong>,
      );
      return;
    }
    let s = piece.text;
    let ci = 0;
    while (s.length) {
      const cm = s.match(
        /\[([a-z][a-z0-9_-]*:[a-z0-9_.\-]+(?:\s*,\s*[a-z][a-z0-9_-]*:[a-z0-9_.\-]+)*)\]/i,
      );
      if (!cm) {
        out.push(<React.Fragment key={`p${idx}-${ci}`}>{s}</React.Fragment>);
        break;
      }
      if (cm.index! > 0) {
        out.push(<React.Fragment key={`p${idx}-${ci}t`}>{s.slice(0, cm.index)}</React.Fragment>);
      }
      const tokens = cm[1].split(/\s*,\s*/);
      out.push(
        <span
          key={`p${idx}-${ci}c`}
          style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, verticalAlign: 'baseline' }}
        >
          {tokens.map((tok, ti) => (
            <span
              key={ti}
              style={{
                fontFamily: 'var(--pl-mono)',
                fontSize: 10.5,
                padding: '1px 6px',
                borderRadius: 3,
                background: 'oklch(0.97 0.03 240)',
                border: '1px solid oklch(0.86 0.04 240)',
                color: 'var(--pl-signal-deep)',
                verticalAlign: '1px',
              }}
            >
              {tok}
            </span>
          ))}
        </span>,
      );
      s = s.slice(cm.index! + cm[0].length);
      if (++ci > 200) break;
    }
  });

  return out;
}
