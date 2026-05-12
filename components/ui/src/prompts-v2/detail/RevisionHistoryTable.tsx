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
import type { PromptRevision } from './types';

const COLUMNS = '0.5fr 0.7fr 1.4fr 1.6fr 0.9fr 0.9fr 0.9fr 0.7fr';
const HEADERS = [
  'Rev',
  'Tag',
  'Author · sha',
  'Message',
  'Runs',
  'p50 / p95',
  'Tokens in/out',
  'Diff',
] as const;

export interface RevisionHistoryTableProps {
  history: readonly PromptRevision[];
  promptName: string;
  /** Called when user clicks the "vs rN" diff link on a revision. */
  onDiffClick?: (left: PromptRevision, right: PromptRevision) => void;
}

export const RevisionHistoryTable: React.FC<RevisionHistoryTableProps> = ({
  history,
  promptName,
  onDiffClick,
}) => {
  const maxP95 = Math.max(1, ...history.map((r) => r.p95 ?? 0));
  const maxTin = Math.max(1, ...history.map((r) => r.tin ?? 0));
  const maxTout = Math.max(1, ...history.map((r) => r.tout ?? 0));

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
            size={9.5}
            color="var(--pl-ink-500)"
            style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
          >
            {h}
          </Mono>
        ))}
      </div>
      {history.map((r, i) => {
        const allOk = r.runs != null && r.ok != null && r.ok === r.runs;
        const previous = history[i + 1];
        return (
          <div
            key={r.rev}
            style={{
              display: 'grid',
              gridTemplateColumns: COLUMNS,
              alignItems: 'center',
              padding: '12px 18px',
              gap: 14,
              borderBottom:
                i === history.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
              background: i === 0 ? 'oklch(0.99 0.02 240)' : 'transparent',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i === 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: 'var(--pl-signal-deep)',
                    boxShadow: '0 0 0 3px oklch(0.94 0.06 240)',
                  }}
                />
              )}
              <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
                {r.rev}
              </Mono>
            </span>
            <Mono size={11} color="var(--pl-ink-700)">
              {r.tag ?? '—'}
            </Mono>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Mono size={11} color="var(--pl-ink-700)">
                {r.author}
              </Mono>
              <span style={{ width: 1, height: 9, background: 'var(--pl-ink-300)' }} />
              <Mono size={11} color="var(--pl-ink-500)">
                {r.sha}
              </Mono>
              <span style={{ width: 1, height: 9, background: 'var(--pl-ink-300)' }} />
              <Mono size={10.5} color="var(--pl-ink-500)">
                {r.when}
              </Mono>
            </span>
            <span
              style={{
                fontSize: 13,
                color: 'var(--pl-ink-800)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.msg}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mono
                size={11.5}
                color="var(--pl-ink-900)"
                style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}
              >
                {r.runs ?? '—'}
              </Mono>
              {r.runs != null && r.ok != null && (
                <Mono
                  size={10}
                  color={allOk ? 'oklch(0.45 0.12 155)' : 'oklch(0.50 0.13 25)'}
                >
                  {allOk ? '✓ all' : `${r.ok}/${r.runs} ok`}
                </Mono>
              )}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  background: 'var(--pl-ink-100)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {r.p95 != null && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${(r.p95 / maxP95) * 100}%`,
                      background: 'oklch(0.86 0.04 240)',
                    }}
                  />
                )}
                {r.p50 != null && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${(r.p50 / maxP95) * 100}%`,
                      background: 'var(--pl-signal-deep)',
                    }}
                  />
                )}
              </span>
              <Mono
                size={10.5}
                color="var(--pl-ink-700)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {r.p50 != null && r.p95 != null
                  ? `${(r.p50 / 1000).toFixed(2)}/${(r.p95 / 1000).toFixed(2)}s`
                  : '—'}
              </Mono>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Mono size={9} color="var(--pl-ink-500)" style={{ width: 14 }}>
                  in
                </Mono>
                <span
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--pl-ink-100)',
                  }}
                >
                  {r.tin != null && (
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${(r.tin / maxTin) * 100}%`,
                        background: 'oklch(0.55 0.13 30)',
                        borderRadius: 999,
                      }}
                    />
                  )}
                </span>
                <Mono
                  size={10}
                  color="var(--pl-ink-700)"
                  style={{ fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}
                >
                  {r.tin ?? '—'}
                </Mono>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Mono size={9} color="var(--pl-ink-500)" style={{ width: 14 }}>
                  out
                </Mono>
                <span
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--pl-ink-100)',
                  }}
                >
                  {r.tout != null && (
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${(r.tout / maxTout) * 100}%`,
                        background: 'oklch(0.55 0.13 75)',
                        borderRadius: 999,
                      }}
                    />
                  )}
                </span>
                <Mono
                  size={10}
                  color="var(--pl-ink-700)"
                  style={{ fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}
                >
                  {r.tout ?? '—'}
                </Mono>
              </span>
            </span>
            <span style={{ textAlign: 'right' }}>
              {previous ? (
                <button
                  type="button"
                  onClick={() => onDiffClick?.(previous, r)}
                  aria-label={`diff ${promptName} ${previous.rev} vs ${r.rev}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: onDiffClick ? 'pointer' : 'default',
                    fontFamily: 'var(--pl-mono)',
                    fontSize: 11,
                    color: 'var(--pl-signal-deep)',
                    borderBottom: '1px dashed var(--pl-signal-deep)',
                  }}
                  disabled={!onDiffClick}
                >
                  vs {previous.rev}
                </button>
              ) : (
                <Mono size={10} color="var(--pl-ink-400)">
                  —
                </Mono>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};
