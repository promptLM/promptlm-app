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
import type { Meta, StoryObj } from '@storybook/react';
import { ReleaseRail, type ReleaseRailProps } from './ReleaseRail';
import type { ReleaseGateResult } from '../releaseGates';

const ALL_GATES_PASS: ReleaseGateResult[] = [
  { id: 'form-validates-clean', passed: true, tooltip: 'Form is valid' },
  { id: 'has-test-run-on-current-shape', passed: true, tooltip: 'Test run recorded' },
  { id: 'last-run-succeeded', passed: true, tooltip: 'Last run succeeded' },
  { id: 'placeholder-shape-saved', passed: true, tooltip: 'Placeholder schema saved' },
];

const ONE_GATE_FAILS: ReleaseGateResult[] = [
  { id: 'form-validates-clean', passed: true, tooltip: 'Form is valid' },
  {
    id: 'has-test-run-on-current-shape',
    passed: false,
    tooltip: 'Run at least once in the Test tab before releasing',
  },
  { id: 'last-run-succeeded', passed: true, tooltip: 'Last run succeeded' },
  { id: 'placeholder-shape-saved', passed: true, tooltip: 'Placeholder schema saved' },
];

const baseProps: ReleaseRailProps = {
  open: true,
  state: 'idle',
  currentVersion: '1.8.0',
  nextVersion: '1.9.0',
  gates: ALL_GATES_PASS,
  diff: {
    summary: '3 messages changed · 1 placeholder added · model unchanged',
    onViewDiff: () => undefined,
  },
  lastRun: { status: 'ok', durationMs: 1820, tokensIn: 412, tokensOut: 188, onView: () => undefined },
  onRelease: () => undefined,
  onCancel: () => undefined,
  onClose: () => undefined,
};

const meta: Meta<typeof ReleaseRail> = {
  title: 'Prompts v2 / Form / Release / ReleaseRail',
  component: ReleaseRail,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ReleaseRail>;

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: '100vh', background: 'var(--pl-canvas)', padding: 24 }}>{children}</div>
);

export const Idle: Story = {
  render: () => (
    <Frame>
      <ReleaseRail {...baseProps} />
    </Frame>
  ),
};

export const IdleBlockedByGate: Story = {
  render: () => (
    <Frame>
      <ReleaseRail {...baseProps} gates={ONE_GATE_FAILS} />
    </Frame>
  ),
};

export const Saving: Story = {
  render: () => (
    <Frame>
      <ReleaseRail {...baseProps} state="saving" />
    </Frame>
  ),
};

export const Running: Story = {
  render: () => (
    <Frame>
      <ReleaseRail {...baseProps} state="running" />
    </Frame>
  ),
};

export const Released: Story = {
  render: () => (
    <Frame>
      <ReleaseRail {...baseProps} state="released" />
    </Frame>
  ),
};

export const BlockedPrompt: Story = {
  render: () => (
    <Frame>
      <ReleaseRail
        {...baseProps}
        state="blocked-prompt"
        errorMessage="Pre-release execution returned PROMPT_FAILURE: assistant produced an empty response."
        onRetry={() => undefined}
      />
    </Frame>
  ),
};

export const BlockedInfra: Story = {
  render: () => (
    <Frame>
      <ReleaseRail
        {...baseProps}
        state="blocked-infra"
        errorMessage="Network error while contacting the release service."
        onRetry={() => undefined}
      />
    </Frame>
  ),
};
