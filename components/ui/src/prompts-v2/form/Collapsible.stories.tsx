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
import { Collapsible } from './Collapsible';
import { GhostButton } from './atoms';

const meta: Meta<typeof Collapsible> = {
  title: 'Prompts v2 / Form / Collapsible',
  component: Collapsible,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof Collapsible>;

const Filler = () => (
  <div style={{ padding: '6px 0', color: 'var(--pl-ink-700)', fontSize: 13 }}>
    Section content. Click the header (or press enter) to toggle.
  </div>
);

export const Open: Story = {
  args: {
    title: 'Identity',
    hint: 'name + group + description',
    defaultOpen: true,
    children: <Filler />,
  },
};

export const Collapsed: Story = {
  args: {
    title: 'MCP tool mocks',
    hint: '0',
    defaultOpen: false,
    children: <Filler />,
  },
};

export const WithErrorBadge: Story = {
  args: {
    title: 'Model',
    hint: 'openai · gpt-4.1',
    errorCount: 2,
    defaultOpen: true,
    dense: true,
    children: <Filler />,
  },
};

export const WithAction: Story = {
  args: {
    title: 'Placeholders',
    hint: '3',
    defaultOpen: true,
    dense: true,
    action: <GhostButton mini>+ Add</GhostButton>,
    children: <Filler />,
  },
};
