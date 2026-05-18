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

/**
 * Tests for the Release CTA on the prompt detail page (issue #186).
 *
 * Asserts the HTML markup directly via `renderToString` — same pattern as the
 * Dashboard test in this directory — so the suite has no DOM dependency and
 * runs anywhere vitest does. Behavior we care about:
 *
 * - Release button exists in the detail-page topbar.
 * - Button is disabled and surfaces "No changes since last release" when the
 *   current revision matches the latest released revision.
 * - Button is enabled for a prompt that has never been released.
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { PromptSpec } from '@promptlm/api-client';

const mocks = vi.hoisted(() => ({
  usePromptDetailsMock: vi.fn(),
  useActiveProjectMock: vi.fn(),
  useGeneratedApiClientMock: vi.fn(),
  useToastMock: vi.fn(),
  useParamsMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: mocks.useParamsMock,
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string } & Record<string, unknown>) =>
    React.createElement('a', { href: to, ...rest }, children),
}));

vi.mock('@/api/hooks', () => ({
  usePromptDetails: mocks.usePromptDetailsMock,
  useActiveProject: mocks.useActiveProjectMock,
}));

vi.mock('@api-common/generatedClientProvider', () => ({
  useGeneratedApiClient: mocks.useGeneratedApiClientMock,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: mocks.useToastMock,
}));

const baseSpec = (overrides: Partial<PromptSpec> = {}): PromptSpec =>
  ({
    id: 'group/sample',
    uuid: 'uuid-1',
    name: 'sample',
    group: 'group',
    version: '1.0.0',
    revision: 1,
    description: 'A sample prompt',
    status: 'ACTIVE',
    request: {
      type: 'chat/completion',
      vendor: 'openai',
      model: 'gpt-4o',
      messages: [],
    },
    placeholders: { list: [] },
    executions: [],
    ...overrides,
  } as unknown as PromptSpec);

import PromptDetail from '../PromptDetail';

const renderPage = () => renderToString(<PromptDetail />);

describe('PromptDetail Release button (#186)', () => {
  afterEach(() => {
    mocks.usePromptDetailsMock.mockReset();
    mocks.useActiveProjectMock.mockReset();
    mocks.useGeneratedApiClientMock.mockReset();
    mocks.useToastMock.mockReset();
    mocks.useParamsMock.mockReset();
  });

  const mountWithSpec = (spec: PromptSpec) => {
    mocks.useParamsMock.mockReturnValue({ id: spec.id });
    mocks.usePromptDetailsMock.mockReturnValue({
      data: spec,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    mocks.useActiveProjectMock.mockReturnValue({ activeProject: null });
    mocks.useGeneratedApiClientMock.mockReturnValue({
      promptSpecs: {
        executeStoredPrompt: vi.fn(),
        releasePrompt: vi.fn(),
      },
    });
    mocks.useToastMock.mockReturnValue({ toast: vi.fn() });
  };

  it('renders the Release button on the detail topbar (AC-1)', () => {
    mountWithSpec(baseSpec());

    const html = renderPage();

    expect(html).toContain('data-testid="prompt-detail-release-action"');
    expect(html).toContain('Release');
  });

  it('enables Release for a prompt that has never been released (AC-3)', () => {
    mountWithSpec(baseSpec());

    const html = renderPage();

    // No `disabled` attribute on the action button.
    const buttonMatch = html.match(
      /<button[^>]*data-testid="prompt-detail-release-action"[^>]*>/,
    );
    expect(buttonMatch).not.toBeNull();
    expect(buttonMatch![0]).not.toContain('disabled=""');
    // No tooltip on the wrapping span.
    expect(html).not.toContain('No changes since last release');
  });

  it('disables Release with the canonical tooltip when hashes match (AC-2 + AC-4)', () => {
    mountWithSpec(
      baseSpec({
        semanticHash: 'matching-hash',
        extensions: {
          'x-promptlm': {
            release: {
              state: 'released',
              mode: 'direct',
              version: '1.0.0',
              releasedSemanticHash: 'matching-hash',
            },
          },
        } as unknown as PromptSpec['extensions'],
      }),
    );

    const html = renderPage();

    // Wrapping span surfaces the disabled tooltip.
    expect(html).toContain('title="No changes since last release"');
    // The button is rendered as disabled.
    const buttonMatch = html.match(
      /<button[^>]*data-testid="prompt-detail-release-action"[^>]*>/,
    );
    expect(buttonMatch).not.toBeNull();
    expect(buttonMatch![0]).toContain('disabled=""');
  });

  it('enables Release when current revision differs from the released hash (AC-3)', () => {
    mountWithSpec(
      baseSpec({
        semanticHash: 'new-hash',
        extensions: {
          'x-promptlm': {
            release: {
              state: 'released',
              mode: 'direct',
              version: '1.0.0',
              releasedSemanticHash: 'old-released-hash',
            },
          },
        } as unknown as PromptSpec['extensions'],
      }),
    );

    const html = renderPage();

    const buttonMatch = html.match(
      /<button[^>]*data-testid="prompt-detail-release-action"[^>]*>/,
    );
    expect(buttonMatch).not.toBeNull();
    expect(buttonMatch![0]).not.toContain('disabled=""');
    expect(html).not.toContain('No changes since last release');
  });
});
