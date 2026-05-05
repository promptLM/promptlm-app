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

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PromptFormPage } from './PromptFormPage';
import { EMPTY_DRAFT } from './types';
import type { PromptFormContext, PromptFormDraft } from './types';

const meta: Meta<typeof PromptFormPage> = {
  title: 'Prompts v2 / Form / PromptFormPage',
  component: PromptFormPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PromptFormPage>;

const SAMPLE_DRAFT: PromptFormDraft = {
  name: 'doc-rag-answer',
  group: 'rag',
  description:
    'Answer a user question grounded in retrieved doc chunks. Used by the help-center bot and the internal Q&A surface.',
  request: {
    type: 'chat',
    vendor: 'openai',
    model: 'gpt-4.1',
    modelSnapshot: '2025-04-14',
    parameters: {
      temperature: 0.1,
      topP: 1.0,
      maxTokens: 1200,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    messages: [
      {
        role: 'system',
        content:
          'You are a careful technical-writing assistant. Answer ONLY from the provided chunks. If the answer is not present, say so plainly. Cite the chunk id inline like [c-913].',
      },
      {
        role: 'user',
        content: 'Question: {{question}}\n\nChunks:\n{{chunks}}\n\nTone: {{tone}}',
      },
    ],
  },
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [
      { name: 'question', type: 'string', required: true, description: 'The end-user question, verbatim.' },
      { name: 'chunks', type: 'string', required: true, description: 'Retrieved doc chunks, separated by ---.' },
      { name: 'tone', type: 'string', required: false, description: 'Optional tone override (default: neutral).' },
    ],
  },
  toolConfigs: [
    {
      name: 'search_docs',
      scenario: 'happy-path',
      notes: 'Returns ranked chunks for the question.',
      mockResponse: '[{"id":"c-913","score":0.91,"text":"…"}]',
    },
    {
      name: 'search_docs',
      scenario: 'empty',
      notes: 'No chunks found — verify graceful fallback.',
      mockResponse: '[]',
    },
  ],
  evaluations: [
    {
      evaluator: 'groundedness',
      type: 'llm-judge',
      description: 'Every claim must be supported by a chunk.',
    },
    {
      evaluator: 'concise-answer',
      type: 'rubric',
      description: 'Answer < 120 words, no fluff.',
    },
  ],
};

const EDIT_CONTEXT: PromptFormContext = {
  version: '1.8.0',
  revision: 'r34',
  repositoryUrl: 'github.com/acme/agents',
  branch: 'main',
};

const CREATE_CONTEXT: PromptFormContext = {
  version: '0.1.0',
  revision: 'r1',
  repositoryUrl: 'github.com/acme/agents',
  branch: 'main',
};

const Wired = ({
  initial,
  context,
  mode,
}: {
  initial: PromptFormDraft;
  context: PromptFormContext;
  mode: 'create' | 'edit';
}) => {
  const [draft, setDraft] = useState<PromptFormDraft>(initial);
  const [evalEnabled, setEvalEnabled] = useState(mode === 'edit');
  return (
    <PromptFormPage
      mode={mode}
      draft={draft}
      context={context}
      evalEnabled={evalEnabled}
      onChangeDraft={setDraft}
      onToggleEvalEnabled={setEvalEnabled}
      onCancel={() => undefined}
      onSaveDraft={() => undefined}
      onSubmit={() => undefined}
    />
  );
};

export const EditMode: Story = {
  render: () => <Wired initial={SAMPLE_DRAFT} context={EDIT_CONTEXT} mode="edit" />,
};

export const CreateMode: Story = {
  render: () => <Wired initial={EMPTY_DRAFT} context={CREATE_CONTEXT} mode="create" />,
};

export const WithErrors: Story = {
  render: () => (
    <Wired
      initial={{
        ...EMPTY_DRAFT,
        name: 'has spaces',
        request: { ...EMPTY_DRAFT.request, vendor: '' },
      }}
      context={CREATE_CONTEXT}
      mode="create"
    />
  ),
};
