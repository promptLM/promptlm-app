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
import { RevisionHistoryTable } from './RevisionHistoryTable';
import { SAMPLE_HISTORY } from './sampleData';

const meta: Meta<typeof RevisionHistoryTable> = {
  title: 'Prompts v2 / Detail / RevisionHistoryTable',
  component: RevisionHistoryTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RevisionHistoryTable>;

export const Default: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24 }}>
      <RevisionHistoryTable
        history={SAMPLE_HISTORY}
        promptName="doc-rag-answer"
        onDiffClick={() => undefined}
      />
    </div>
  ),
};

export const SingleRevision: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24 }}>
      <RevisionHistoryTable history={SAMPLE_HISTORY.slice(0, 1)} promptName="doc-rag-answer" />
    </div>
  ),
};
