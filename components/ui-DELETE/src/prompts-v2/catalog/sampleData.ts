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
//
// Lifted from design/handoff/webui/src/catalog-and-detail.jsx and adapted
// to the CatalogRowItem shape. Used only by Storybook stories.

import type { CatalogFacetGroupSpec, CatalogRowItem } from './types';

const seriesAround = (base: number, key: string): number[] =>
  Array.from({ length: 20 }, (_, i) => base + Math.sin(i * 0.7 + key.charCodeAt(0)) * 0.025);

export const SAMPLE_CATALOG: CatalogRowItem[] = [
  {
    id: 'prm_8f3a',
    name: 'support-triage-classifier',
    description:
      'Classify inbound support tickets into priority + topic. Used by the routing pipeline.',
    version: '2.4.1',
    revision: 17,
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    status: 'production',
    placeholders: 4,
    messages: 3,
    updatedAt: '2 hrs ago',
    tags: ['classifier', 'routing'],
    executions: 1240,
    successRate: 0.984,
    successSeries: seriesAround(0.984, 'a'),
    avgLatencyMs: 612,
    p95LatencyMs: 1180,
  },
  {
    id: 'prm_2d91',
    name: 'doc-rag-answer',
    description:
      'Answer questions over a doc corpus with citations. Strict refusal when context is insufficient.',
    version: '1.8.0',
    revision: 33,
    vendor: 'openai',
    model: 'gpt-4.1',
    status: 'production',
    placeholders: 6,
    messages: 4,
    updatedAt: '5 hrs ago',
    tags: ['rag', 'citations'],
    executions: 8420,
    successRate: 0.961,
    successSeries: seriesAround(0.961, 'b'),
    avgLatencyMs: 1840,
    p95LatencyMs: 3200,
  },
  {
    id: 'prm_a47c',
    name: 'mcp-tool-router',
    description: 'Decide which MCP tool to invoke given user intent + available tool catalog.',
    version: '0.9.3',
    revision: 8,
    vendor: 'anthropic',
    model: 'claude-haiku-4-5',
    status: 'production',
    placeholders: 3,
    messages: 2,
    updatedAt: 'just now',
    tags: ['mcp', 'router'],
    executions: 22106,
    successRate: 0.992,
    successSeries: seriesAround(0.992, 'c'),
    avgLatencyMs: 380,
    p95LatencyMs: 720,
  },
  {
    id: 'prm_5e22',
    name: 'sql-query-generator',
    description:
      'Generate parameterised SQL from a natural-language question and a schema snapshot.',
    version: '3.1.0',
    revision: 24,
    vendor: 'openai',
    model: 'gpt-4.1',
    status: 'staging',
    placeholders: 5,
    messages: 3,
    updatedAt: 'yesterday',
    tags: ['sql', 'codegen'],
    executions: 612,
    successRate: 0.94,
    successSeries: seriesAround(0.94, 'd'),
    avgLatencyMs: 2210,
    p95LatencyMs: 4100,
  },
  {
    id: 'prm_c731',
    name: 'pii-redactor',
    description:
      'Detect and redact PII from free-form text before logging or downstream LLM calls.',
    version: '2.0.0',
    revision: 41,
    vendor: 'anthropic',
    model: 'claude-haiku-4-5',
    status: 'production',
    placeholders: 1,
    messages: 2,
    updatedAt: '6 hrs ago',
    tags: ['safety', 'pii'],
    executions: 51820,
    successRate: 0.999,
    successSeries: seriesAround(0.999, 'e'),
    avgLatencyMs: 240,
    p95LatencyMs: 410,
  },
  {
    id: 'prm_e483',
    name: 'onboarding-copy-rewriter',
    description:
      'Rewrite onboarding copy for a target persona while preserving every CTA and link.',
    version: '0.2.0',
    revision: 3,
    vendor: 'anthropic',
    model: 'claude-sonnet-4-5',
    status: 'experimental',
    placeholders: 3,
    messages: 2,
    updatedAt: '4 days ago',
    tags: ['copy', 'a/b'],
    executions: 12,
    successRate: 0.917,
    successSeries: seriesAround(0.917, 'f'),
    avgLatencyMs: 2840,
    p95LatencyMs: 3900,
  },
];

export const SAMPLE_FACETS: CatalogFacetGroupSpec[] = [
  {
    id: 'group',
    label: 'Group',
    activeId: 'all',
    items: [
      { id: 'all', label: 'All prompts', count: SAMPLE_CATALOG.length },
      { id: 'support', label: 'Support', count: 1 },
      { id: 'rag', label: 'RAG', count: 1 },
      { id: 'agents', label: 'Agents', count: 1 },
      { id: 'data', label: 'Data', count: 1 },
      { id: 'safety', label: 'Safety', count: 1 },
      { id: 'content', label: 'Content', count: 1 },
    ],
  },
  {
    id: 'vendor',
    label: 'Vendor',
    items: [
      { id: 'anthropic', label: 'Anthropic', count: 4 },
      { id: 'openai', label: 'OpenAI', count: 2 },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    items: [
      { id: 'production', label: 'Production', count: 4, dot: 'var(--pl-ok)' },
      { id: 'staging', label: 'Staging', count: 1, dot: 'var(--pl-warn)' },
      { id: 'experimental', label: 'Experimental', count: 1, dot: 'var(--pl-ink-500)' },
    ],
  },
];
