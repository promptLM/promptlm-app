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

const mocks = vi.hoisted(() => ({
  useParamsMock: vi.fn(),
  promptEditorPageMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: mocks.useParamsMock,
}));

vi.mock('@/features/prompt-editor/PromptEditorPage', () => ({
  PromptEditorPage: (props: { mode: 'create' | 'edit'; promptId: string | null }) => {
    mocks.promptEditorPageMock(props);
    return React.createElement('div');
  },
}));

import PromptDetail from '../PromptDetail';

describe('PromptDetail', () => {
  beforeEach(() => {
    mocks.useParamsMock.mockReset();
    mocks.promptEditorPageMock.mockReset();
  });

  it('renders the unified prompt editor in edit mode with route prompt id', () => {
    mocks.useParamsMock.mockReturnValue({ id: 'prompt-42' });

    renderToString(React.createElement(PromptDetail));

    expect(mocks.promptEditorPageMock).toHaveBeenCalledTimes(1);
    expect(mocks.promptEditorPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'edit',
        promptId: 'prompt-42',
      }),
    );
  });

  it('passes null prompt id when the route param is missing', () => {
    mocks.useParamsMock.mockReturnValue({});

    renderToString(React.createElement(PromptDetail));

    expect(mocks.promptEditorPageMock).toHaveBeenCalledTimes(1);
    expect(mocks.promptEditorPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'edit',
        promptId: null,
      }),
    );
  });
});
