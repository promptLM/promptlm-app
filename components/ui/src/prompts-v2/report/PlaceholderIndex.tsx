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
import { Mono, PlaceholderToken } from '../atoms';
import type { PlaceholderIndexRow } from './types';

const COLUMNS = '1.1fr 0.5fr 2fr';
const HEADERS = ['Variable', 'Used by', 'In'] as const;

export interface PlaceholderIndexProps {
  rows: readonly PlaceholderIndexRow[];
}

/** Every variable referenced by every prompt at HEAD. */
export const PlaceholderIndex: React.FC<PlaceholderIndexProps> = ({ rows }) => (
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
    {rows.map((row, i) => (
      <div
        key={row.name}
        style={{
          display: 'grid',
          gridTemplateColumns: COLUMNS,
          alignItems: 'center',
          padding: '11px 18px',
          gap: 14,
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}
      >
        <PlaceholderToken name={row.name} style={{ width: 'fit-content' }} />
        <Mono
          size={12}
          color="var(--pl-ink-800)"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {row.used}
        </Mono>
        <Mono size={11} color="var(--pl-ink-600)">
          {row.in.join(', ')}
        </Mono>
      </div>
    ))}
  </div>
);
