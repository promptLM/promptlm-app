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
import { DocumentChrome } from './DocumentChrome';

const meta: Meta<typeof DocumentChrome> = {
  title: 'Prompts v2 / Shell / DocumentChrome',
  component: DocumentChrome,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DocumentChrome>;

export const ReportLanding: Story = {
  render: () => (
    <DocumentChrome
      source="promptlm report · github.com/acme/agents"
      detail="prompts/rag/doc-rag-answer.toml"
    />
  ),
};

export const PromptDetail: Story = {
  render: () => (
    <DocumentChrome
      source="promptlm report · github.com/acme/agents"
      breadcrumb={['catalog', 'rag', 'doc-rag-answer']}
      detail="prompts/rag/doc-rag-answer.toml"
      secondaryLink={{ label: 'open in diff →', href: '#/diff' }}
    />
  ),
};
