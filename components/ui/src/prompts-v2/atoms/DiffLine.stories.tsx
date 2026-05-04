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
import { DiffLine } from './DiffLine';

const meta: Meta<typeof DiffLine> = {
  title: 'Prompts v2 / Atoms / DiffLine',
  component: DiffLine,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DiffLine>;

export const InCodeBlock: Story = {
  render: () => (
    <pre
      style={{
        margin: 0,
        padding: '14px 16px',
        fontFamily: 'var(--pl-mono)',
        fontSize: 12.5,
        lineHeight: 1.7,
        color: 'var(--pl-ink-800)',
        whiteSpace: 'pre-wrap',
        background: 'var(--pl-paper)',
        border: '1px solid var(--pl-ink-200)',
        borderRadius: 10,
        width: 520,
      }}
    >
      You are a tool router for the assistant.{'\n'}
      <DiffLine kind="add">Decide which MCP tool to call given the catalogue.</DiffLine>
      {'\n'}
      <DiffLine kind="del">Pick the right MCP tool given the catalogue.</DiffLine>
      {'\n'}
      <DiffLine kind="add">If no tool fits, refuse — do not invent a call.</DiffLine>
      {'\n'}
      Reply with a single JSON object.
    </pre>
  ),
};
