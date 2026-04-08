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

import type {
  Capabilities,
  ModelCatalogResponse,
  ProjectSpec,
  PromptSpec,
  PromptSpecCreationRequest,
  PromptStats,
} from '@promptlm/api-client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  useGeneratedApiClientMock: vi.fn(),
  useProjectsContextMock: vi.fn(),
}));

vi.mock('@api-common/generatedClientProvider', () => ({
  useGeneratedApiClient: mocks.useGeneratedApiClientMock,
}));

vi.mock('@api-common/projects/ProjectsContext', () => ({
  useProjectsContext: mocks.useProjectsContextMock,
}));

import {
  useActiveProject,
  useCapabilities,
  useDashboardSummary,
  useModelCatalog,
  usePromptDetails,
  usePromptDraftTemplate,
  usePromptMutations,
  usePrompts,
  useProjects,
} from '@/api/hooks';

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

const createGeneratedClientStub = () => {
  return {
    promptSpecs: {
      listPromptSpecs: vi.fn(),
      getById: vi.fn(),
      getDefaultTemplate: vi.fn(),
      getPromptStats: vi.fn(),
      createPromptSpec: vi.fn(),
      updatePromptSpec: vi.fn(),
    },
    promptStore: {} as never,
    capabilities: {
      getCapabilities: vi.fn(),
    },
    modelCatalog: {
      getCatalog: vi.fn(),
    },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('generated API hooks', () => {
  it('loads model catalog via generated service and exposes refresh', async () => {
    const services = createGeneratedClientStub();
    const initialCatalog = { vendors: [{ name: 'OpenAI', models: [] }] } as unknown as ModelCatalogResponse;
    const refreshedCatalog = { vendors: [{ name: 'Anthropic', models: [] }] } as unknown as ModelCatalogResponse;

    services.modelCatalog.getCatalog.mockResolvedValue(initialCatalog);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => useModelCatalog());

    try {
      await waitFor(() => {
        expect(hook.current().data).toEqual(initialCatalog);
      });
      expect(services.modelCatalog.getCatalog).toHaveBeenCalledTimes(1);

      services.modelCatalog.getCatalog.mockResolvedValueOnce(refreshedCatalog);

      await act(async () => {
        await hook.current().refresh();
      });

      await waitFor(() => {
        expect(hook.current().data).toEqual(refreshedCatalog);
      });
      expect(services.modelCatalog.getCatalog).toHaveBeenCalledTimes(2);
    } finally {
      await hook.unmount();
    }
  });

  it('loads prompts using generated PromptSpecifications service', async () => {
    const services = createGeneratedClientStub();
    const prompts = [{ id: 'prompt-1', name: 'Support Prompt' }] as PromptSpec[];

    services.promptSpecs.listPromptSpecs.mockResolvedValue(prompts);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => usePrompts());

    try {
      await waitFor(() => {
        expect(hook.current().data).toEqual(prompts);
      });
      expect(hook.current().error).toBeNull();
      expect(services.promptSpecs.listPromptSpecs).toHaveBeenCalledTimes(1);
    } finally {
      await hook.unmount();
    }
  });

  it('guards prompt details fetch when id is missing, then loads by id', async () => {
    const services = createGeneratedClientStub();
    const prompt = { id: 'prompt-42', name: 'Prompt 42' } as PromptSpec;

    services.promptSpecs.getById.mockResolvedValue(prompt);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const missingIdHook = await renderHook(() => usePromptDetails(null));
    try {
      await waitFor(() => {
        expect(missingIdHook.current().isLoading).toBe(false);
      });
      expect(services.promptSpecs.getById).not.toHaveBeenCalled();

      await act(async () => {
        await missingIdHook.current().refresh();
      });
      expect(services.promptSpecs.getById).not.toHaveBeenCalled();
    } finally {
      await missingIdHook.unmount();
    }

    const detailsHook = await renderHook(() => usePromptDetails('prompt-42'));
    try {
      await waitFor(() => {
        expect(detailsHook.current().data).toEqual(prompt);
      });
      expect(services.promptSpecs.getById).toHaveBeenCalledWith('prompt-42');
    } finally {
      await detailsHook.unmount();
    }
  });

  it('loads default prompt template only when enabled', async () => {
    const services = createGeneratedClientStub();
    const template = { id: 'template-1', name: 'default' } as PromptSpec;

    services.promptSpecs.getDefaultTemplate.mockResolvedValue(template);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const disabledHook = await renderHook(() => usePromptDraftTemplate({ enabled: false }));
    try {
      await waitFor(() => {
        expect(disabledHook.current().isLoading).toBe(false);
      });
      expect(disabledHook.current().data).toBeNull();
      expect(services.promptSpecs.getDefaultTemplate).not.toHaveBeenCalled();
    } finally {
      await disabledHook.unmount();
    }

    const enabledHook = await renderHook(() => usePromptDraftTemplate({ enabled: true }));
    try {
      await waitFor(() => {
        expect(enabledHook.current().data).toEqual(template);
      });
      expect(services.promptSpecs.getDefaultTemplate).toHaveBeenCalledTimes(1);
    } finally {
      await enabledHook.unmount();
    }
  });

  it('maps dashboard summary errors into display errors', async () => {
    const services = createGeneratedClientStub();

    services.promptSpecs.getPromptStats.mockRejectedValue(new Error('stats unavailable'));
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => useDashboardSummary());

    try {
      await waitFor(() => {
        expect(hook.current().error?.message).toBe('stats unavailable');
      });
      expect(hook.current().data).toBeNull();
    } finally {
      await hook.unmount();
    }
  });

  it('loads capabilities from generated contract service', async () => {
    const services = createGeneratedClientStub();
    const capabilities = { features: ['evals', 'extensions'] } as unknown as Capabilities;

    services.capabilities.getCapabilities.mockResolvedValue(capabilities);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => useCapabilities());

    try {
      await waitFor(() => {
        expect(hook.current().data).toEqual(capabilities);
      });
      expect(services.capabilities.getCapabilities).toHaveBeenCalledTimes(1);
    } finally {
      await hook.unmount();
    }
  });
});

describe('project-context wrappers', () => {
  it('exposes projects async state from ProjectsContext', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const project = { id: 'project-1', name: 'Main' } as ProjectSpec;

    mocks.useProjectsContextMock.mockReturnValue({
      projects: [project],
      error: null,
      isLoading: false,
      refresh,
      activeProject: project,
      activeProjectId: project.id,
    });

    const projectsHook = await renderHook(() => useProjects());
    const activeProjectHook = await renderHook(() => useActiveProject());

    try {
      expect(projectsHook.current().data).toEqual([project]);
      expect(projectsHook.current().error).toBeNull();
      expect(projectsHook.current().isLoading).toBe(false);

      expect(activeProjectHook.current().activeProjectId).toBe('project-1');
      expect(activeProjectHook.current().activeProject).toEqual(project);
      expect(activeProjectHook.current().error).toBeNull();
      expect(activeProjectHook.current().isLoading).toBe(false);

      await act(async () => {
        await projectsHook.current().refresh();
      });
      expect(refresh).toHaveBeenCalledTimes(1);
    } finally {
      await projectsHook.unmount();
      await activeProjectHook.unmount();
    }
  });
});

describe('prompt mutations', () => {
  it('calls generated create/update mutations and manages isSaving', async () => {
    const services = createGeneratedClientStub();
    const created = { id: 'prompt-100', name: 'created' } as PromptSpec;
    const updated = { id: 'prompt-100', name: 'updated' } as PromptSpec;
    const payload = { name: 'prompt', group: 'support' } as PromptSpecCreationRequest;

    services.promptSpecs.createPromptSpec.mockResolvedValue(created);
    services.promptSpecs.updatePromptSpec.mockResolvedValue(updated);
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => usePromptMutations());

    try {
      await act(async () => {
        const result = await hook.current().createPrompt(payload);
        expect(result).toEqual(created);
      });
      expect(services.promptSpecs.createPromptSpec).toHaveBeenCalledWith(payload);
      expect(hook.current().error).toBeNull();
      expect(hook.current().isSaving).toBe(false);

      await act(async () => {
        const result = await hook.current().updatePrompt('prompt-100', payload);
        expect(result).toEqual(updated);
      });
      expect(services.promptSpecs.updatePromptSpec).toHaveBeenCalledWith('prompt-100', payload);
      expect(hook.current().error).toBeNull();
      expect(hook.current().isSaving).toBe(false);
    } finally {
      await hook.unmount();
    }
  });

  it('surfaces display errors from failed generated mutation calls', async () => {
    const services = createGeneratedClientStub();
    const payload = { name: 'prompt', group: 'support' } as PromptSpecCreationRequest;

    services.promptSpecs.createPromptSpec.mockRejectedValue(new Error('create failed'));
    mocks.useGeneratedApiClientMock.mockReturnValue(services);

    const hook = await renderHook(() => usePromptMutations());

    try {
      await act(async () => {
        await expect(hook.current().createPrompt(payload)).rejects.toThrow('create failed');
      });

      await waitFor(() => {
        expect(hook.current().error?.message).toBe('create failed');
      });
      expect(hook.current().isSaving).toBe(false);
    } finally {
      await hook.unmount();
    }
  });
});

describe('generated model compatibility fixtures', () => {
  it('keeps typed fixtures aligned with generated DTO contracts', () => {
    const summary: PromptStats = {
      totalPrompts: 12,
      activeProjects: 3,
      executionsToday: 45,
      averageLatencyMs: 132,
      lastUpdated: '2026-03-30T08:00:00.000Z',
    };

    expect(summary.totalPrompts).toBe(12);
    expect(summary.activeProjects).toBe(3);
  });
});
