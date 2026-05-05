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
import type { PromptDetailPlaceholder } from './types';

export interface PlaceholderTableProps {
  placeholders: readonly PromptDetailPlaceholder[];
}

const HEADERS = ['Variable', 'Type', 'Required', 'Example'] as const;

export const PlaceholderTable: React.FC<PlaceholderTableProps> = ({ placeholders }) => (
  <div
    style={{
      borderTop: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}
  >
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr 0.5fr 1.5fr',
        padding: '8px 16px',
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
    {placeholders.map((ph, i) => (
      <div
        key={ph.name}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr 0.5fr 1.5fr',
          alignItems: 'center',
          padding: '10px 16px',
          gap: 12,
          borderBottom:
            i === placeholders.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
        }}
      >
        <PlaceholderToken name={ph.name} style={{ width: 'fit-content' }} />
        <Mono size={11} color="var(--pl-ink-700)">
          {ph.type}
        </Mono>
        <Mono
          size={11}
          color={ph.required ? 'oklch(0.45 0.13 25)' : 'var(--pl-ink-500)'}
        >
          {ph.required ? 'required' : 'optional'}
        </Mono>
        <Mono size={11} color="var(--pl-ink-600)">
          {ph.example ?? ph.defaultValue ?? '—'}
        </Mono>
      </div>
    ))}
  </div>
);
