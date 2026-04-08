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
import { Box } from '@mui/material';
import { PromptEditorTabs } from './PromptEditorTabs';
import type { PromptEditorTab } from './types';

const meta: Meta<typeof PromptEditorTabs> = {
  title: 'Prompt Editor/Tabs',
  component: PromptEditorTabs,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof PromptEditorTabs>;

const defaultTabs = [
  { value: 'editor' as PromptEditorTab, label: 'Editor' },
  { value: 'preview' as PromptEditorTab, label: 'Preview', badge: 2 },
  { value: 'test' as PromptEditorTab, label: 'Test (coming soon)', disabled: true },
  { value: 'history' as PromptEditorTab, label: 'History' },
];

export const Default: Story = {
  args: {
    tabs: defaultTabs,
    value: 'editor',
  },
};

export const PreviewWithExecutions: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<PromptEditorTab>('preview');
    const [selected, setSelected] = React.useState('execution-2');

    return (
      <Box>
        <PromptEditorTabs
          {...args}
          tabs={defaultTabs}
          value={value}
          onChange={setValue}
          executionOptions={{
            selectedId: selected,
            options: [
              { id: 'execution-1', label: 'Manual run', helperText: '5 min ago' },
              { id: 'execution-2', label: 'E2E smoke test', helperText: '12 min ago' },
              { id: 'execution-3', label: 'Canary release', helperText: '45 min ago' },
            ],
            onSelect: setSelected,
          }}
          tabPanelSlot={
            <Box sx={{ p: 2, border: (theme) => `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
              Preview content for <strong>{selected}</strong>
            </Box>
          }
        />
      </Box>
    );
  },
};
