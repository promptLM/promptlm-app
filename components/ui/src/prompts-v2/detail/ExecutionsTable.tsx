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
import type { PromptDetailExecution } from './types';

const COLUMNS = '0.9fr 0.5fr 0.7fr 0.9fr 1.4fr 0.7fr 0.7fr 0.6fr 1.2fr';
const HEADERS = [
  'When',
  'Rev',
  'Author',
  'Context',
  'Fixture',
  'Latency',
  'Tokens in',
  'Tokens out',
  'Outcome',
] as const;

export interface ExecutionsTableProps {
  rows: readonly PromptDetailExecution[];
}

export const ExecutionsTable: React.FC<ExecutionsTableProps> = ({ rows }) => (
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
        gap: 12,
      }}
    >
      {HEADERS.map((h) => (
        <Mono
          key={h}
          size={9.5}
          color="var(--pl-ink-500)"
          style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
        >
          {h}
        </Mono>
      ))}
    </div>
    {rows.map((r, i) => (
      <div
        key={r.id}
        style={{
          display: 'grid',
          gridTemplateColumns: COLUMNS,
          alignItems: 'center',
          padding: '10px 18px',
          gap: 12,
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}
      >
        <Mono size={11} color="var(--pl-ink-700)">
          {r.when}
        </Mono>
        <Mono size={11} color="var(--pl-ink-500)">
          {r.rev}
        </Mono>
        <Mono size={11} color="var(--pl-ink-700)">
          {r.author}
        </Mono>
        <Mono size={10.5} color="var(--pl-ink-600)">
          {r.context}
        </Mono>
        <Mono
          size={10.5}
          color="var(--pl-ink-700)"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {r.fixture}
        </Mono>
        <Mono
          size={11}
          color={r.ms > 4000 ? 'oklch(0.50 0.13 25)' : 'var(--pl-ink-800)'}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {(r.ms / 1000).toFixed(2)}s
        </Mono>
        <Mono size={11} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {r.tin.toLocaleString()}
        </Mono>
        <Mono size={11} color="var(--pl-ink-800)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {r.tout.toLocaleString()}
        </Mono>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: r.ok ? 'oklch(0.55 0.13 155)' : 'oklch(0.55 0.15 25)',
            }}
          />
          <Mono size={10.5} color={r.ok ? 'oklch(0.40 0.12 155)' : 'oklch(0.45 0.13 25)'}>
            {r.ok ? 'ok' : r.error ?? 'failed'}
          </Mono>
        </span>
      </div>
    ))}
  </div>
);
