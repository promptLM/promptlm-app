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
import type { SpecChipTone } from './types';

const TONES: Record<
  SpecChipTone,
  { bg: string; bd: string; col: string; glyph: string }
> = {
  add: {
    bg: 'oklch(0.97 0.04 155)',
    bd: 'oklch(0.86 0.05 155)',
    col: 'oklch(0.36 0.10 155)',
    glyph: '+',
  },
  del: {
    bg: 'oklch(0.97 0.04 25)',
    bd: 'oklch(0.86 0.06 25)',
    col: 'oklch(0.40 0.13 25)',
    glyph: '−',
  },
  edit: {
    bg: 'oklch(0.97 0.03 240)',
    bd: 'oklch(0.86 0.04 240)',
    col: 'var(--pl-signal-deep)',
    glyph: '~',
  },
  meta: {
    bg: 'var(--pl-ink-100)',
    bd: 'var(--pl-ink-200)',
    col: 'var(--pl-ink-700)',
    glyph: '·',
  },
};

export interface SpecChipProps {
  /** Field path or short label. */
  field: string;
  /** Description of the change. */
  description: string;
  tone?: SpecChipTone;
}

/** Pill-style change descriptor used inside ChangeTimeline entries. */
export const SpecChip: React.FC<SpecChipProps> = ({ field, description, tone = 'meta' }) => {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 999,
        background: t.bg,
        border: `1px solid ${t.bd}`,
        fontFamily: 'var(--pl-mono)',
        fontSize: 11,
        color: t.col,
      }}
    >
      <span style={{ fontWeight: 600 }}>{t.glyph}</span>
      <span style={{ fontWeight: 500 }}>{field}</span>
      <span style={{ color: 'var(--pl-ink-600)' }}>{description}</span>
    </span>
  );
};
