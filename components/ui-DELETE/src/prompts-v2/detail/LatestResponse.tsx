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

export interface LatestResponseProps {
  exec: PromptDetailExecution;
  model: string;
}


export const LatestResponse: React.FC<LatestResponseProps> = ({ exec, model }) => {
  const kvRows: [string, React.ReactNode][] = [
    ['rev',     <Mono key="rev" size={11} color="var(--pl-ink-900)">{exec.rev}</Mono>],
    ['author',  <Mono key="author" size={11} color="var(--pl-ink-700)">{exec.author}</Mono>],
    ['context', <Mono key="context" size={11} color="var(--pl-ink-700)">{exec.context}</Mono>],
    ['fixture', <Mono key="fixture" size={11} color="var(--pl-ink-700)" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exec.fixture}</Mono>],
    ['model',   <Mono key="model" size={11} color="var(--pl-ink-700)">{model}</Mono>],
    ['latency', (
      <Mono key="latency" size={11} color="var(--pl-ink-900)" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {(exec.ms / 1000).toFixed(2)}s
      </Mono>
    )],
    ['tokens', (
      <Mono key="tokens" size={11} color="var(--pl-ink-700)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {exec.tin.toLocaleString()} in · {exec.tout.toLocaleString()} out
      </Mono>
    )],
    ['outcome', (
      <span key="outcome" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: 999,
          background: exec.ok ? 'oklch(0.55 0.13 155)' : 'oklch(0.55 0.15 25)',
        }} />
        <Mono size={11} color={exec.ok ? 'oklch(0.40 0.12 155)' : 'oklch(0.45 0.13 25)'} style={{ fontWeight: 500 }}>
          {exec.ok ? 'ok' : (exec.error ?? 'failed')}
        </Mono>
      </span>
    )],
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 10,
      background: 'var(--pl-paper)',
      overflow: 'hidden',
    }}>
      {/* Left sidebar — meta + input */}
      <div style={{
        padding: '18px 20px',
        background: 'var(--pl-canvas)',
        borderRight: '1px solid var(--pl-ink-200)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div>
          <Mono size={9.5} color="var(--pl-signal-deep)" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
            most recent run
          </Mono>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Mono size={13} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>{exec.id}</Mono>
            <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
            <Mono size={11} color="var(--pl-ink-500)">{exec.when}</Mono>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', rowGap: 6, columnGap: 10 }}>
          {kvRows.map(([k, v]) => (
            <React.Fragment key={k}>
              <Mono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', paddingTop: 1 }}>{k}</Mono>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>

        {exec.input && (
          <div>
            <Mono size={9.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
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
              {exec.input}
            </div>
          </div>
        )}
      </div>

      {/* Right — response text */}
      <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            padding: '3px 8px',
            background: 'oklch(0.97 0.03 30)',
            border: '1px solid oklch(0.86 0.04 30)',
            color: 'oklch(0.45 0.13 30)',
            fontFamily: 'var(--pl-mono)',
            fontSize: 10.5,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            borderRadius: 4,
            fontWeight: 500,
          }}>
            assistant
          </span>
          <Mono size={11} color="var(--pl-ink-500)">response · {exec.tout} tok</Mono>
        </div>
        <div style={{
          padding: '14px 16px',
          background: 'var(--pl-canvas)',
          border: '1px solid var(--pl-ink-200)',
          borderRadius: 6,
          fontFamily: 'var(--pl-display)',
          fontSize: 13.5,
          lineHeight: 1.65,
          color: 'var(--pl-ink-900)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1,
        }}>
          {exec.response
            ? renderResponseText(exec.response)
            : <Mono size={11} color="var(--pl-ink-500)">no response captured</Mono>}
        </div>
      </div>
    </div>
  );
};

