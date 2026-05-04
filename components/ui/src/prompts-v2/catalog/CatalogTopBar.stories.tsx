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
import { useState } from 'react';
import { CatalogTopBar } from './CatalogTopBar';

const meta: Meta<typeof CatalogTopBar> = {
  title: 'Prompts v2 / Catalog / CatalogTopBar',
  component: CatalogTopBar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CatalogTopBar>;

export const Default: Story = {
  render: () => {
    const [q, setQ] = useState('');
    return (
      <CatalogTopBar
        breadcrumb={['acme · prod', 'prompts']}
        searchQuery={q}
        onSearchChange={setQ}
        onSync={() => undefined}
        onNewPrompt={() => undefined}
      />
    );
  },
};

export const Syncing: Story = {
  render: () => (
    <CatalogTopBar
      breadcrumb={['acme · prod', 'prompts']}
      searchQuery="rag"
      onSearchChange={() => undefined}
      onSync={() => undefined}
      onNewPrompt={() => undefined}
      syncing
    />
  ),
};

export const NoActions: Story = {
  render: () => (
    <CatalogTopBar
      breadcrumb={['acme · prod', 'prompts']}
      searchQuery=""
      onSearchChange={() => undefined}
    />
  ),
};
