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
import {
  EvaluationPlanCard,
  EvaluationResultsCard,
  LastExecutionCard,
  MessagesCard,
  MetadataCard,
  ModelConfigurationCard,
  PlaceholdersCard,
  PromptPreviewCard,
  ToolConfigsCard,
} from './cards';
import type {
  PromptEditorExecution,
  PromptEditorMessage,
  PromptEditorPlaceholderConfig,
  PromptEditorRequestDraft,
  PromptEditorToolConfig,
} from '../../prompt-editor/PromptEditorSections';

const meta: Meta = {
  title: 'Prompts v2 / Editor / Form cards',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

const SAMPLE_REQUEST: PromptEditorRequestDraft = {
  vendor: 'anthropic',
  model: 'claude-3-5',
  modelSnapshot: '2025-02-01',
  url: '',
  parameters: { temperature: 0.7, topP: 1, maxTokens: 1024, stream: false },
  messages: [],
};

const SAMPLE_PLACEHOLDERS: PromptEditorPlaceholderConfig = {
  startPattern: '{{',
  endPattern: '}}',
  list: [
    { name: 'user_query', value: 'what is the refund window?' },
    { name: 'kb_doc', value: 'fixtures/kb-1.md' },
  ],
};

const SAMPLE_MESSAGES: PromptEditorMessage[] = [
  { id: 'm1', role: 'system', content: 'You are a helpful customer support agent.' },
  { id: 'm2', role: 'user', content: 'When can I return a product?' },
];

const SAMPLE_TOOLS: PromptEditorToolConfig[] = [
  {
    id: 't1',
    name: 'inventory.search',
    scenario: 'default',
    notes: 'Search documentation for refund policies.',
    mockResponse: '{ "items": [] }',
  },
];

const SAMPLE_EXECUTION: PromptEditorExecution = {
  id: 'exec_4f9c',
  timestamp: new Date('2026-05-04T18:30:00Z').toISOString(),
  response: {
    content: 'You can return any product within 30 days of purchase.',
    usage: { outputTokens: 42 },
  },
  placeholders: [{ name: 'user_query', defaultValue: 'when can I return?' }],
  evaluations: [],
};

const Stack: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>{children}</div>
);

export const AllCards: Story = {
  render: () => {
    const [request, setRequest] = useState(SAMPLE_REQUEST);
    const [placeholders, setPlaceholders] = useState(SAMPLE_PLACEHOLDERS);
    const [messages, setMessages] = useState(SAMPLE_MESSAGES);
    const [tools, setTools] = useState(SAMPLE_TOOLS);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showPlaceholders, setShowPlaceholders] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    return (
      <Stack>
        <MetadataCard
          group="rag"
          name="doc-rag-answer"
          description="Answers customer questions from internal docs."
          authorsDisplay="j.s. <jordan@example.com>"
          promptPath="prompts/rag/doc-rag-answer.toml"
          versionLabel="v1.4.2"
          revision={17}
          showMetadataDetails={showDetails}
          onToggleMetadataDetails={() => setShowDetails((v) => !v)}
          onGroupChange={() => undefined}
          onNameChange={() => undefined}
          onDescriptionChange={() => undefined}
        />
        <ModelConfigurationCard
          request={request}
          showAdvancedParameters={showAdvanced}
          onToggleAdvancedParameters={() => setShowAdvanced((v) => !v)}
          onRequestChange={(field, value) => setRequest((r) => ({ ...r, [field]: value }))}
          onParameterChange={(field, value) =>
            setRequest((r) => ({ ...r, parameters: { ...r.parameters, [field]: value } }))
          }
          onStreamChange={(checked) =>
            setRequest((r) => ({ ...r, parameters: { ...r.parameters, stream: checked } }))
          }
        />
        <PlaceholdersCard
          placeholders={placeholders}
          showPlaceholders={showPlaceholders}
          onTogglePlaceholders={() => setShowPlaceholders((v) => !v)}
          onAddPlaceholder={() =>
            setPlaceholders((p) => ({ ...p, list: [...p.list, { name: '', value: '' }] }))
          }
          onRemovePlaceholder={(i) =>
            setPlaceholders((p) => ({ ...p, list: p.list.filter((_, j) => j !== i) }))
          }
          onPlaceholderChange={(i, field, value) =>
            setPlaceholders((p) => ({
              ...p,
              list: p.list.map((row, j) => (j === i ? { ...row, [field]: value } : row)),
            }))
          }
          onPlaceholderPatternChange={(field, value) =>
            setPlaceholders((p) => ({ ...p, [field]: value }))
          }
        />
        <MessagesCard
          messages={messages}
          availableRoles={['system', 'user', 'assistant', 'tool']}
          onAddMessage={(role) =>
            setMessages((m) => [...m, { id: `m${m.length + 1}`, role, content: '' }])
          }
          onMessageChange={(i, field, value) =>
            setMessages((m) => m.map((msg, j) => (j === i ? { ...msg, [field]: value } : msg)))
          }
          onRemoveMessage={(i) => setMessages((m) => m.filter((_, j) => j !== i))}
          onTryRun={() => undefined}
          onNavigateBack={() => undefined}
          isBusy={false}
          isSaving={false}
          hasActiveProject
          isActiveProjectLoading={false}
        />
        <ToolConfigsCard
          configs={tools}
          onAddConfig={() =>
            setTools((t) => [
              ...t,
              { id: `t${t.length + 1}`, name: '', scenario: 'default', mockResponse: '', notes: '' },
            ])
          }
          onRemoveConfig={(id) => setTools((t) => t.filter((c) => c.id !== id))}
          onConfigChange={(id, field, value) =>
            setTools((t) => t.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
          }
        />
        <PromptPreviewCard
          draftSummary="System: You are a helpful customer support agent.\nUser: When can I return a product?"
          execution={SAMPLE_EXECUTION}
        />
        <LastExecutionCard
          lastExecution={SAMPLE_EXECUTION}
          executions={[SAMPLE_EXECUTION]}
          onSelectExecution={() => undefined}
        />
        <EvaluationPlanCard
          enabled
          evaluations={[
            { evaluator: 'truthfulness', type: 'llm-judge', description: 'Refuses if no doc supports the answer.' },
          ]}
          onToggleEnabled={() => undefined}
          onAddEvaluation={() => undefined}
          onRemoveEvaluation={() => undefined}
          onEvaluationChange={() => undefined}
        />
        <EvaluationResultsCard
          results={[
            {
              evaluator: 'truthfulness',
              type: 'llm-judge',
              success: true,
              score: 0.94,
              reasoning: 'Answer cites doc kb-1.md.',
            },
          ]}
        />
      </Stack>
    );
  },
};
