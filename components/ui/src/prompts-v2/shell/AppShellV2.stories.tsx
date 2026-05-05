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
import { CatalogFacetRail, CatalogList, CatalogTopBar } from '../catalog';
import { SAMPLE_CATALOG, SAMPLE_FACETS } from '../catalog/sampleData';
import { AppShellV2 } from './AppShellV2';
import { AppSidebar } from './AppSidebar';
import type { SidebarNavItem } from './types';

const meta: Meta<typeof AppShellV2> = {
  title: 'Prompts v2 / Shell / AppShellV2',
  component: AppShellV2,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AppShellV2>;

const PRIMARY: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫', href: '#/dashboard' },
  { id: 'prompts', label: 'Prompts', icon: '⌘', href: '#/prompts', active: true },
  { id: 'projects', label: 'Projects', icon: '▤', href: '#/projects' },
];
const SECONDARY: SidebarNavItem[] = [
  { id: 'docs', label: 'Docs', icon: '⏚', href: '#/docs' },
  { id: 'settings', label: 'Settings', icon: '◎', href: '#/settings' },
];

export const PromptCatalog: Story = {
  render: () => {
    const [q, setQ] = useState('');
    return (
      <AppShellV2
        sidebar={
          <AppSidebar
            brandSubtitle="v0.9.3 · local"
            workspace={{ id: 'acme', initial: 'A', label: 'acme · prod' }}
            primaryNav={PRIMARY}
            secondaryNav={SECONDARY}
            user={{ initials: 'JS', name: 'jamie', email: 'jamie@acme.dev' }}
          />
        }
      >
        <CatalogTopBar
          breadcrumb={['acme · prod', 'prompts']}
          searchQuery={q}
          onSearchChange={setQ}
          onSync={() => undefined}
          onNewPrompt={() => undefined}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '212px 1fr',
            flex: 1,
            minHeight: 0,
          }}
        >
          <CatalogFacetRail groups={SAMPLE_FACETS} />
          <main style={{ padding: '24px 32px 64px' }}>
            <CatalogList
              prompts={SAMPLE_CATALOG}
              highlightedId="prm_a47c"
              onSelect={() => undefined}
            />
          </main>
        </div>
      </AppShellV2>
    );
  },
};
