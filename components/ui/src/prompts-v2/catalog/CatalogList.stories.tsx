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
import { CatalogList } from './CatalogList';
import { SAMPLE_CATALOG } from './sampleData';

const meta: Meta<typeof CatalogList> = {
  title: 'Prompts v2 / Catalog / CatalogList',
  component: CatalogList,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CatalogList>;

export const Default: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 32 }}>
      <CatalogList
        prompts={SAMPLE_CATALOG}
        highlightedId="prm_a47c"
        onSelect={() => undefined}
      />
    </div>
  ),
};

export const WithoutOperational: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 32 }}>
      <CatalogList prompts={SAMPLE_CATALOG} showOperational={false} onSelect={() => undefined} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)', padding: 32 }}>
      <CatalogList
        prompts={[]}
        emptyState={
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              border: '1px dashed var(--pl-ink-300)',
              borderRadius: 14,
              color: 'var(--pl-ink-600)',
              fontSize: 14,
            }}
          >
            No prompts yet — create one to get started.
          </div>
        }
      />
    </div>
  ),
};
