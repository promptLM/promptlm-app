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
import { CatalogFacetRail } from './CatalogFacetRail';
import { SAMPLE_FACETS } from './sampleData';

const meta: Meta<typeof CatalogFacetRail> = {
  title: 'Prompts v2 / Catalog / CatalogFacetRail',
  component: CatalogFacetRail,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CatalogFacetRail>;

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState<Record<string, string | null>>({
      group: 'all',
      vendor: null,
      status: null,
    });
    const groups = SAMPLE_FACETS.map((g) => ({ ...g, activeId: active[g.id] }));
    return (
      <div style={{ width: 232, background: 'var(--pl-canvas)' }}>
        <CatalogFacetRail
          groups={groups}
          onSelect={(groupId, itemId) =>
            setActive((prev) => ({ ...prev, [groupId]: prev[groupId] === itemId ? null : itemId }))
          }
        />
      </div>
    );
  },
};
