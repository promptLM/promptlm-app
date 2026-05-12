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

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TestTab } from './TestTab';
import type { PromptFormDraft } from '../types';
import { SAMPLE_EXECUTIONS, SAMPLE_REPO_HISTORY } from './sampleExecutions';

const SAMPLE_DRAFT: PromptFormDraft = {
  name: 'doc-rag-answer',
  group: 'rag',
  description: '',
  request: {
    type: 'chat',
    vendor: 'openai',
    model: 'gpt-4.1',
    modelSnapshot: '2025-04-14',
    parameters: { temperature: 0.1, topP: 1.0, maxTokens: 1200, frequencyPenalty: 0, presencePenalty: 0 },
    messages: [
      { role: 'system', content: 'You are a careful technical-writing assistant.' },
      { role: 'user', content: 'Question: {{question}}\n\nTone: {{tone}}' },
    ],
  },
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [
      { name: 'question', type: 'string', required: true, description: 'User question.' },
      { name: 'tone', type: 'string', required: false, description: 'Optional tone.' },
    ],
  },
  toolConfigs: [],
  evaluations: [],
};

const Frame: React.FC<{
  initialValues: Record<string, string>;
  initialExecutions?: typeof SAMPLE_EXECUTIONS;
  requestChanged?: boolean;
  runState?: 'idle' | 'running' | 'error';
}> = ({ initialValues, initialExecutions = SAMPLE_EXECUTIONS, requestChanged = false, runState = 'idle' }) => {
  const [values, setValues] = React.useState(initialValues);
  const [valuesDirty, setDirty] = React.useState(false);
  const [shapeChanged, setShapeChanged] = React.useState(requestChanged);
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TestTab
        draft={SAMPLE_DRAFT}
        executions={shapeChanged ? [] : initialExecutions}
        repoHistory={SAMPLE_REPO_HISTORY}
        requestChanged={shapeChanged}
        values={values}
        onChangeValues={(v) => {
          setValues(v);
          setDirty(true);
        }}
        valuesDirty={valuesDirty}
        onSaveValues={() => setDirty(false)}
        onResetValues={() => {
          setValues(initialValues);
          setDirty(false);
        }}
        onRun={() => undefined}
        onRerun={() => undefined}
        runState={runState}
        onClearRequestChanged={() => setShapeChanged(false)}
      />
    </div>
  );
};

const meta: Meta<typeof TestTab> = {
  title: 'Prompts v2 / Form / Test / TestTab',
  component: TestTab,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof TestTab>;

export const Loaded: Story = {
  render: () => <Frame initialValues={{ question: 'What is the SLA?', tone: 'concise' }} />,
};

export const Empty: Story = {
  render: () => <Frame initialValues={{ question: '', tone: '' }} initialExecutions={[]} />,
};

export const RequestChanged: Story = {
  render: () => <Frame initialValues={{ question: 'What is the SLA?', tone: 'concise' }} requestChanged />,
};

export const OutputError: Story = {
  render: () => (
    <Frame
      initialValues={{ question: 'broken', tone: '' }}
      initialExecutions={[
        {
          ...SAMPLE_EXECUTIONS[2],
          shapeHash: 'cafebabe',
        },
      ]}
      runState="error"
    />
  ),
};

export const Running: Story = {
  render: () => <Frame initialValues={{ question: 'What is the SLA?', tone: 'concise' }} runState="running" />,
};
