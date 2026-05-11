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
import { Mono } from './Mono';

const meta: Meta<typeof Mono> = {
  title: 'Prompts v2 / Atoms / Mono',
  component: Mono,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Mono>;

export const Default: Story = { args: { children: 'prm_8f3a' } };

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
      <Mono size={10}>10px</Mono>
      <Mono size={12}>12px</Mono>
      <Mono size={14}>14px</Mono>
      <Mono size={18}>18px</Mono>
      <Mono size={22} color="var(--pl-ink-900)">
        22px
      </Mono>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Mono color="var(--pl-ink-900)">ink-900</Mono>
      <Mono color="var(--pl-ink-700)">ink-700</Mono>
      <Mono color="var(--pl-ink-500)">ink-500</Mono>
      <Mono color="var(--pl-signal-deep)">signal-deep</Mono>
      <Mono color="var(--pl-ok)">ok</Mono>
    </div>
  ),
};
