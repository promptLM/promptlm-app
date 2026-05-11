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
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Prompts v2 / Atoms / Tag',
  component: Tag,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tag>;

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Tag tone="neutral">neutral</Tag>
      <Tag tone="signal">v2.4.1</Tag>
      <Tag tone="ok">required</Tag>
      <Tag tone="warn">deprecated</Tag>
      <Tag tone="fail">failing</Tag>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag tone="signal">v1.8.0</Tag>
      <Tag>r34</Tag>
      <Tag>chat</Tag>
      <Tag tone="ok">✓ ok</Tag>
      <Tag tone="fail">✕ failed</Tag>
    </div>
  ),
};
