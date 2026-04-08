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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { PromptSpec } from '@promptlm/api-client';

const mocks = vi.hoisted(() => ({
  usePromptDetailsMock: vi.fn(),
  usePromptDraftTemplateMock: vi.fn(),
  usePromptMutationsMock: vi.fn(),
  useActiveProjectMock: vi.fn(),
  useGeneratedApiClientMock: vi.fn(),
}));

vi.mock('@/api/hooks', () => ({
  usePromptDetails: mocks.usePromptDetailsMock,
  usePromptDraftTemplate: mocks.usePromptDraftTemplateMock,
  usePromptMutations: mocks.usePromptMutationsMock,
  useActiveProject: mocks.useActiveProjectMock,
}));

vi.mock('@api-common/generatedClientProvider', () => ({
  useGeneratedApiClient: mocks.useGeneratedApiClientMock,
}));

import { usePromptEditorData } from '../usePromptEditorData';

describe('usePromptEditorData', () => {
  beforeEach(() => {
    mocks.usePromptDetailsMock.mockReset();
    mocks.usePromptDraftTemplateMock.mockReset();
    mocks.usePromptMutationsMock.mockReset();
    mocks.useActiveProjectMock.mockReset();
    mocks.useGeneratedApiClientMock.mockReset();
  });

  it('exposes backend draft template state in create mode', () => {
    const template = {
      id: 'template-1',
      name: 'support-prompt',
      group: 'support',
      request: {
        type: 'chat/completion',
        vendor: 'openai',
        model: 'gpt-4o',
        messages: [],
      },
    } as PromptSpec;

    const refreshPromptTemplate = vi.fn();
    mocks.usePromptDetailsMock.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      refresh: vi.fn(),
    });
    mocks.usePromptDraftTemplateMock.mockReturnValue({
      data: template,
      error: null,
      isLoading: false,
      refresh: refreshPromptTemplate,
    });
    mocks.usePromptMutationsMock.mockReturnValue({
      createPrompt: vi.fn(),
      updatePrompt: vi.fn(),
      isSaving: false,
      error: null,
    });
    mocks.useActiveProjectMock.mockReturnValue({
      activeProject: null,
      activeProjectId: null,
      error: null,
      isLoading: false,
    });
    mocks.useGeneratedApiClientMock.mockReturnValue({
      promptSpecs: {
        releasePrompt: vi.fn(),
        executePrompt: vi.fn(),
        executeStoredPrompt: vi.fn(),
      },
    });

    let captured: ReturnType<typeof usePromptEditorData> | null = null;
    const Probe = () => {
      captured = usePromptEditorData({ mode: 'create', promptId: null });
      return React.createElement('div');
    };
    renderToString(React.createElement(Probe));

    expect(captured).not.toBeNull();
    expect(captured?.promptTemplate).toEqual(template);
    expect(captured?.promptTemplateError).toBeNull();
    expect(captured?.isPromptTemplateLoading).toBe(false);
    expect(captured?.refreshPromptTemplate).toBe(refreshPromptTemplate);
  });
});
