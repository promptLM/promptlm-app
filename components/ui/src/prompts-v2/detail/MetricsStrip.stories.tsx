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

import type { Meta, StoryObj } from '@storybook/react';
import { MetricsStrip } from './MetricsStrip';
import { SAMPLE_METRICS } from './sampleData';

const meta: Meta<typeof MetricsStrip> = {
  title: 'Prompts v2 / Detail / MetricsStrip',
  component: MetricsStrip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MetricsStrip>;

export const Default: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24 }}>
      <MetricsStrip metrics={SAMPLE_METRICS} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24 }}>
      <MetricsStrip
        metrics={{
          runs: 0,
          lastRun: 'capture not enabled',
          latencyP50Ms: 0,
          latencyP95Ms: 0,
          tokensInAvg: 0,
          tokensOutAvg: 0,
        }}
      />
    </div>
  ),
};
