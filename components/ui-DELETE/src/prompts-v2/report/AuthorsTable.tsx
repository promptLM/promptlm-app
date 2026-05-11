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
import { Mono } from '../atoms';
import type { AuthorRow } from './types';

export interface AuthorsTableProps {
  authors: readonly AuthorRow[];
}

const HEADERS = ['Author', 'Email', 'Commits', 'Prompts', 'Activity', 'Last touched'] as const;
const COLUMNS = '1.1fr 1.4fr 80px 80px 1.2fr 1fr';

/** git shortlog -sn — committers + reach + activity bar. */
export const AuthorsTable: React.FC<AuthorsTableProps> = ({ authors }) => {
  const max = Math.max(1, ...authors.map((a) => a.commits));
  return (
    <div
      style={{
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--pl-paper)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLUMNS,
          padding: '10px 18px',
          background: 'var(--pl-canvas)',
          borderBottom: '1px solid var(--pl-ink-200)',
          gap: 14,
        }}
      >
        {HEADERS.map((h) => (
          <Mono
            key={h}
            size={10}
            color="var(--pl-ink-500)"
            style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
          >
            {h}
          </Mono>
        ))}
      </div>
      {authors.map((a, i) => (
        <div
          key={a.email || a.name}
          style={{
            display: 'grid',
            gridTemplateColumns: COLUMNS,
            alignItems: 'center',
            padding: '12px 18px',
            gap: 14,
            borderBottom: i === authors.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
          }}
        >
          <Mono size={12.5} color="var(--pl-ink-900)">
            {a.name}
          </Mono>
          <Mono size={11} color="var(--pl-ink-500)">
            {a.email}
          </Mono>
          <Mono
            size={12}
            color="var(--pl-ink-800)"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {a.commits}
          </Mono>
          <Mono
            size={12}
            color="var(--pl-ink-800)"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {a.prompts}
          </Mono>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: 'var(--pl-ink-100)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${(a.commits / max) * 100}%`,
                  background: 'var(--pl-signal-deep)',
                }}
              />
            </span>
            <Mono size={10.5} color="var(--pl-ink-500)">
              {a.since}
            </Mono>
          </span>
          <Mono size={11} color="var(--pl-ink-700)">
            {a.last}
          </Mono>
        </div>
      ))}
    </div>
  );
};
