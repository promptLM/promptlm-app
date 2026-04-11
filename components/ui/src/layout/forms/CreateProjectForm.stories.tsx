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
import { CreateProjectForm } from './CreateProjectForm';

const meta: Meta<typeof CreateProjectForm> = {
  title: 'Layout/Forms/CreateProjectForm',
  component: CreateProjectForm,
  parameters: {
    layout: 'centered',
  },
  args: {
    onSubmit: () => undefined,
    initialValues: {
      repoName: 'promptlm-studio',
      parentDirectory: '/Users/alex/workspaces',
      description: 'Workspace for prompt experimentation',
    },
  },
};

export default meta;

type Story = StoryObj<typeof CreateProjectForm>;

export const Default: Story = {};

export const WithOwners: Story = {
  args: {
    owners: [
      { id: 'user-1', displayName: 'Alex Mercer', type: 'USER' },
      { id: 'org-1', displayName: 'PromptLM Labs', type: 'ORGANIZATION' },
    ],
  },
};

export const WithError: Story = {
  args: {
    error: 'Failed to create the repository in the selected directory.',
  },
};
