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

import { useEffect, useMemo, useState } from 'react';

import type { RepositoryOwner } from '@promptlm/api-client';
import {
  CloneProjectForm,
  CreateProjectForm,
  ImportLocalProjectForm,
  ProjectSelectionDialog,
} from '@promptlm/ui';
import {
  compareProjectsByUpdatedAt,
  getProjectSelectionBlockedReason,
  getProjectId,
  getProjectKey,
  getProjectName,
  hasProjectHealthIssue,
  isProjectSelectable,
} from '@api-common/projectModel';
import type { StoreStatusEvent } from '@promptlm/api-client';
import { useToast } from '@/hooks/use-toast';
import { useProjectsContext } from '@api-common/projects/ProjectsContext';
import { useGeneratedApiClient } from '@api-common/generatedClientProvider';
import {
  createStoreOperationId,
  isTerminalStoreStatusEvent,
  subscribeToStoreOperationStatus,
} from '@api-common/storeStatusEvents';

// Project dialog wiring

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectModal({ open, onOpenChange }: ProjectModalProps) {
  const { promptStore } = useGeneratedApiClient();
  const {
    projects,
    isLoading,
    error,
    refresh,
    activeProjectId,
    selectProject,
    createProject,
    connectProject,
    cloneProject,
  } = useProjectsContext();

  const [activeTabId, setActiveTabId] = useState<string>('select');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [cloneStatusEvent, setCloneStatusEvent] = useState<StoreStatusEvent | null>(null);
  const [cloneStatusError, setCloneStatusError] = useState<string | null>(null);

  const [owners, setOwners] = useState<RepositoryOwner[]>([]);
  const [isOwnersLoading, setIsOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);
  const { toast } = useToast();

  const waitForStatusEvent = (predicate: (event: StoreStatusEvent) => boolean) => {
    let resolveWait: (() => void) | null = null;
    const promise = new Promise<void>((resolve) => {
      resolveWait = resolve;
    });

    return {
      promise,
      notify: (event: StoreStatusEvent) => {
        if (predicate(event)) {
          resolveWait?.();
        }
      },
      resolve: () => resolveWait?.(),
    };
  };

  // If there are no projects loaded, default to the "Create" tab so inputs are visible immediately.
  useEffect(() => {
    if (!open) {
      return;
    }

    if (projects && projects.length === 0) {
      setActiveTabId('create');
      return;
    }

    setActiveTabId('select');
  }, [open, projects]);

  useEffect(() => {
    if (!open) {
      setCreateError(null);
      setImportError(null);
      setCloneError(null);
      setCloneStatusEvent(null);
      setCloneStatusError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsOwnersLoading(true);
    setOwnersError(null);
    void promptStore
      .listOwners()
      .then((result) => {
        setOwners(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setOwners([]);
        setOwnersError(message);
      })
      .finally(() => {
        setIsOwnersLoading(false);
      });
  }, [open, promptStore]);

  const ownerOptions = useMemo(() => {
    return owners
      .map((owner, index) => {
        const id = owner.id ?? owner.displayName ?? `owner-${index}`;
        const displayName = owner.displayName ?? owner.id ?? `Owner ${index + 1}`;
        const type = owner.type === 'ORGANIZATION' ? 'ORGANIZATION' : 'USER';
        return { id, displayName, type };
      })
      .filter((owner) => Boolean(owner.id));
  }, [owners]);

  const handleAddProject = async (values: { repoName: string; parentDirectory: string; description: string; owner?: string }) => {
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const created = await createProject({
        repoName: values.repoName.trim(),
        repoDir: values.parentDirectory.trim(),
        repoGroup: values.owner || undefined,
        description: values.description?.trim() || undefined,
      });

      toast({
        title: 'Project created',
        description: `Successfully created project "${getProjectName(created)}"`,
      });

      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project. Please try again.';
      setCreateError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportLocal = async (values: { repositoryPath: string; displayName: string }) => {
    setIsSubmitting(true);
    setImportError(null);
    try {
      await connectProject({
        repoPath: values.repositoryPath,
        displayName: values.displayName?.trim() || undefined,
      });

      toast({
        title: 'Repository connected',
        description: `Successfully connected "${values.displayName || values.repositoryPath}"`,
      });

      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import repository. Please try again.';
      setImportError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloneRemote = async (values: { remoteUrl: string; targetDirectory: string; projectName: string }) => {
    setIsSubmitting(true);
    setCloneError(null);
    setCloneStatusEvent(null);
    setCloneStatusError(null);

    const operationId = createStoreOperationId();
    const terminalStatus = waitForStatusEvent(isTerminalStoreStatusEvent);
    let closeSubscription: (() => void) | null = null;

    try {
      closeSubscription = subscribeToStoreOperationStatus({
        operationId,
        onStatus: (event) => {
          setCloneStatusEvent(event);
          terminalStatus.notify(event);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : String(error);
          setCloneStatusError(message);
          setCloneError(message);
        },
      }).close;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCloneStatusError(message);
      setCloneError(message);
    }

    try {
      await cloneProject({
        remoteUrl: values.remoteUrl,
        targetDir: values.targetDirectory,
        name: values.projectName,
        operationId,
      });

      await Promise.race([terminalStatus.promise, new Promise((resolve) => setTimeout(resolve, 500))]);

      toast({
        title: 'Repository cloned',
        description: `Successfully cloned from "${values.remoteUrl}"`,
      });

      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone repository. Please try again.';
      setCloneError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      terminalStatus.resolve();
      closeSubscription?.();
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    void refresh().then(() => {
      toast({
        title: 'Projects refreshed',
        description: 'Project list has been updated.',
      });
    }).catch((err) => {
      toast({
        title: 'Refresh failed',
        description: err instanceof Error ? err.message : 'Could not refresh projects.',
        variant: 'destructive',
      });
    });
  };

  const handleSelectProject = async (projectId: string, projectName: string) => {
    try {
      await selectProject(projectId);
      toast({
        title: 'Project selected',
        description: `Switched to "${projectName}"`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Project switch failed',
        description: err instanceof Error ? err.message : 'Could not switch project.',
        variant: 'destructive',
      });
    }
  };

  const sortedProjects = useMemo(() => {
    if (!projects) {
      return [];
    }

    return [...projects].sort(compareProjectsByUpdatedAt);
  }, [projects]);

  const dialogProjects = useMemo(() => {
    return sortedProjects
      .map((project, index) => {
        const id = getProjectId(project);
        if (!id) {
          return null;
        }

        return {
          id,
          name: getProjectName(project),
          repositoryUrl: project.repositoryUrl,
          localPath: project.localPath,
          description: project.description,
          promptCount: project.promptCount ?? 0,
          healthMessage: hasProjectHealthIssue(project) ? (project.healthMessage ?? null) : null,
          isSelectable: isProjectSelectable(project),
          selectionBlockedReason: getProjectSelectionBlockedReason(project),
          _key: getProjectKey(project, index),
        };
      })
      .filter((project) => project !== null);
  }, [sortedProjects]);

  const tabs = [
    {
      id: 'create',
      label: 'Create',
      content: (
        <CreateProjectForm
          onSubmit={handleAddProject}
          isSubmitting={isSubmitting}
          error={createError}
          owners={ownerOptions}
          isOwnersLoading={isOwnersLoading}
          ownersError={ownersError}
        />
      ),
    },
    {
      id: 'import',
      label: 'Import local',
      content: (
        <ImportLocalProjectForm
          onSubmit={handleImportLocal}
          isSubmitting={isSubmitting}
          error={importError}
        />
      ),
    },
    {
      id: 'clone',
      label: 'Clone remote',
      content: (
        <CloneProjectForm
          onSubmit={handleCloneRemote}
          isSubmitting={isSubmitting}
          error={cloneError}
          statusEvent={
            cloneStatusEvent
              ? { status: cloneStatusEvent.status, message: cloneStatusEvent.message }
              : null
          }
          statusError={cloneStatusError}
        />
      ),
    },
  ];

  return (
    <ProjectSelectionDialog
      open={open}
      onClose={() => onOpenChange(false)}
      projects={dialogProjects}
      activeProjectId={activeProjectId}
      isLoading={isLoading}
      error={error?.message ?? null}
      onSelect={(projectId) => {
        const selected = dialogProjects.find((project) => project.id === projectId);
        if (selected && !selected.isSelectable) {
          toast({
            title: 'Project unavailable',
            description:
              selected.selectionBlockedReason ?? 'This project cannot be selected because its local repository is unavailable.',
            variant: 'destructive',
          });
          return;
        }

        void handleSelectProject(projectId, selected?.name ?? projectId);
      }}
      onRefresh={handleRefresh}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      selectTabLabel="Projects"
    />
  );
}
