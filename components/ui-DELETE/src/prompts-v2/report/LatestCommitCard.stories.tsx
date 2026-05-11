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
import { LatestCommitCard } from './LatestCommitCard';
import { SAMPLE_LATEST_COMMIT } from './sampleData';

const meta: Meta<typeof LatestCommitCard> = {
  title: 'Prompts v2 / Report / LatestCommitCard',
  component: LatestCommitCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LatestCommitCard>;

export const CIGreen: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 960 }}>
      <LatestCommitCard commit={SAMPLE_LATEST_COMMIT} />
    </div>
  ),
};

export const CIRed: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 960 }}>
      <LatestCommitCard commit={{ ...SAMPLE_LATEST_COMMIT, ci: 'red' }} />
    </div>
  ),
};
