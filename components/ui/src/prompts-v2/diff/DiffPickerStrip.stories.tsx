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
import { useState } from 'react';
import { DiffPickerStrip } from './DiffPickerStrip';
import type { DiffSelection } from './types';
import { SAMPLE_DIFF_CORPUS, SAMPLE_DIFF_SELECTION } from './sampleData';

const meta: Meta<typeof DiffPickerStrip> = {
  title: 'Prompts v2 / Diff / DiffPickerStrip',
  component: DiffPickerStrip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DiffPickerStrip>;

export const Default: Story = {
  render: () => {
    const [sel, setSel] = useState<DiffSelection>(SAMPLE_DIFF_SELECTION);
    return (
      <div style={{ background: 'var(--pl-canvas)', padding: 24, minWidth: 720 }}>
        <DiffPickerStrip selection={sel} corpus={SAMPLE_DIFF_CORPUS} onChange={setSel} />
      </div>
    );
  },
};

export const CrossPrompt: Story = {
  render: () => {
    const [sel, setSel] = useState<DiffSelection>({
      promptA: 'doc-rag-answer',
      revA: 'r34',
      promptB: 'mcp-tool-router',
      revB: 'r17',
    });
    return (
      <div style={{ background: 'var(--pl-canvas)', padding: 24, minWidth: 720 }}>
        <DiffPickerStrip selection={sel} corpus={SAMPLE_DIFF_CORPUS} onChange={setSel} />
      </div>
    );
  },
};
