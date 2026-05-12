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
import { MetaPill } from './MetaPill';

const meta: Meta<typeof MetaPill> = {
  title: 'Prompts v2 / Atoms / MetaPill',
  component: MetaPill,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MetaPill>;

export const Plain: Story = { args: { label: 'version', value: '1.8.0', mono: true } };

export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <MetaPill label="version" value="1.8.0" mono />
      <MetaPill label="rev" value="r34" mono />
      <MetaPill label="model" value="openai/gpt-4.1" mono />
      <MetaPill label="status">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: 'oklch(0.55 0.13 155)',
            }}
          />
          <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 12, color: 'oklch(0.40 0.12 155)' }}>
            production
          </span>
        </span>
      </MetaPill>
    </div>
  ),
};
