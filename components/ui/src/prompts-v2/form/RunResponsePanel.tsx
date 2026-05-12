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
import { FormMono } from './atoms';
import { renderResponseText } from '../detail/ResponseText';

export interface EditorRunRecord {
  /** Human-readable relative time, e.g. "2 min ago". */
  when: string;
  /** Whether the run was triggered by Save or an explicit Run action. */
  kind: 'run' | 'save';
  /** Wall time in milliseconds. */
  ms: number;
  /** Input token count. */
  tin: number;
  /** Output token count. */
  tout: number;
  /** Whether the run succeeded. */
  ok: boolean;
  /** Rev label, e.g. "r34 · uncommitted". */
  rev: string;
  /** The user_message / primary placeholder value used for this run. */
  input?: string;
  /** The assistant response text. */
  response?: string;
  /** Error message when ok is false. */
  error?: string;
}

export interface RunResponsePanelProps {
  /** Current run state — drives the spinner vs. result display. */
  runState: 'idle' | 'running';
  /** The last completed run record. Null/undefined = no run yet. */
  lastRun?: EditorRunRecord | null;
  /** Vendor + model label shown while running, e.g. "openai/gpt-4.1". */
  modelLabel?: string;
}

const judgeBtn: React.CSSProperties = {
  height: 26,
  padding: '0 10px',
  fontSize: 12,
  background: 'var(--pl-paper)',
  border: '1px solid var(--pl-ink-200)',
  borderRadius: 5,
  cursor: 'pointer',
  color: 'var(--pl-ink-700)',
  fontFamily: 'var(--pl-display)',
};

export const RunResponsePanel: React.FC<RunResponsePanelProps> = ({
  runState,
  lastRun,
  modelLabel,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const running = runState === 'running';
  const empty = !lastRun && !running;

  if (empty) {
    return (
      <div style={{
        marginTop: 18,
        padding: '20px 22px',
        borderRadius: 8,
        border: '1px dashed var(--pl-ink-300)',
        background: 'var(--pl-paper)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <span style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'var(--pl-ink-100)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--pl-mono)',
          fontSize: 13,
          color: 'var(--pl-ink-500)',
        }}>▷</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--pl-ink-800)', fontWeight: 500 }}>
            No response yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--pl-ink-600)', marginTop: 2 }}>
            Click <strong>Run</strong> in the header to execute this prompt and see the model's response inline.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 18,
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 8,
      background: 'var(--pl-paper)',
      overflow: 'hidden',
      boxShadow: running ? '0 0 0 2px oklch(0.94 0.06 240)' : 'none',
      transition: 'box-shadow .2s',
    }}>
      {/* Header strip */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--pl-canvas)',
        borderBottom: collapsed ? 'none' : '1px solid var(--pl-ink-200)',
      }}>
        <FormMono size={10} color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
          {running
            ? 'running…'
            : lastRun?.kind === 'save'
              ? 'response · saved & re-ran'
              : 'response'}
        </FormMono>

        {!running && lastRun && (
          <>
            <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
            <FormMono size={10.5} color="var(--pl-ink-500)">{lastRun.when}</FormMono>
            <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
            <FormMono
              size={10.5}
              color={lastRun.ms > 4000 ? 'oklch(0.50 0.13 25)' : 'var(--pl-ink-700)'}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {(lastRun.ms / 1000).toFixed(2)}s
            </FormMono>
            <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
            <FormMono size={10.5} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {lastRun.tin.toLocaleString()} in · {lastRun.tout.toLocaleString()} out
            </FormMono>
            <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999,
                background: lastRun.ok ? 'oklch(0.55 0.13 155)' : 'oklch(0.55 0.15 25)',
              }} />
              <FormMono size={10.5} color={lastRun.ok ? 'oklch(0.40 0.12 155)' : 'oklch(0.45 0.13 25)'} style={{ fontWeight: 500 }}>
                {lastRun.ok ? 'ok' : 'failed'}
              </FormMono>
            </span>
          </>
        )}

        <div style={{ flex: 1 }} />

        {!running && lastRun && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--pl-mono)',
              fontSize: 11,
              color: 'var(--pl-ink-500)',
            }}
          >
            {collapsed ? 'show' : 'hide'}
          </button>
        )}
      </div>

      {!collapsed && (
        running ? (
          <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: '2px solid var(--pl-ink-200)',
              borderTopColor: 'var(--pl-signal-deep)',
              animation: 'pl-run-spin 0.8s linear infinite',
              flexShrink: 0,
            }} />
            <FormMono size={12} color="var(--pl-ink-700)">
              executing {modelLabel ?? 'model'}…
            </FormMono>
            <style>{`@keyframes pl-run-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : lastRun ? (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr' }}>
            {/* Input column */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--pl-canvas)',
              borderRight: '1px solid var(--pl-ink-200)',
            }}>
              <FormMono
                size={9.5}
                color="var(--pl-ink-500)"
                style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
              >
                user_message
              </FormMono>
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
                {lastRun.input ?? '—'}
              </div>
              <FormMono size={10} color="var(--pl-ink-500)" style={{ display: 'block', marginTop: 10 }}>
                rev {lastRun.rev}
              </FormMono>
            </div>

            {/* Response column */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  padding: '2px 7px',
                  background: 'oklch(0.97 0.03 30)',
                  border: '1px solid oklch(0.86 0.04 30)',
                  color: 'oklch(0.45 0.13 30)',
                  fontFamily: 'var(--pl-mono)',
                  fontSize: 10,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  borderRadius: 3,
                  fontWeight: 500,
                }}>
                  assistant
                </span>
                <FormMono size={10.5} color="var(--pl-ink-500)">{lastRun.tout} tok</FormMono>
              </div>

              <div style={{
                padding: '12px 14px',
                background: 'var(--pl-canvas)',
                border: '1px solid var(--pl-ink-200)',
                borderRadius: 6,
                fontFamily: 'var(--pl-display)',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--pl-ink-900)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {lastRun.response
                  ? renderResponseText(lastRun.response)
                  : <FormMono size={11} color={lastRun.ok ? 'var(--pl-ink-500)' : 'oklch(0.45 0.13 25)'}>
                      {lastRun.error ?? 'no response captured'}
                    </FormMono>}
              </div>

              {/* Judge bar */}
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                border: '1px solid var(--pl-ink-200)',
                borderRadius: 6,
                background: 'var(--pl-paper)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  judge
                </FormMono>
                <button style={judgeBtn}>👍 looks good</button>
                <button style={judgeBtn}>👎 needs work</button>
                <span style={{ flex: 1 }} />
                <FormMono size={10.5} color="var(--pl-ink-500)">
                  judgment saved with the run · powers diffing
                </FormMono>
              </div>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};
