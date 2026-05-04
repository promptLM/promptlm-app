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
import { EditorTopBar } from './EditorTopBar';

const meta: Meta<typeof EditorTopBar> = {
  title: 'Prompts v2 / Editor / EditorTopBar',
  component: EditorTopBar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EditorTopBar>;

const baseBreadcrumb = ['acme · prod', 'prompts', 'doc-rag-answer'];

export const EditMode: Story = {
  render: () => (
    <EditorTopBar
      mode="edit"
      breadcrumb={baseBreadcrumb}
      onSave={() => undefined}
      onRelease={() => undefined}
      onBack={() => undefined}
    />
  ),
};

export const CreateMode: Story = {
  render: () => (
    <EditorTopBar
      mode="create"
      breadcrumb={['acme · prod', 'prompts', 'new prompt']}
      saveLabel="Create prompt"
      onSave={() => undefined}
      onBack={() => undefined}
    />
  ),
};

export const Saving: Story = {
  render: () => (
    <EditorTopBar
      mode="edit"
      breadcrumb={baseBreadcrumb}
      isSaving
      onSave={() => undefined}
      onRelease={() => undefined}
      onBack={() => undefined}
    />
  ),
};

export const WithMessages: Story = {
  render: () => (
    <EditorTopBar
      mode="edit"
      breadcrumb={baseBreadcrumb}
      messages={[
        { severity: 'info', text: 'Repository URL inferred from active project.' },
        { severity: 'error', text: 'Could not save: name already exists in this group.' },
      ]}
      onSave={() => undefined}
      onRelease={() => undefined}
      onBack={() => undefined}
    />
  ),
};
