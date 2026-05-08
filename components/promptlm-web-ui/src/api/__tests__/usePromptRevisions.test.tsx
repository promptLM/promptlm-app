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

/** @vitest-environment jsdom */

import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

import type { Revision } from '@promptlm/api-client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  useGeneratedApiClientMock: vi.fn(),
  featureFlagsMock: { revisionHistory: false },
}));

vi.mock('@api-common/generatedClientProvider', () => ({
  useGeneratedApiClient: mocks.useGeneratedApiClientMock,
}));

vi.mock('@/lib/featureFlags', () => ({
  featureFlags: mocks.featureFlagsMock,
}));

vi.mock('@api-common/projects/ProjectsContext', () => ({
  useProjectsContext: vi.fn(),
}));

import { usePromptRevisions } from '@/api/hooks';

type HookHandle<T> = {
  current: () => T;
  unmount: () => Promise<void>;
};

const waitFor = async (assertion: () => void, timeoutMs = 1_500): Promise<void> => {
  const startedAt = Date.now();
  while (true) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - startedAt >= timeoutMs) {
        throw error;
      }
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }
  }
};

const renderHook = async <T,>(hook: () => T): Promise<HookHandle<T>> => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: T | null = null;

  const Probe = () => {
    const value = hook();

    React.useEffect(() => {
      latest = value;
    }, [value]);

    return null;
  };

  await act(async () => {
    root.render(<Probe />);
  });

  return {
    current: () => {
      if (latest === null) {
        throw new Error('Hook value is not available yet');
      }
      return latest;
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

const createServicesStub = () => ({
  promptSpecs: {
    listPromptSpecs: vi.fn(),
    getById: vi.fn(),
    getDefaultTemplate: vi.fn(),
    getPromptStats: vi.fn(),
    createPromptSpec: vi.fn(),
    updatePromptSpec: vi.fn(),
    getRevisionsByGroupAndName: vi.fn(),
  },
  promptStore: {} as never,
  capabilities: { getCapabilities: vi.fn() },
  modelCatalog: { getCatalog: vi.fn() },
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.featureFlagsMock.revisionHistory = false;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('usePromptRevisions', () => {
  it('does not call the service when the revisionHistory flag is off', async () => {
    const services = createServicesStub();
    services.promptSpecs.getRevisionsByGroupAndName.mockResolvedValue([]);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => usePromptRevisions('support/welcome'));

    try {
      await waitFor(() => {
        expect(hook.current().isLoading).toBe(false);
      });
      expect(hook.current().data).toBeNull();
      expect(hook.current().error).toBeNull();
      expect(services.promptSpecs.getRevisionsByGroupAndName).not.toHaveBeenCalled();
    } finally {
      await hook.unmount();
    }
  });

  it('fetches revisions split into group/name when the flag is on', async () => {
    mocks.featureFlagsMock.revisionHistory = true;
    const services = createServicesStub();
    const revisions = [
      { rev: 'r2', sha: 'aaa', kind: 'edit' },
      { rev: 'r1', sha: 'bbb', kind: 'add' },
    ] as Revision[];
    services.promptSpecs.getRevisionsByGroupAndName.mockResolvedValue(revisions);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => usePromptRevisions('support/welcome'));

    try {
      await waitFor(() => {
        expect(hook.current().data).toEqual(revisions);
      });
      expect(services.promptSpecs.getRevisionsByGroupAndName)
          .toHaveBeenCalledWith('support', 'welcome');
    } finally {
      await hook.unmount();
    }
  });

  it('skips the service call when the id is missing or malformed', async () => {
    mocks.featureFlagsMock.revisionHistory = true;
    const services = createServicesStub();
    services.promptSpecs.getRevisionsByGroupAndName.mockResolvedValue([]);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    for (const id of [null, undefined, '', 'no-slash', '/leading-slash', 'trailing-slash/']) {
      const hook = await renderHook(() => usePromptRevisions(id as string | null | undefined));
      try {
        await waitFor(() => {
          expect(hook.current().isLoading).toBe(false);
        });
      } finally {
        await hook.unmount();
      }
    }

    expect(services.promptSpecs.getRevisionsByGroupAndName).not.toHaveBeenCalled();
  });

  it('skips the service call when the caller passes enabled: false', async () => {
    mocks.featureFlagsMock.revisionHistory = true;
    const services = createServicesStub();
    services.promptSpecs.getRevisionsByGroupAndName.mockResolvedValue([]);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() =>
      usePromptRevisions('support/welcome', { enabled: false }),
    );

    try {
      await waitFor(() => {
        expect(hook.current().isLoading).toBe(false);
      });
      expect(services.promptSpecs.getRevisionsByGroupAndName).not.toHaveBeenCalled();
    } finally {
      await hook.unmount();
    }
  });
});
