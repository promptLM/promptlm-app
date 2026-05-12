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
import { MessageBlock } from './MessageBlock';
import { SAMPLE_MESSAGES } from './sampleData';

const meta: Meta<typeof MessageBlock> = {
  title: 'Prompts v2 / Detail / MessageBlock',
  component: MessageBlock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MessageBlock>;

export const Conversation: Story = {
  render: () => (
    <div
      style={{
        background: 'var(--pl-canvas)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 720,
      }}
    >
      {SAMPLE_MESSAGES.map((m, i) => (
        <MessageBlock key={i} role={m.role} body={m.body} />
      ))}
    </div>
  ),
};

export const RawWithoutHighlight: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 720 }}>
      <MessageBlock role="user" body={SAMPLE_MESSAGES[2].body} highlightPlaceholders={false} />
    </div>
  ),
};
