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
import { DetailSection } from './DetailSection';
import { MetricsStrip } from './MetricsStrip';
import { SAMPLE_METRICS } from './sampleData';

const meta: Meta<typeof DetailSection> = {
  title: 'Prompts v2 / Detail / DetailSection',
  component: DetailSection,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DetailSection>;

export const WithMetrics: Story = {
  render: () => (
    <div style={{ background: 'var(--pl-canvas)' }}>
      <DetailSection num="01" title="Dev execution metrics" anchor="metrics">
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--pl-ink-700)',
            maxWidth: 720,
          }}
        >
          Aggregated across 247 dev runs — local <code>promptlm run</code> invocations and CI
          smoke tests. No production traffic.
        </p>
        <MetricsStrip metrics={SAMPLE_METRICS} />
      </DetailSection>
    </div>
  ),
};
