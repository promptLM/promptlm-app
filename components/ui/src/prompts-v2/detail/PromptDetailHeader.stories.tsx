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
import { PromptDetailHeader } from './PromptDetailHeader';

const meta: Meta<typeof PromptDetailHeader> = {
  title: 'Prompts v2 / Detail / PromptDetailHeader',
  component: PromptDetailHeader,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PromptDetailHeader>;

export const Default: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)' }}>
      <PromptDetailHeader
        name="doc-rag-answer"
        description="Answer a user question grounded in retrieved doc chunks. Used by the help-center bot and the internal Q&A surface."
        group="rag"
        version="1.8.0"
        rev="r34"
        vendor="openai"
        model="gpt-4.1"
        status="production"
      />
    </div>
  ),
};

export const Staging: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)' }}>
      <PromptDetailHeader
        name="sql-query-generator"
        description="Generate parameterised SQL from a natural-language question and a schema snapshot."
        group="data"
        version="3.1.0"
        rev="r24"
        vendor="openai"
        model="gpt-4.1"
        status="staging"
      />
    </div>
  ),
};
