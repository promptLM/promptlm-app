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
import { Sparkline } from './Sparkline';

const meta: Meta<typeof Sparkline> = {
  title: 'Prompts v2 / Atoms / Sparkline',
  component: Sparkline,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Sparkline>;

const successRate = [0.97, 0.98, 0.97, 0.98, 0.99, 0.98, 0.99, 0.99];
const latency = [820, 800, 810, 790, 800, 760, 740, 720];

export const Default: Story = {
  args: { values: successRate },
};

export const Filled: Story = {
  args: { values: latency, filled: true, width: 120, height: 28, color: 'var(--pl-ok)' },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Sparkline values={successRate} width={48} height={14} color="var(--pl-ok)" />
      <Sparkline values={successRate} width={96} height={24} color="var(--pl-signal-deep)" />
      <Sparkline values={latency} width={120} height={28} color="var(--pl-warn)" filled />
    </div>
  ),
};
