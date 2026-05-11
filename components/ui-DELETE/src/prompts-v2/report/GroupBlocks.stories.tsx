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
import { GroupBlocks } from './GroupBlocks';
import { SAMPLE_GROUPS } from './sampleData';

const meta: Meta<typeof GroupBlocks> = {
  title: 'Prompts v2 / Report / GroupBlocks',
  component: GroupBlocks,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof GroupBlocks>;

export const FullCatalog: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24 }}>
      <GroupBlocks groups={SAMPLE_GROUPS} onSelect={() => undefined} />
    </div>
  ),
};
