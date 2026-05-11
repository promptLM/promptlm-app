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
import { KV, SpecBlock } from './SpecBlock';

const meta: Meta<typeof SpecBlock> = {
  title: 'Prompts v2 / Detail / SpecBlock',
  component: SpecBlock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SpecBlock>;

export const RequestConfig: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 720 }}>
      <SpecBlock title="request">
        <KV k="vendor" v="openai" />
        <KV k="model" v="gpt-4.1" />
        <KV k="parameters.temperature" v="0.2" />
        <KV k="parameters.top_p" v="1" />
        <KV k="parameters.max_tokens" v="1024" last />
      </SpecBlock>
    </div>
  ),
};
