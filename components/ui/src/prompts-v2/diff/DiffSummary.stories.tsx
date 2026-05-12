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
import { DiffSummary } from './DiffSummary';
import { SAMPLE_DIFF_CORPUS } from './sampleData';

const meta: Meta<typeof DiffSummary> = {
  title: 'Prompts v2 / Diff / DiffSummary',
  component: DiffSummary,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DiffSummary>;

const A = SAMPLE_DIFF_CORPUS['doc-rag-answer'].revisions.r33.spec;
const B = SAMPLE_DIFF_CORPUS['doc-rag-answer'].revisions.r34.spec;
const C = SAMPLE_DIFF_CORPUS['mcp-tool-router'].revisions.r16.spec;
const D = SAMPLE_DIFF_CORPUS['mcp-tool-router'].revisions.r17.spec;

export const SamePromptDifferentRevs: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, minWidth: 720 }}>
      <DiffSummary A={A} B={B} />
    </div>
  ),
};

export const ModelChanged: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, minWidth: 720 }}>
      <DiffSummary A={C} B={D} />
    </div>
  ),
};

export const NothingPicked: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, minWidth: 720 }}>
      <DiffSummary A={null} B={null} />
    </div>
  ),
};
