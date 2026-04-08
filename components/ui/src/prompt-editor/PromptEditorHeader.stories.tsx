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
import { PromptEditorHeader } from './PromptEditorHeader';

const meta: Meta<typeof PromptEditorHeader> = {
  title: 'Prompt Editor/Header',
  component: PromptEditorHeader,
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Create Prompt',
    description: 'Define a new prompt specification aligned with PromptSpec and OpenAI Chat Completion.',
    mode: 'create',
    isBusy: false,
  },
};

export default meta;

type Story = StoryObj<typeof PromptEditorHeader>;

export const CreateMode: Story = {
  args: {
    messages: [
      {
        severity: 'info',
        text: 'Select an active project on the Projects page to create prompts.',
      },
      {
        severity: 'warning',
        text: 'Prompt names must remain unique within the selected project.',
      },
    ],
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    title: 'Edit Prompt',
    description: 'Update prompt metadata, request payload, and automation signals.',
    messages: [
      {
        severity: 'success',
        text: 'Latest changes saved 2 minutes ago.',
      },
    ],
  },
};

export const Releasing: Story = {
  args: {
    mode: 'edit',
    title: 'Release Prompt',
    description: 'Prepare the prompt for publication and downstream use.',
    isBusy: false,
    isReleasing: true,
  },
};

export const LoadingState: Story = {
  args: {
    mode: 'edit',
    title: 'Loading prompt…',
    description: 'Fetching prompt metadata and executions.',
    isBusy: true,
  },
};

export const NoProjectSelected: Story = {
  args: {
    mode: 'create',
    messages: [
      {
        severity: 'warning',
        text: 'Select an active project on the Projects page to create prompts.',
      },
    ],
  },
};

export const CustomActions: Story = {
  render: (args) => (
    <PromptEditorHeader
      {...args}
      mode="edit"
      actionsSlot={
        <Box display="flex" gap={1}>
          <button type="button">Custom primary</button>
          <button type="button">Secondary action</button>
        </Box>
      }
    />
  ),
};
