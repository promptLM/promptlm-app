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
import { PlaceholderToken } from './PlaceholderToken';

const meta: Meta<typeof PlaceholderToken> = {
  title: 'Prompts v2 / Atoms / PlaceholderToken',
  component: PlaceholderToken,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PlaceholderToken>;

export const Default: Story = { args: { name: 'agent_name' } };

export const Underline: Story = { args: { name: 'tool_catalog', underline: true } };

export const InMessage: Story = {
  render: () => (
    <pre
      style={{
        margin: 0,
        padding: 14,
        fontFamily: 'var(--pl-mono)',
        fontSize: 12.5,
        lineHeight: 1.7,
        background: 'var(--pl-paper)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 8,
        color: 'var(--pl-ink-800)',
        whiteSpace: 'pre-wrap',
        maxWidth: 480,
      }}
    >
      {'You are '}
      <PlaceholderToken name="agent_name" />
      {', a careful assistant. Use the tools in '}
      <PlaceholderToken name="tool_catalog" />
      {'.'}
    </pre>
  ),
};
