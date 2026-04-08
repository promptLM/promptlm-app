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

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import {
  MetadataCard,
  ModelConfigurationCard,
  PlaceholdersCard,
  PromptEditorTabsLayout,
  ToolConfigsCard,
  type PromptEditorRequestDraft,
  type PromptEditorToolConfig,
} from '@promptlm/ui';

const requestDraft: PromptEditorRequestDraft = {
  vendor: 'openai',
  model: 'gpt-4o',
  modelSnapshot: '2026-03-01',
  url: 'https://api.example.com/v1/chat/completions',
  parameters: {
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 512,
    stream: false,
  },
  messages: [{ id: 'user-1', role: 'user', content: 'Hello' }],
};

describe('PromptEditor section components', () => {
  it('exposes disclosure aria attributes for advanced model parameters', () => {
    const collapsedHtml = renderToString(
      <ModelConfigurationCard
        request={requestDraft}
        showAdvancedParameters={false}
        onToggleAdvancedParameters={() => {}}
        onRequestChange={() => {}}
        onParameterChange={() => {}}
        onStreamChange={() => {}}
      />,
    );
    const expandedHtml = renderToString(
      <ModelConfigurationCard
        request={requestDraft}
        showAdvancedParameters={true}
        onToggleAdvancedParameters={() => {}}
        onRequestChange={() => {}}
        onParameterChange={() => {}}
        onStreamChange={() => {}}
      />,
    );

    expect(collapsedHtml).toContain('id="model-config-advanced-parameters-toggle"');
    expect(collapsedHtml).toContain('aria-controls="model-config-advanced-parameters"');
    expect(collapsedHtml).toContain('aria-expanded="false"');
    expect(expandedHtml).toContain('aria-expanded="true"');
    expect(expandedHtml).toContain('id="model-config-advanced-parameters"');
    expect(expandedHtml).toContain('role="region"');
  });

  it('exposes disclosure aria attributes for metadata details and placeholder list', () => {
    const metadataHtml = renderToString(
      <MetadataCard
        group="support"
        name="welcome"
        description="Prompt description"
        authorsDisplay="PromptLM Bot"
        promptPath="prompts/support/welcome/promptlm.yml"
        versionLabel="0.1.0"
        revision={2}
        showMetadataDetails={true}
        onToggleMetadataDetails={() => {}}
        onGroupChange={() => {}}
        onNameChange={() => {}}
        onDescriptionChange={() => {}}
      />,
    );
    const placeholdersHtml = renderToString(
      <PlaceholdersCard
        placeholders={{
          startPattern: '{{',
          endPattern: '}}',
          list: [{ name: 'customer_name', value: 'Taylor' }],
        }}
        showPlaceholders={true}
        onTogglePlaceholders={() => {}}
        onAddPlaceholder={() => {}}
        onRemovePlaceholder={() => {}}
        onPlaceholderChange={() => {}}
        onPlaceholderPatternChange={() => {}}
      />,
    );

    expect(metadataHtml).toContain('id="metadata-details-toggle"');
    expect(metadataHtml).toContain('aria-controls="metadata-details-region"');
    expect(metadataHtml).toContain('aria-expanded="true"');
    expect(metadataHtml).toContain('id="metadata-details-region"');
    expect(metadataHtml).toContain('tabindex="-1"');

    expect(placeholdersHtml).toContain('id="placeholder-list-toggle"');
    expect(placeholdersHtml).toContain('aria-controls="placeholder-list-region"');
    expect(placeholdersHtml).toContain('aria-expanded="true"');
    expect(placeholdersHtml).toContain('id="placeholder-list-region"');
  });

  it('renders inline tool configuration validation messages', () => {
    const configs: PromptEditorToolConfig[] = [
      {
        id: 'tool-1',
        name: '',
        scenario: '',
        notes: '',
        mockResponse: '',
      },
    ];

    const html = renderToString(
      <ToolConfigsCard
        configs={configs}
        onAddConfig={() => {}}
        onRemoveConfig={() => {}}
        onConfigChange={() => {}}
        errors={{
          general: 'Complete required tool configuration fields before saving or running.',
          configs: [
            {
              name: 'Tool name is required.',
              scenario: 'Scenario label is required.',
              notes: 'Tool description is required.',
              mockResponse: 'Mock response preview is required.',
            },
          ],
        }}
      />,
    );

    expect(html).toContain('Complete required tool configuration fields before saving or running.');
    expect(html).toContain('Tool name is required.');
    expect(html).toContain('Scenario label is required.');
    expect(html).toContain('Tool description is required.');
    expect(html).toContain('Mock response preview is required.');
  });

  it('renders preview execution selection options and helper text', () => {
    const html = renderToString(
      <PromptEditorTabsLayout
        tabs={[
          { value: 'editor', label: 'Editor' },
          { value: 'preview', label: 'Preview', badge: 2 },
        ]}
        activeTab="preview"
        onChangeTab={() => {}}
        executions={{
          selectedId: 'execution-2',
          options: [
            { id: 'execution-1', label: '10:12', helperText: 'Latest' },
            { id: 'execution-2', label: '10:03' },
          ],
          onSelect: () => {},
        }}
      />,
    );

    expect(html).toContain('10:12');
    expect(html).toContain('Latest');
    expect(html).toContain('10:03');
  });
});
