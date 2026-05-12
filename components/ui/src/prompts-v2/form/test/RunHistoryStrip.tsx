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
import { FormMono, GhostButton } from '../atoms';
import type { TestRunRecord, TestRunStatus } from './types';

const relativeTime = (iso: string, now = Date.now()): string => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const dMin = Math.round((now - t) / 60_000);
  if (dMin < 1) return 'just now';
  if (dMin < 60) return `${dMin}m ago`;
  const dH = Math.round(dMin / 60);
  if (dH < 24) return `${dH}h ago`;
  const dD = Math.round(dH / 24);
  return `${dD}d ago`;
};

const dotColor = (status: TestRunStatus): string =>
  status === 'ok' ? 'var(--pl-ok)' : status === 'error' ? 'var(--pl-fail)' : 'var(--pl-warn)';

export interface RunHistoryStripProps {
  executions: ReadonlyArray<TestRunRecord>;
  activeId: string | null;
  setActiveId: (id: string) => void;
  /** Show the empty state CTA when history is empty (no banner). */
  emptyState?: boolean;
  onViewHistory: () => void;
}

export const RunHistoryStrip: React.FC<RunHistoryStripProps> = ({
  executions,
  activeId,
  setActiveId,
  emptyState,
  onViewHistory,
}) => (
  <footer
    data-testid="test-tab-run-history-strip"
    style={{
      borderTop: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      overflowX: 'auto',
    }}
  >
    {executions.length === 0 || emptyState ? (
      <div
        style={{
          flex: 1,
          border: '1px dashed var(--pl-ink-300)',
          borderRadius: 4,
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <FormMono size={11} color="var(--pl-ink-500)" style={{ flex: 1 }}>
          no runs yet on this request shape.
        </FormMono>
        <GhostButton mini onClick={onViewHistory}>
          View history →
        </GhostButton>
      </div>
    ) : (
      <>
        {executions.map((e) => {
          const active = e.id === activeId;
          return (
            <button
              key={e.id}
              type="button"
              className={`pft-run-pill${active ? ' active' : ''}`}
              onClick={() => setActiveId(e.id)}
              data-testid={`test-tab-run-pill-${e.id}`}
              data-active={active ? 'true' : 'false'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: active ? 'var(--pl-ink-100)' : 'transparent',
                border: `1px solid ${active ? 'var(--pl-ink-300)' : 'var(--pl-ink-200)'}`,
                color: 'var(--pl-ink-700)',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'var(--pl-mono)',
                fontSize: 11,
                whiteSpace: 'nowrap',
              }}
            >
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(e.status) }} />
              <span>{e.revisionLabel}</span>
              <span style={{ color: 'var(--pl-ink-500)' }}>· {relativeTime(e.finishedAt)}</span>
            </button>
          );
        })}
        <span style={{ flex: 1 }} />
        <GhostButton mini onClick={onViewHistory}>
          View history →
        </GhostButton>
      </>
    )}
  </footer>
);
