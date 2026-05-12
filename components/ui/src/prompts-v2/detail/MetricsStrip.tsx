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
import type { PromptDetailMetrics } from './types';

export interface MetricCellProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

export const MetricCell: React.FC<MetricCellProps> = ({ label, value, sub }) => (
  <div style={{ background: 'var(--pl-paper)', padding: '16px 18px' }}>
    <Mono
      size={9.5}
      color="var(--pl-ink-500)"
      style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
    >
      {label}
    </Mono>
    <div
      style={{
        fontFamily: 'var(--pl-mono)',
        fontSize: 22,
        fontWeight: 500,
        color: 'var(--pl-ink-900)',
        letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
        marginTop: 6,
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    {sub != null && (
      <Mono size={10.5} color="var(--pl-ink-500)" style={{ display: 'block', marginTop: 5 }}>
        {sub}
      </Mono>
    )}
  </div>
);

export interface MetricsStripProps {
  metrics: PromptDetailMetrics;
  /** Number of grid columns (default 6). Matches prompt-detail.jsx layout. */
  columns?: number;
}

const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;
const formatThousands = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;

export const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics: m, columns = 6 }) => {
  const cells: MetricCellProps[] = [
    { label: 'Runs', value: m.runs.toLocaleString(), sub: 'dev + CI' },
    {
      label: 'Latency p50',
      value: formatSeconds(m.latencyP50Ms),
      sub: `${m.latencyP50Ms}ms`,
    },
    {
      label: 'Latency p95',
      value: formatSeconds(m.latencyP95Ms),
      sub: `${m.latencyP95Ms}ms`,
    },
    {
      label: 'Tokens in · avg',
      value: m.tokensInAvg.toLocaleString(),
      sub:
        m.tokensInTotal != null
          ? `${formatThousands(m.tokensInTotal)} total`
          : undefined,
    },
    {
      label: 'Tokens out · avg',
      value: m.tokensOutAvg.toLocaleString(),
      sub:
        m.tokensOutTotal != null
          ? `${formatThousands(m.tokensOutTotal)} total`
          : undefined,
    },
    {
      label: 'Last run',
      value: m.lastRun,
      sub:
        [m.lastRunSha, m.lastRunContext].filter(Boolean).join(' · ') || undefined,
    },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 1,
        background: 'var(--pl-ink-200)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {cells.map((c) => (
        <MetricCell key={c.label} label={c.label} value={c.value} sub={c.sub} />
      ))}
    </div>
  );
};
