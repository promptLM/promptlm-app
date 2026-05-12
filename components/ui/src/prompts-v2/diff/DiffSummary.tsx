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
import type { DiffPromptSpec } from './types';

export interface DiffSummaryProps {
  /** Baseline (left) spec; null when corpus lookup misses. */
  A: DiffPromptSpec | null | undefined;
  /** Compare (right) spec. */
  B: DiffPromptSpec | null | undefined;
}

const sectionDelta = (
  label: string,
  leftLen: number,
  rightLen: number,
  unit = '',
): { label: string; from: number; to: number; unit: string; tone: 'same' | 'edit' | 'add' | 'del' } => {
  let tone: 'same' | 'edit' | 'add' | 'del' = 'same';
  if (rightLen > leftLen) tone = 'add';
  else if (rightLen < leftLen) tone = 'del';
  else if (rightLen !== leftLen) tone = 'edit';
  return { label, from: leftLen, to: rightLen, unit, tone };
};

const TONE_COLOR: Record<'same' | 'edit' | 'add' | 'del', string> = {
  same: 'var(--pl-ink-700)',
  edit: 'var(--pl-signal-deep)',
  add: 'oklch(0.40 0.12 155)',
  del: 'oklch(0.45 0.13 25)',
};

/**
 * Compact stats bar above the field-level diff. Five cells: messages,
 * placeholders, rules, model, version. Each shows from → to with a colored
 * delta, except model/version which show a single value when unchanged.
 */
export const DiffSummary: React.FC<DiffSummaryProps> = ({ A, B }) => {
  if (!A && !B) {
    return (
      <div
        style={{
          padding: '12px 16px',
          border: '1px dashed var(--pl-ink-300)',
          borderRadius: 8,
          color: 'var(--pl-ink-600)',
          fontSize: 13,
        }}
      >
        Select two prompt revisions to compare.
      </div>
    );
  }

  const cells = [
    sectionDelta('messages', A?.messages?.length ?? 0, B?.messages?.length ?? 0),
    sectionDelta(
      'placeholders',
      A?.placeholders?.length ?? 0,
      B?.placeholders?.length ?? 0,
    ),
    sectionDelta('rules', A?.rules?.length ?? 0, B?.rules?.length ?? 0),
  ];

  const modelChanged =
    (A?.request.vendor ?? '') + (A?.request.model ?? '') !==
    (B?.request.vendor ?? '') + (B?.request.model ?? '');

  const versionChanged = A?.version !== B?.version;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 1,
        background: 'var(--pl-ink-200)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {cells.map((cell) => (
        <div key={cell.label} style={{ background: 'var(--pl-paper)', padding: '14px 18px' }}>
          <Mono
            size={9.5}
            color="var(--pl-ink-500)"
            style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            {cell.label}
          </Mono>
          <div
            style={{
              fontFamily: 'var(--pl-mono)',
              fontSize: 18,
              fontWeight: 500,
              color: TONE_COLOR[cell.tone],
              fontVariantNumeric: 'tabular-nums',
              marginTop: 6,
              lineHeight: 1.1,
            }}
          >
            {cell.from === cell.to ? cell.to : `${cell.from} → ${cell.to}`}
            {cell.unit}
          </div>
        </div>
      ))}
      <div style={{ background: 'var(--pl-paper)', padding: '14px 18px' }}>
        <Mono
          size={9.5}
          color="var(--pl-ink-500)"
          style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          model
        </Mono>
        <div
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 13,
            fontWeight: 500,
            color: TONE_COLOR[modelChanged ? 'edit' : 'same'],
            marginTop: 6,
            lineHeight: 1.2,
          }}
        >
          {modelChanged
            ? `${A?.request.model ?? '—'} → ${B?.request.model ?? '—'}`
            : (B?.request.model ?? A?.request.model ?? '—')}
        </div>
      </div>
      <div style={{ background: 'var(--pl-paper)', padding: '14px 18px' }}>
        <Mono
          size={9.5}
          color="var(--pl-ink-500)"
          style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          version
        </Mono>
        <div
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 18,
            fontWeight: 500,
            color: TONE_COLOR[versionChanged ? 'edit' : 'same'],
            marginTop: 6,
            lineHeight: 1.1,
          }}
        >
          {versionChanged ? `${A?.version ?? '—'} → ${B?.version ?? '—'}` : (B?.version ?? '—')}
        </div>
      </div>
    </div>
  );
};
