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
import React from 'react';
import { Box, Stack } from '@mui/material';
import {
  ModelConfigurationCard,
  PlaceholdersCard,
  MetadataCard,
  ToolConfigsCard,
  EvaluationPlanCard,
  MessagesCard,
  DEFAULT_MESSAGE_ROLES,
} from './PromptEditorSections';
import type {
  ModelConfigurationCardProps,
  PlaceholdersCardProps,
  MetadataCardProps,
  ToolConfigsCardProps,
  EvaluationPlanCardProps,
  MessagesCardProps,
  PromptEditorRequestDraft,
  PromptEditorMessage,
  PromptEditorToolConfig,
  PromptEditorEvaluationPlan,
} from './PromptEditorSections';

const baseRequestDraft: PromptEditorRequestDraft = {
  vendor: 'openai',
  model: 'gpt-4.1-mini',
  modelSnapshot: '2025-01-01',
  url: 'https://api.openai.com/v1/chat/completions',
  parameters: {
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 512,
    frequencyPenalty: 0,
    presencePenalty: 0,
    stream: false,
  },
  messages: [],
};

const renderCard = (children: React.ReactNode) => (
  <Box maxWidth={960} mx="auto">
    {children}
  </Box>
);

/**********************
 * ModelConfigurationCard
 **********************/

const modelMeta: Meta<typeof ModelConfigurationCard> = {
  title: 'Prompt Editor/Sections/Model Configuration Card',
  component: ModelConfigurationCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Collects model identity and runtime parameters for prompt execution. Advanced controls should stay optional and progressively disclosed.',
      },
    },
  },
  render: (args) => renderCard(<ModelConfigurationCard {...args} />),
  args: {
    request: baseRequestDraft,
    showAdvancedParameters: false,
  } satisfies Partial<ModelConfigurationCardProps>,
};

export default modelMeta;

type ModelStory = StoryObj<typeof ModelConfigurationCard>;

export const ModelEmpty: ModelStory = {
  args: {
    request: {
      ...baseRequestDraft,
      vendor: '',
      model: '',
      modelSnapshot: '',
      url: '',
    },
  },
};

export const ModelPopulated: ModelStory = {
  args: {
    showAdvancedParameters: true,
  },
};

export const ModelErrors: ModelStory = {
  args: {
    request: {
      ...baseRequestDraft,
      vendor: '',
      model: '',
      modelSnapshot: 'invalid snapshot',
      url: 'notaurl',
      parameters: {
        temperature: -1,
        topP: 1.5,
        maxTokens: 0,
        frequencyPenalty: 5,
        presencePenalty: 5,
        stream: false,
      },
    },
    errors: {
      general: 'Fix validation errors before proceeding.',
      vendor: 'Vendor is required.',
      model: 'Model is required.',
      modelSnapshot: 'Snapshot must follow YYYY-MM-DD format.',
      url: 'Provide a valid HTTPS endpoint.',
      parameters: {
        temperature: 'Must be between 0 and 2.',
        topP: 'Must be between 0 and 1.',
        maxTokens: 'Provide a positive integer.',
        frequencyPenalty: 'Valid range: -2 to 2.',
        presencePenalty: 'Valid range: -2 to 2.',
      },
    },
  },
};

/**********************
 * PlaceholdersCard
 **********************/

const placeholdersMeta: Meta<typeof PlaceholdersCard> = {
  title: 'Prompt Editor/Sections/Placeholders Card',
  component: PlaceholdersCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Manages placeholder delimiters and default values used to materialize runtime prompt content before save/run operations.',
      },
    },
  },
  render: (args) => renderCard(<PlaceholdersCard {...args} />),
  args: {
    placeholders: {
      startPattern: '{{',
      endPattern: '}}',
      list: [],
    },
    showPlaceholders: true,
  } satisfies Partial<PlaceholdersCardProps>,
};

export const PlaceholdersStories = placeholdersMeta;

type PlaceholderStory = StoryObj<typeof PlaceholdersCard>;

export const PlaceholdersEmpty: PlaceholderStory = {
  args: {
    placeholders: {
      startPattern: '{{',
      endPattern: '}}',
      list: [],
    },
  },
};

export const PlaceholdersPopulated: PlaceholderStory = {
  args: {
    placeholders: {
      startPattern: '{{',
      endPattern: '}}',
      list: [
        { name: 'customer_name', value: 'Taylor' },
        { name: 'subscription_plan', value: 'Premium' },
      ],
    },
  },
};

export const PlaceholdersErrors: PlaceholderStory = {
  args: {
    placeholders: {
      startPattern: '',
      endPattern: '',
      list: [{ name: '', value: '' }],
    },
    errors: {
      general: 'Resolve placeholder issues.',
      startPattern: 'Start pattern is required.',
      endPattern: 'End pattern is required.',
      list: [{
        name: 'Provide a placeholder name.',
        value: 'Add a default value or remove the placeholder.',
      }],
    },
  },
};

/**********************
 * MetadataCard
 **********************/

const metadataMeta: Meta<typeof MetadataCard> = {
  title: 'Prompt Editor/Sections/Metadata Card',
  component: MetadataCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Captures prompt identity metadata and display-only version/path context. Inline validation should remain field-specific to support quick correction.',
      },
    },
  },
  render: (args) => renderCard(<MetadataCard {...args} />),
  args: {
    group: 'customer-support',
    name: 'refund-policy-check',
    description: 'Guides agents through refund eligibility checks.',
    authorsDisplay: 'Taylor Swift, Alex Mercer',
    promptPath: 'prompts/customer-support/refund-policy-check/promptlm.yml',
    versionLabel: '1.2.0',
    revision: 7,
    showMetadataDetails: false,
  } satisfies Partial<MetadataCardProps>,
};

export const MetadataStories = metadataMeta;

type MetadataStory = StoryObj<typeof MetadataCard>;

export const MetadataPrimary: MetadataStory = {};

export const MetadataExpanded: MetadataStory = {
  args: {
    showMetadataDetails: true,
  },
};

export const MetadataErrors: MetadataStory = {
  args: {
    group: '',
    name: '',
    description: '',
    errors: {
      general: 'Unable to save metadata.',
      group: 'Provide a group slug.',
      name: 'Provide a prompt name.',
      description: 'Description must explain the prompt purpose.',
    },
  },
};

/**********************
 * ToolConfigsCard
 **********************/

const toolConfigs: PromptEditorToolConfig[] = [
  {
    id: 'tool-1',
    name: 'inventory.search',
    scenario: 'default',
    mockResponse: '{ "count": 2, "items": [] }',
    notes: 'Returns the closest in-stock items.',
  },
  {
    id: 'tool-2',
    name: 'knowledgebase.lookup',
    scenario: 'qa',
    mockResponse: '{ "articleId": "kb-123" }',
    notes: 'Used for deflection answers.',
  },
];

const toolConfigsMeta: Meta<typeof ToolConfigsCard> = {
  title: 'Prompt Editor/Sections/Tool Configs Card',
  component: ToolConfigsCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Defines MCP/tool simulation rows that the editor can validate inline. Intended for deterministic local test and release preparation flows.',
      },
    },
  },
  render: (args) => renderCard(<ToolConfigsCard {...args} />),
  args: {
    configs: toolConfigs,
  } satisfies Partial<ToolConfigsCardProps>,
};

export const ToolConfigsStories = toolConfigsMeta;

type ToolConfigsStory = StoryObj<typeof ToolConfigsCard>;

export const ToolConfigsEmpty: ToolConfigsStory = {
  args: {
    configs: [],
  },
};

export const ToolConfigsPopulated: ToolConfigsStory = {};

export const ToolConfigsErrors: ToolConfigsStory = {
  args: {
    configs: toolConfigs,
    errors: {
      general: 'Resolve errors to continue.',
      configs: [
        {
          name: 'Name is required.',
          scenario: 'Provide a scenario key.',
          notes: 'Add implementation notes.',
          mockResponse: 'Supply a JSON response.',
        },
        {},
      ],
    },
  },
};

/**********************
 * EvaluationPlanCard
 **********************/

const evaluationItems: PromptEditorEvaluationPlan[] = [
  {
    evaluator: 'Automatic Policy Check',
    type: 'policy',
    description: 'Ensures the reply adheres to refund policy limits.',
  },
  {
    evaluator: 'Human QA',
    type: 'human',
    description: 'Spot checks random samples for tone mismatches.',
  },
];

const evaluationMeta: Meta<typeof EvaluationPlanCard> = {
  title: 'Prompt Editor/Sections/Evaluation Plan Card',
  component: EvaluationPlanCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configures optional evaluation checks attached to the prompt spec extension contract. Validation enforces evaluator/type completeness.',
      },
    },
  },
  render: (args) => renderCard(<EvaluationPlanCard {...args} />),
  args: {
    enabled: true,
    evaluations: evaluationItems,
  } satisfies Partial<EvaluationPlanCardProps>,
};

export const EvaluationPlanStories = evaluationMeta;

type EvaluationStory = StoryObj<typeof EvaluationPlanCard>;

export const EvaluationDisabled: EvaluationStory = {
  args: {
    enabled: false,
    evaluations: [],
  },
};

export const EvaluationEnabled: EvaluationStory = {};

export const EvaluationErrors: EvaluationStory = {
  args: {
    evaluations: evaluationItems,
    errors: {
      general: 'Evaluation plan contains issues.',
      evaluations: [
        {
          evaluator: 'Evaluator name is required.',
          type: 'Specify evaluator type.',
          description: 'Description helps reviewers understand the check.',
        },
        {},
      ],
    },
  },
};

/**********************
 * MessagesCard
 **********************/

const messageItems: PromptEditorMessage[] = [
  {
    id: 'msg-1',
    role: 'system',
    content: 'You are PromptLM, a helpful assistant.',
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'Summarise the refund eligibility rules.',
  },
];

const messagesMeta: Meta<typeof MessagesCard> = {
  title: 'Prompt Editor/Sections/Messages Card',
  component: MessagesCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Owns prompt conversation messages and run-action entry points. Includes inline error surfacing for message role/name/content constraints.',
      },
    },
  },
  render: (args) =>
    renderCard(
      <MessagesCard
        {...args}
        onTryRun={() => undefined}
        onNavigateBack={() => undefined}
        isBusy={false}
        isSaving={false}
        hasActiveProject
        isActiveProjectLoading={false}
      />,
    ),
  args: {
    messages: messageItems,
    availableRoles: DEFAULT_MESSAGE_ROLES,
  } satisfies Partial<MessagesCardProps>,
};

export const MessagesStories = messagesMeta;

type MessagesStory = StoryObj<typeof MessagesCard>;

export const MessagesEmpty: MessagesStory = {
  args: {
    messages: [],
  },
};

export const MessagesPopulated: MessagesStory = {};

export const MessagesErrors: MessagesStory = {
  args: {
    messages: [
      { id: 'msg-err-1', role: 'tool', name: '', content: '' },
      { id: 'msg-err-2', role: 'assistant', content: '' },
    ],
    errors: {
      general: 'Fix message issues before saving.',
      list: [
        {
          role: 'Select a tool name and ensure role is valid.',
          name: 'Tool messages require a name.',
          content: 'Provide content for this message.',
        },
        {
          content: 'Assistant response cannot be empty.',
        },
      ],
    },
  },
};

/**********************
 * Composite story for convenience
 **********************/

type SectionStackProps = {
  children: React.ReactNode;
};

const SectionStack: React.FC<SectionStackProps> = ({ children }) => (
  <Box maxWidth={960} mx="auto" py={4}>
    <Stack spacing={3}>{children}</Stack>
  </Box>
);

export const AllSections: StoryObj = {
  render: () => (
    <SectionStack>
      <ModelConfigurationCard {...(ModelPopulated.args as ModelConfigurationCardProps)} />
      <PlaceholdersCard {...(PlaceholdersPopulated.args as PlaceholdersCardProps)} />
      <MetadataCard {...(MetadataExpanded.args as MetadataCardProps)} />
      <ToolConfigsCard {...(ToolConfigsPopulated.args as ToolConfigsCardProps)} />
      <EvaluationPlanCard {...(EvaluationEnabled.args as EvaluationPlanCardProps)} />
      <MessagesCard
        {...(MessagesPopulated.args as MessagesCardProps)}
        onTryRun={() => undefined}
        onNavigateBack={() => undefined}
        isBusy={false}
        isSaving={false}
        hasActiveProject
        isActiveProjectLoading={false}
      />
    </SectionStack>
  ),
};
