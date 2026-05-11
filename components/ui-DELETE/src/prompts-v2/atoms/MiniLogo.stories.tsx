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
import { MiniLogo } from './MiniLogo';

const meta: Meta<typeof MiniLogo> = {
  title: 'Prompts v2 / Atoms / MiniLogo',
  component: MiniLogo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MiniLogo>;

export const Default: Story = { args: { size: 22 } };

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <MiniLogo size={16} />
      <MiniLogo size={22} />
      <MiniLogo size={32} />
      <MiniLogo size={48} />
    </div>
  ),
};
