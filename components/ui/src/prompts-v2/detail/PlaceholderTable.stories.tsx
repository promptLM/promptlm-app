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
import { PlaceholderTable } from './PlaceholderTable';
import { SpecBlock } from './SpecBlock';
import { SAMPLE_PLACEHOLDERS } from './sampleData';

const meta: Meta<typeof PlaceholderTable> = {
  title: 'Prompts v2 / Detail / PlaceholderTable',
  component: PlaceholderTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PlaceholderTable>;

export const InsideSpecBlock: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24 }}>
      <SpecBlock title={`placeholders · ${SAMPLE_PLACEHOLDERS.length}`}>
        <PlaceholderTable placeholders={SAMPLE_PLACEHOLDERS} />
      </SpecBlock>
    </div>
  ),
};
