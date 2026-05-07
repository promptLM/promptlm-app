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
import type { RepoHistoryItem, TestRunStatus } from './types';

const dotColor = (status: TestRunStatus): string =>
  status === 'ok' ? 'var(--pl-ok)' : status === 'error' ? 'var(--pl-fail)' : 'var(--pl-warn)';

export interface HistoryFlyoverProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<RepoHistoryItem>;
  /** When true, show the "stub · pending backend api" badge per the spec. */
  stub?: boolean;
}

export const HistoryFlyover: React.FC<HistoryFlyoverProps> = ({ open, onClose, items, stub = true }) => {
  if (!open) return null;
  return (
    <div
      className="pft-history-flyover"
      data-testid="test-tab-history-flyover"
      role="dialog"
      aria-label="Run history"
      style={{
        position: 'absolute',
        right: 0,
        bottom: '100%',
        marginBottom: 8,
        width: 420,
        maxHeight: 360,
        background: 'var(--pl-paper)',
        border: '1px solid var(--pl-ink-200)',
        boxShadow: 'var(--pl-shadow-md)',
        borderRadius: 6,
        zIndex: 12,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--pl-ink-200)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em', flex: 1 }}>
          RUN HISTORY
        </FormMono>
        {stub ? (
          <FormMono
            size={10}
            color="var(--pl-warn)"
            style={{
              padding: '1px 6px',
              background: 'oklch(0.96 0.06 75)',
              borderRadius: 3,
            }}
            data-testid="test-tab-history-flyover-stub-badge"
          >
            stub · pending backend api
          </FormMono>
        ) : null}
        <GhostButton mini onClick={onClose}>
          ×
        </GhostButton>
      </header>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {items.length === 0 ? (
          <li style={{ padding: 16 }}>
            <FormMono size={11} color="var(--pl-ink-500)">
              no older runs.
            </FormMono>
          </li>
        ) : (
          items.map((it) => (
            <li
              key={it.id}
              data-testid={`test-tab-history-item-${it.id}`}
              style={{
                padding: '8px 14px',
                borderBottom: '1px solid var(--pl-ink-100)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor(it.status) }} />
              <FormMono size={11} color="var(--pl-ink-900)" style={{ width: 56 }}>
                {it.revisionLabel}
              </FormMono>
              <FormMono size={11} color="var(--pl-ink-500)" style={{ flex: 1 }}>
                {it.note ?? ''}
              </FormMono>
              <FormMono size={10} color="var(--pl-ink-500)">
                {new Date(it.finishedAt).toLocaleDateString()}
              </FormMono>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
