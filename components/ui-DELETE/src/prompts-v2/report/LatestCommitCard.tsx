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
import type { CommitMeta } from './types';

export interface LatestCommitCardProps {
  commit: CommitMeta;
}

const CI_TONES: Record<NonNullable<CommitMeta['ci']>, { label: string; bg: string; bd: string; dot: string; col: string }> = {
  green: {
    label: 'CI · GREEN',
    bg: 'oklch(0.97 0.04 155)',
    bd: 'oklch(0.86 0.05 155)',
    dot: 'oklch(0.55 0.13 155)',
    col: 'oklch(0.40 0.12 155)',
  },
  yellow: {
    label: 'CI · YELLOW',
    bg: 'oklch(0.97 0.04 75)',
    bd: 'oklch(0.86 0.05 75)',
    dot: 'oklch(0.60 0.13 75)',
    col: 'oklch(0.42 0.10 75)',
  },
  red: {
    label: 'CI · RED',
    bg: 'oklch(0.97 0.04 25)',
    bd: 'oklch(0.86 0.06 25)',
    dot: 'oklch(0.55 0.15 25)',
    col: 'oklch(0.42 0.13 25)',
  },
};

export const LatestCommitCard: React.FC<LatestCommitCardProps> = ({ commit }) => {
  const ci = commit.ci ? CI_TONES[commit.ci] : null;
  return (
    <div
      style={{
        marginTop: 32,
        border: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
        borderRadius: 10,
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 24,
        alignItems: 'flex-start',
      }}
    >
      <Mono
        size={10}
        color="var(--pl-ink-500)"
        style={{ letterSpacing: '0.14em', textTransform: 'uppercase', paddingTop: 4 }}
      >
        Built from
      </Mono>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <Mono size={14} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
            {commit.sha}
          </Mono>
          <span style={{ fontSize: 16, color: 'var(--pl-ink-900)' }}>{commit.message}</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <Mono size={11.5} color="var(--pl-ink-700)">
            {commit.author}
          </Mono>
          {commit.date && (
            <>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11.5} color="var(--pl-ink-500)">
                {commit.date}
                {commit.when ? ` · ${commit.when}` : ''}
              </Mono>
            </>
          )}
          {!commit.date && commit.when && (
            <>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11.5} color="var(--pl-ink-500)">
                {commit.when}
              </Mono>
            </>
          )}
          {commit.pr && (
            <>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <Mono size={11.5} color="var(--pl-ink-500)">
                via PR <span style={{ color: 'var(--pl-signal-deep)' }}>{commit.pr}</span>
              </Mono>
            </>
          )}
          {ci && (
            <>
              <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: ci.bg,
                  border: `1px solid ${ci.bd}`,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: 999, background: ci.dot }} />
                <Mono size={10} color={ci.col} style={{ fontWeight: 500, letterSpacing: '0.06em' }}>
                  {ci.label}
                </Mono>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
