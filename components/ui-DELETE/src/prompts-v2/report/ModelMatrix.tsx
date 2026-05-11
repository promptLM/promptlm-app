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
import type { ModelMatrixRow } from './types';

const COLUMNS = '0.6fr 1.4fr 60px 1fr';
const HEADERS = ['Vendor', 'Model', 'Prompts', 'Share'] as const;

const VENDOR_COLOR: Record<string, string> = {
  anthropic: 'oklch(0.55 0.13 30)',
  openai: 'var(--pl-signal-deep)',
};

const colorFor = (vendor: string): string =>
  VENDOR_COLOR[vendor] ?? 'var(--pl-ink-500)';

export interface ModelMatrixProps {
  models: readonly ModelMatrixRow[];
  /** Total prompts in the corpus, used for the "X of Y" share label. */
  totalPrompts: number;
}

export const ModelMatrix: React.FC<ModelMatrixProps> = ({ models, totalPrompts }) => {
  const max = Math.max(1, ...models.map((m) => m.count));
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
      {models.map((m, i) => {
        const color = colorFor(m.vendor);
        return (
          <div
            key={`${m.vendor}-${m.model}`}
            style={{
              display: 'grid',
              gridTemplateColumns: COLUMNS,
              alignItems: 'center',
              padding: '12px 18px',
              gap: 14,
              borderBottom: i === models.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 2, background: color }}
              />
              <Mono size={12} color="var(--pl-ink-800)">
                {m.vendor}
              </Mono>
            </span>
            <Mono size={12.5} color="var(--pl-ink-900)">
              {m.model}
            </Mono>
            <Mono
              size={12}
              color="var(--pl-ink-800)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {m.count}
            </Mono>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                    width: `${(m.count / max) * 100}%`,
                    background: color,
                  }}
                />
              </span>
              <Mono size={10.5} color="var(--pl-ink-600)">
                {m.count} of {totalPrompts}
              </Mono>
            </span>
          </div>
        );
      })}
    </div>
  );
};
