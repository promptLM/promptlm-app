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

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TabStrip, type FormTabId } from './TabStrip';

const meta: Meta<typeof TabStrip> = {
  title: 'Prompts v2 / Form / TabStrip',
  component: TabStrip,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof TabStrip>;

const Frame: React.FC<{ initial: FormTabId; runs?: number }> = ({ initial, runs }) => {
  const [active, setActive] = React.useState<FormTabId>(initial);
  return (
    <div style={{ background: 'var(--pl-canvas)', minHeight: '100vh' }}>
      <div
        style={{
          height: 50,
          background: 'var(--pl-paper)',
          borderBottom: '1px solid var(--pl-ink-200)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'var(--pl-mono)',
          fontSize: 11,
          color: 'var(--pl-ink-500)',
        }}
      >
        sticky header (50px) — strip docks just below
      </div>
      <TabStrip active={active} onChange={setActive} testRunCount={runs} />
      <div style={{ padding: 24, color: 'var(--pl-ink-700)' }}>active = {active}</div>
    </div>
  );
};

export const EditorActive: Story = { render: () => <Frame initial="editor" /> };
export const EditorActiveWithRuns: Story = { render: () => <Frame initial="editor" runs={4} /> };
export const TestActive: Story = { render: () => <Frame initial="test" runs={4} /> };
