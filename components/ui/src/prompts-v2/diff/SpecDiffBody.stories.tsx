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
import { SpecDiffBody } from './SpecDiffBody';
import { SAMPLE_DIFF_CORPUS } from './sampleData';

const meta: Meta<typeof SpecDiffBody> = {
  title: 'Prompts v2 / Diff / SpecDiffBody',
  component: SpecDiffBody,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SpecDiffBody>;

const ragR33 = SAMPLE_DIFF_CORPUS['doc-rag-answer'].revisions.r33.spec;
const ragR34 = SAMPLE_DIFF_CORPUS['doc-rag-answer'].revisions.r34.spec;
const routerR16 = SAMPLE_DIFF_CORPUS['mcp-tool-router'].revisions.r16.spec;
const routerR17 = SAMPLE_DIFF_CORPUS['mcp-tool-router'].revisions.r17.spec;

export const RulesAdded: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 1024 }}>
      <SpecDiffBody A={ragR33} B={ragR34} sourcePath="prompts/rag/doc-rag-answer.toml" />
    </div>
  ),
};

export const ModelSwitched: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 1024 }}>
      <SpecDiffBody A={routerR16} B={routerR17} sourcePath="prompts/agents/mcp-tool-router.toml" />
    </div>
  ),
};

export const NoSelection: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 24, maxWidth: 1024 }}>
      <SpecDiffBody A={null} B={null} />
    </div>
  ),
};
