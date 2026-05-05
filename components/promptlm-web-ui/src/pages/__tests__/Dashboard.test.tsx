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

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { PromptSpec, PromptStats } from '@promptlm/api-client';

const mocks = vi.hoisted(() => ({
  useDashboardSummary: vi.fn(),
  usePrompts: vi.fn(),
  useNavigate: vi.fn(() => () => undefined),
}));

vi.mock('@/api/hooks', () => ({
  useDashboardSummary: mocks.useDashboardSummary,
  usePrompts: mocks.usePrompts,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: mocks.useNavigate,
}));

const asyncState = <T,>(overrides: {
  data?: T;
  isLoading?: boolean;
  error?: Error;
} = {}) => ({
  data: overrides.data,
  isLoading: overrides.isLoading ?? false,
  error: overrides.error,
  refresh: () => undefined,
});

import Dashboard from '../Dashboard';

describe('Dashboard', () => {
  afterEach(() => {
    mocks.useDashboardSummary.mockReset();
    mocks.usePrompts.mockReset();
  });

  it('renders the empty state when there are no prompts', () => {
    mocks.useDashboardSummary.mockReturnValue(asyncState<PromptStats>({}));
    mocks.usePrompts.mockReturnValue(asyncState<PromptSpec[]>({ data: [] }));

    const html = renderToString(<Dashboard />);

    expect(html).toContain('What changed');
    expect(html).toContain('No activity in this window');
    expect(html).toContain('Nothing open right now');
    expect(html).toContain('New prompt');
    expect(html).toContain('Browse catalog');
  });

  it('renders the inline error banner when both hooks fail', () => {
    mocks.useDashboardSummary.mockReturnValue(
      asyncState<PromptStats>({ error: new Error('stats down') }),
    );
    mocks.usePrompts.mockReturnValue(
      asyncState<PromptSpec[]>({ error: new Error('prompts down') }),
    );

    const html = renderToString(<Dashboard />);

    // React's renderToString interleaves <!-- --> markers between adjacent
    // text nodes, so check the prefix and the dynamic message separately.
    expect(html).toContain('Failed to load corpus stats:');
    expect(html).toContain('stats down');
    expect(html).toContain('Failed to load prompts:');
    expect(html).toContain('prompts down');
  });

  it('renders activity rows and group chips from real data', () => {
    mocks.useDashboardSummary.mockReturnValue(
      asyncState<PromptStats>({
        data: {
          totalPrompts: 2,
          activePrompts: 2,
          retiredPrompts: 0,
          countByGroup: { rag: 1, support: 1 },
        },
      }),
    );
    mocks.usePrompts.mockReturnValue(
      asyncState<PromptSpec[]>({
        data: [
          {
            id: 'doc-rag-answer',
            name: 'doc-rag-answer',
            group: 'rag',
            status: 'ACTIVE',
            revision: 0,
            version: '1.8.0',
            updatedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
            executions: [],
          },
          {
            id: 'support-triage',
            name: 'support-triage',
            group: 'support',
            status: 'ACTIVE',
            revision: 0,
            version: '2.4.1',
            updatedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
            executions: [],
          },
        ],
      }),
    );

    const html = renderToString(<Dashboard />);

    expect(html).toContain('doc-rag-answer');
    expect(html).toContain('1.8.0');
    expect(html).toContain('support-triage');
    expect(html).toContain('rag');
    expect(html).toContain('support');
    // Filter chips are rendered with counts
    expect(html).toContain('releases');
    expect(html).toContain('runs');
    expect(html).toContain('drafts');
    // Time-window selector
    expect(html).toContain('last 24h');
    expect(html).toContain('last 7 days');
  });

  it('flags untested released prompts in the open-work rail', () => {
    mocks.useDashboardSummary.mockReturnValue(asyncState<PromptStats>({}));
    mocks.usePrompts.mockReturnValue(
      asyncState<PromptSpec[]>({
        data: [
          {
            id: 'never-run',
            name: 'never-run',
            group: 'content',
            status: 'ACTIVE',
            revision: 0,
            updatedAt: new Date().toISOString(),
            executions: [],
          },
        ],
      }),
    );

    const html = renderToString(<Dashboard />);

    expect(html).toContain('never-run');
    expect(html).toContain('Never run · no executions captured');
    expect(html).toContain('Open prompt');
  });
});
