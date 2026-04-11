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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  CloneStoreRepoRequest,
  ConnectRepositoryRequest,
  CreateStoreRequest,
  ProjectSpec,
} from '@promptlm/api-client';

import { toDisplayError } from '../apiError';
import { useGeneratedApiClient } from '../generatedClientProvider';
import { getProjectId } from '../projectModel';

export type ProjectsContextValue = {
  projects: ProjectSpec[] | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  activeProjectId: string | null;
  activeProject: ProjectSpec | null;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (payload: CreateStoreRequest) => Promise<ProjectSpec>;
  connectProject: (payload: ConnectRepositoryRequest) => Promise<ProjectSpec>;
  cloneProject: (payload: CloneStoreRepoRequest) => Promise<ProjectSpec>;
};

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

const isNotFoundError = (error: unknown): boolean => {
  return (error as { status?: number } | undefined)?.status === 404;
};

const upsertProject = (projects: ProjectSpec[] | null, next: ProjectSpec): ProjectSpec[] => {
  if (!projects || projects.length === 0) {
    return [next];
  }

  const nextId = getProjectId(next);
  if (!nextId) {
    return [...projects, next];
  }

  const index = projects.findIndex((project) => getProjectId(project) === nextId);
  if (index === -1) {
    return [...projects, next];
  }

  const updated = [...projects];
  updated[index] = next;
  return updated;
};

const mergeProjects = (projects: ProjectSpec[], activeProject: ProjectSpec | null): ProjectSpec[] => {
  if (!activeProject) {
    return projects;
  }

  const activeProjectId = getProjectId(activeProject);
  if (activeProjectId && projects.some((project) => getProjectId(project) === activeProjectId)) {
    return projects;
  }

  return [...projects, activeProject];
};

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { promptStore } = useGeneratedApiClient();
  const [projects, setProjects] = useState<ProjectSpec[] | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [activeProjectResponse, apiProjects] = await Promise.all([
        promptStore.getActiveProject().catch((err) => {
          if (isNotFoundError(err)) {
            return null;
          }
          throw err;
        }),
        promptStore.getAllProjects(),
      ]);
      const mergedProjects = mergeProjects(apiProjects, activeProjectResponse);
      const nextActiveProjectId = activeProjectResponse ? getProjectId(activeProjectResponse) : null;

      setActiveProjectId((previous) => {
        const desiredActiveId = nextActiveProjectId ?? previous;
        if (!desiredActiveId) {
          return null;
        }
        return desiredActiveId;
      });

      setProjects((previousProjects) => {
        const desiredActiveId = nextActiveProjectId ?? activeProjectId;
        if (!desiredActiveId) {
          return mergedProjects;
        }

        if (mergedProjects.some((project) => getProjectId(project) === desiredActiveId)) {
          return mergedProjects;
        }

        const previousActive =
          previousProjects?.find((project) => getProjectId(project) === desiredActiveId) ?? null;
        if (!previousActive) {
          return mergedProjects;
        }

        return upsertProject(mergedProjects, previousActive);
      });
    } catch (err) {
      setError(toDisplayError(err));
      setProjects(null);
      setActiveProjectId(null);
    } finally {
      setIsLoading(false);
    }
  }, [promptStore, activeProjectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectProject = useCallback(
    async (projectId: string) => {
      setError(null);
      setActiveProjectId(projectId);
      try {
        await promptStore.switchProject(projectId);
        await refresh();
      } catch (err) {
        const error = toDisplayError(err);
        setError(error);
        throw error;
      }
    },
    [promptStore, refresh],
  );

  const createProject = useCallback(
    async (payload: CreateStoreRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const project = await promptStore.createStore(payload);
        const projectId = getProjectId(project);
        setProjects((previous) => upsertProject(previous, project));
        setActiveProjectId(projectId);
        if (projectId) {
          await promptStore.switchProject(projectId);
        }
        await refresh();
        setActiveProjectId(projectId);
        return project;
      } catch (err) {
        const error = toDisplayError(err);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [promptStore, refresh],
  );

  const connectProject = useCallback(
    async (payload: ConnectRepositoryRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const project = await promptStore.connectRepository(payload);
        const projectId = getProjectId(project);
        setProjects((previous) => upsertProject(previous, project));
        setActiveProjectId(projectId);
        if (projectId) {
          await promptStore.switchProject(projectId);
        }
        await refresh();
        setActiveProjectId(projectId);
        return project;
      } catch (err) {
        const error = toDisplayError(err);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [promptStore, refresh],
  );

  const cloneProject = useCallback(
    async (payload: CloneStoreRepoRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const projectId = await promptStore.cloneStore(payload);
        if (projectId) {
          await promptStore.switchProject(projectId);
        }
        await refresh();

        const [availableProjects, activeProjectResponse] = await Promise.all([
          promptStore.getAllProjects(),
          promptStore.getActiveProject().catch((err) => {
            if (isNotFoundError(err)) {
              return null;
            }
            throw err;
          }),
        ]);
        const nextProject =
          availableProjects.find((project) => getProjectId(project) === projectId) ?? activeProjectResponse;
        if (!nextProject) {
          throw new Error('Cloned project could not be loaded');
        }

        setProjects((previous) => upsertProject(previous, nextProject));
        setActiveProjectId(getProjectId(nextProject));
        return nextProject;
      } catch (err) {
        const error = toDisplayError(err);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [promptStore, refresh],
  );

  const activeProject = useMemo(() => {
    if (!projects || !activeProjectId) {
      return null;
    }
    return projects.find((project) => getProjectId(project) === activeProjectId) ?? null;
  }, [projects, activeProjectId]);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      isLoading,
      error,
      refresh,
      activeProjectId,
      activeProject,
      selectProject,
      createProject,
      connectProject,
      cloneProject,
    }),
    [projects, isLoading, error, refresh, activeProjectId, activeProject, selectProject, createProject, connectProject, cloneProject],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
};

export const useProjectsContext = (): ProjectsContextValue => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return context;
};
