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

import { toDisplayError } from '@api-common/apiError';
import { useGeneratedApiClient } from '@api-common/generatedClientProvider';
import { useProjectsContext } from '@api-common/projects/ProjectsContext';
import type {
  Capabilities,
  ModelCatalogResponse,
  ProjectSpec,
  PromptSpec,
  PromptSpecCreationRequest,
  PromptStats,
} from '@promptlm/api-client';

export type PromptId = string;

export type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

type Loader<T> = () => Promise<T>;

const useAsyncData = <T,>(
  loader: Loader<T>,
  deps: React.DependencyList = [],
  options?: { enabled?: boolean },
): AsyncState<T> => {
  const enabled = options?.enabled ?? true;
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(toDisplayError(err));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, ...deps]);

  React.useEffect(() => {
    if (!enabled) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    void fetchData();
  }, [enabled, fetchData]);

  return React.useMemo(
    () => ({
      data,
      error,
      isLoading,
      refresh: fetchData,
    }),
    [data, error, isLoading, fetchData],
  );
};

export const useModelCatalog = (): AsyncState<ModelCatalogResponse> => {
  const { modelCatalog } = useGeneratedApiClient();
  return useAsyncData(async () => {
    return modelCatalog.getCatalog();
  }, [modelCatalog]);
};

export const usePrompts = (): AsyncState<PromptSpec[]> => {
  const { promptSpecs } = useGeneratedApiClient();
  return useAsyncData(async () => {
    return promptSpecs.listPromptSpecs();
  }, [promptSpecs]);
};

export const usePromptDetails = (
  id: PromptId | null | undefined,
  options?: { enabled?: boolean },
): AsyncState<PromptSpec> => {
  const { promptSpecs } = useGeneratedApiClient();
  const enabled = options?.enabled ?? true;

  const loader = React.useCallback(async () => {
    if (!id) {
      throw new Error('Prompt id is required');
    }
    return promptSpecs.getById(id);
  }, [promptSpecs, id]);

  const state = useAsyncData(loader, [loader], { enabled: enabled && Boolean(id) });

  return React.useMemo(
    () => ({
      ...state,
      refresh: async () => {
        if (!enabled || !id) {
          return;
        }
        await state.refresh();
      },
    }),
    [enabled, id, state],
  );
};

export const usePromptDraftTemplate = (
  options?: { enabled?: boolean },
): AsyncState<PromptSpec> => {
  const { promptSpecs } = useGeneratedApiClient();
  return useAsyncData(async () => {
    return promptSpecs.getDefaultTemplate();
  }, [promptSpecs], options);
};

export const useDashboardSummary = (): AsyncState<PromptStats> => {
  const { promptSpecs } = useGeneratedApiClient();
  return useAsyncData(async () => {
    return promptSpecs.getPromptStats();
  }, [promptSpecs]);
};

export const useCapabilities = (): AsyncState<Capabilities> => {
  const { capabilities } = useGeneratedApiClient();
  return useAsyncData(async () => {
    return capabilities.getCapabilities();
  }, [capabilities]);
};

export const useProjects = (): AsyncState<ProjectSpec[]> => {
  const { projects, error, isLoading, refresh } = useProjectsContext();

  return React.useMemo(
    () => ({
      data: projects,
      error,
      isLoading,
      refresh,
    }),
    [projects, error, isLoading, refresh],
  );
};

export const useActiveProject = () => {
  const { activeProject, activeProjectId, error, isLoading, refresh } = useProjectsContext();

  return React.useMemo(
    () => ({
      activeProject,
      activeProjectId,
      error,
      isLoading,
      refresh,
    }),
    [activeProject, activeProjectId, error, isLoading, refresh],
  );
};

export const usePromptMutations = () => {
  const { promptSpecs } = useGeneratedApiClient();
  const [error, setError] = React.useState<Error | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const wrap = React.useCallback(
    async (action: () => Promise<PromptSpec>) => {
      setIsSaving(true);
      setError(null);
      try {
        return await action();
      } catch (err) {
        const displayError = toDisplayError(err);
        setError(displayError);
        throw displayError;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const createPrompt = React.useCallback(
    (payload: PromptSpecCreationRequest) => wrap(async () => {
      return promptSpecs.createPromptSpec(payload);
    }),
    [promptSpecs, wrap],
  );

  const updatePrompt = React.useCallback(
    (promptId: PromptId, payload: PromptSpecCreationRequest) => wrap(async () => {
      return promptSpecs.updatePromptSpec(promptId, payload);
    }),
    [promptSpecs, wrap],
  );

  return {
    createPrompt,
    updatePrompt,
    isSaving,
    error,
  };
};
