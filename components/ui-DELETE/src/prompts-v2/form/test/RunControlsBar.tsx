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
import { FormMono, GhostButton, PrimaryButton } from '../atoms';

export interface RunControlsBarProps {
  vendor: string;
  model: string;
  modelSnapshot?: string;
  /** When `true`, Run is disabled and shows the running state. */
  running: boolean;
  canRerun: boolean;
  /** Show the request-changed banner above the controls instead of run pills. */
  requestChanged: boolean;
  onRun: () => void;
  onRerun?: () => void;
  onClearRequestChanged?: () => void;
  /** "saved" | "unsaved" | undefined — small status pill on the right. */
  saveStatus?: 'saved' | 'unsaved';
}

export const RunControlsBar: React.FC<RunControlsBarProps> = ({
  vendor,
  model,
  modelSnapshot,
  running,
  canRerun,
  requestChanged,
  onRun,
  onRerun,
  onClearRequestChanged,
  saveStatus,
}) => (
  <div
    data-testid="test-tab-run-controls"
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '10px 16px',
      borderBottom: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <FormMono size={11} color="var(--pl-ink-700)" style={{ flex: 1 }}>
        <span style={{ color: 'var(--pl-ink-500)' }}>model</span>{' '}
        <span>{vendor}/{model}</span>
        {modelSnapshot ? (
          <>
            {' '}
            <span style={{ color: 'var(--pl-ink-500)' }}>· snapshot</span> <span>{modelSnapshot}</span>
          </>
        ) : null}
      </FormMono>
      {saveStatus ? (
        <FormMono size={10} color={saveStatus === 'saved' ? 'var(--pl-ok)' : 'var(--pl-warn)'}>
          {saveStatus === 'saved' ? '✓ saved' : '· unsaved'}
        </FormMono>
      ) : null}
      {onRerun ? (
        <GhostButton mini onClick={onRerun} disabled={!canRerun || running}>
          Re-run last
        </GhostButton>
      ) : null}
      <PrimaryButton onClick={onRun} disabled={running} testId="test-tab-run">
        {running ? 'Running…' : '▶ Run'}
      </PrimaryButton>
    </div>
    {requestChanged ? (
      <div
        data-testid="test-tab-request-changed"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 10px',
          background: 'oklch(0.97 0.05 75)',
          color: 'oklch(0.40 0.13 75)',
          borderRadius: 4,
        }}
      >
        <FormMono size={10} color="inherit" style={{ flex: 1 }}>
          Request shape changed since last run — older runs are stashed in History.
        </FormMono>
        {onClearRequestChanged ? (
          <GhostButton mini onClick={onClearRequestChanged}>
            Clear
          </GhostButton>
        ) : null}
      </div>
    ) : null}
  </div>
);
