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
import { renderResponseText } from './ResponseText';

const COLUMNS = '14px 0.9fr 0.5fr 0.7fr 0.9fr 1.3fr 0.7fr 0.7fr 0.6fr 1.0fr';
const HEADERS = [
  '',
  'When',
  'Rev',
  'Author',
  'Context',
  'Fixture · response',
  'Latency',
  'Tokens in',
  'Tokens out',
  'Outcome',
] as const;

export interface ExecutionsTableProps {
  rows: readonly PromptDetailExecution[];
  /**
   * Optional execution id to highlight briefly — used when a fresh run was
   * just kicked off from the detail-page Run CTA. Callers (e.g. the Run
   * toast action) supply the id; the row pulses against the cyan signal
   * background for ~3 seconds.
   */
  highlightedId?: string | null;
}

export const executionRowDomId = (id: string) => `execution-row-${id}`;

export const ExecutionsTable: React.FC<ExecutionsTableProps> = ({ rows, highlightedId }) => {
  const [openId, setOpenId] = React.useState<string | null>(
    rows[0]?.response ? rows[0].id : null,
  );

  return (
    <div
      style={{
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--pl-paper)',
      }}
    >
      {/* Header row */}
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

      {rows.map((r, i) => {
        const isHighlighted = highlightedId === r.id;
        const isOpen = openId === r.id;
        const isLast = i === rows.length - 1;
        const responsePreview = r.response
          ? r.response.replace(/\s+/g, ' ').replace(/\*\*/g, '').replace(/\[[^\]]*\]/g, '').trim()
          : null;

        return (
          <React.Fragment key={r.id}>
            {/* Summary row — clickable to expand */}
            <div
              id={executionRowDomId(r.id)}
              data-execution-id={r.id}
              data-testid={`execution-row-${r.id}`}
              onClick={() => setOpenId(isOpen ? null : r.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: COLUMNS,
                alignItems: 'center',
                padding: '10px 18px',
                gap: 12,
                borderBottom: isOpen || isLast ? 'none' : '1px solid var(--pl-ink-200)',
                background: isHighlighted
                  ? 'color-mix(in oklch, var(--pl-signal) 12%, var(--pl-paper))'
                  : isOpen
                    ? 'oklch(0.99 0.02 240)'
                    : 'transparent',
                transition: 'background 600ms ease',
                scrollMarginTop: 80,
                cursor: 'pointer',
              }}
            >
              {/* Expand chevron */}
              <Mono
                size={11}
                color="var(--pl-ink-500)"
                style={{
                  transform: isOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform .12s',
                  display: 'inline-block',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                ›
              </Mono>

              <Mono size={11} color="var(--pl-ink-700)">{r.when}</Mono>
              <Mono size={11} color="var(--pl-ink-500)">{r.rev}</Mono>
              <Mono size={11} color="var(--pl-ink-700)">{r.author}</Mono>
              <Mono size={10.5} color="var(--pl-ink-600)">{r.context}</Mono>

              {/* Fixture + response preview stacked */}
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <Mono
                  size={10.5}
                  color="var(--pl-ink-700)"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {r.fixture}
                </Mono>
                {responsePreview && (
                  <span style={{
                    fontSize: 11,
                    color: r.ok ? 'var(--pl-ink-500)' : 'oklch(0.45 0.13 25)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {responsePreview}
                  </span>
                )}
              </span>

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

            {/* Expanded panel — input + full response */}
            {isOpen && (
              <div
                style={{
                  padding: '0 18px 16px',
                  background: 'oklch(0.99 0.02 240)',
                  borderBottom: isLast ? 'none' : '1px solid var(--pl-ink-200)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: 14,
                    marginTop: 4,
                  }}
                >
                  {/* Input */}
                  <div>
                    <Mono
                      size={9.5}
                      color="var(--pl-ink-500)"
                      style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
                    >
                      user_message
                    </Mono>
                    <div style={{
                      padding: '8px 10px',
                      background: 'oklch(0.97 0.03 240)',
                      border: '1px solid oklch(0.86 0.04 240)',
                      borderLeft: '2px solid var(--pl-signal-deep)',
                      borderRadius: 5,
                      fontFamily: 'var(--pl-mono)',
                      fontSize: 11.5,
                      lineHeight: 1.55,
                      color: 'var(--pl-signal-ink)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {r.input ?? '—'}
                    </div>
                  </div>

                  {/* Response */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Mono
                        size={9.5}
                        color="var(--pl-ink-500)"
                        style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
                      >
                        response
                      </Mono>
                      <Mono size={10} color="var(--pl-ink-500)">{r.tout} tok</Mono>
                    </div>
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--pl-paper)',
                      border: '1px solid var(--pl-ink-200)',
                      borderRadius: 6,
                      fontFamily: 'var(--pl-display)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--pl-ink-900)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {r.response
                        ? renderResponseText(r.response)
                        : <Mono size={11} color="var(--pl-ink-500)">no response captured</Mono>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
