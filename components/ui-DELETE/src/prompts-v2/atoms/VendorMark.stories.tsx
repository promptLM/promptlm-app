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
import { VendorMark } from './VendorMark';

const meta: Meta<typeof VendorMark> = {
  title: 'Prompts v2 / Atoms / VendorMark',
  component: VendorMark,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof VendorMark>;

export const Vendors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <VendorMark vendor="anthropic" />
      <VendorMark vendor="openai" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <VendorMark vendor="anthropic" size={11} />
      <VendorMark vendor="anthropic" size={14} />
      <VendorMark vendor="anthropic" size={20} />
      <VendorMark vendor="openai" size={11} />
      <VendorMark vendor="openai" size={14} />
      <VendorMark vendor="openai" size={20} />
    </div>
  ),
};
