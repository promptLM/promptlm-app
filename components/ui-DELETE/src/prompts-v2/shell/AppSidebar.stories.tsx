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
import { AppSidebar } from './AppSidebar';
import type { SidebarNavItem } from './types';

const meta: Meta<typeof AppSidebar> = {
  title: 'Prompts v2 / Shell / AppSidebar',
  component: AppSidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AppSidebar>;

const PRIMARY: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫', href: '#/dashboard' },
  { id: 'prompts', label: 'Prompts', icon: '⌘', href: '#/prompts', active: true },
  { id: 'mcp', label: 'MCP', icon: '⌥', disabled: true },
  { id: 'mocks', label: 'Mocks', icon: '◐', disabled: true },
  { id: 'evals', label: 'Evals', icon: '◇', disabled: true, badge: 'PRO' },
  { id: 'runs', label: 'Runs', icon: '▷', disabled: true },
  { id: 'projects', label: 'Projects', icon: '▤', href: '#/projects' },
];

const SECONDARY: SidebarNavItem[] = [
  { id: 'docs', label: 'Docs', icon: '⏚', href: '#/docs' },
  { id: 'settings', label: 'Settings', icon: '◎', href: '#/settings' },
];

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--pl-canvas)' }}>
      <AppSidebar
        brandSubtitle="v0.9.3 · local"
        workspace={{ id: 'acme', initial: 'A', label: 'acme · prod' }}
        primaryNav={PRIMARY}
        secondaryNav={SECONDARY}
        user={{ initials: 'JS', name: 'jamie', email: 'jamie@acme.dev' }}
        onWorkspaceClick={() => undefined}
        onUserClick={() => undefined}
      />
      <div style={{ flex: 1, padding: 24, color: 'var(--pl-ink-700)' }}>
        Main content goes here.
      </div>
    </div>
  ),
};

export const NoWorkspaceNoUser: Story = {
  render: () => (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--pl-canvas)' }}>
      <AppSidebar primaryNav={PRIMARY} secondaryNav={SECONDARY} />
      <div style={{ flex: 1, padding: 24, color: 'var(--pl-ink-700)' }} />
    </div>
  ),
};
