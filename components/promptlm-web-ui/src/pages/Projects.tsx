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

import { Fragment, useMemo, useState } from 'react';
import { Button } from '@promptlm/ui';
import { Badge } from '@promptlm/ui';
import { Plus, FolderOpen, FileText, Clock, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import {
  compareProjectsByUpdatedAt,
  getProjectSelectionBlockedReason,
  getProjectId,
  getProjectKey,
  getProjectName,
  getProjectUpdatedAt,
  hasProjectHealthIssue,
  isProjectSelectable,
} from '@api-common/projectModel';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { useProjects } from '@/api/hooks';
import { useProjectsContext } from '@api-common/projects/ProjectsContext';
import { useToast } from '@/hooks/use-toast';

export default function Projects() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const { selectProject, activeProjectId } = useProjectsContext();
  const { data: projects, isLoading, error, refresh } = useProjects();

  const orderedProjects = useMemo(() => {
    if (!projects) {
      return [];
    }

    return [...projects].sort(compareProjectsByUpdatedAt);
  }, [projects]);

  const handleProjectSelection = async (projectId: string, projectName: string) => {
    try {
      await selectProject(projectId);
      toast({
        title: 'Project selected',
        description: `Switched to "${projectName}"`,
      });
    } catch (err) {
      toast({
        title: 'Project switch failed',
        description: err instanceof Error ? err.message : 'Could not switch project.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Organize your prompts into projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refresh()}
            disabled={isLoading}
            aria-label="Refresh projects"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button variant="glow" className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load projects. {error.message}
        </div>
      )}

      {isLoading && !projects ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl border border-border bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : orderedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedProjects.map((project, index) => {
            const projectId = getProjectId(project);
            const projectName = getProjectName(project);
            const isActive = projectId ? activeProjectId === projectId : false;
            const updatedAtDate = getProjectUpdatedAt(project);
            const updatedAt = updatedAtDate ? formatDistanceToNow(updatedAtDate, { addSuffix: true }) : 'Recently';
            const hasHealthWarning = hasProjectHealthIssue(project);
            const isSelectable = Boolean(projectId) && isProjectSelectable(project);
            const statusMessage =
              getProjectSelectionBlockedReason(project) ?? (hasHealthWarning ? (project.healthMessage ?? null) : null);

            return (
              <Fragment key={getProjectKey(project, index)}>
                <div
                  role="button"
                  tabIndex={isSelectable ? 0 : -1}
                  aria-disabled={!isSelectable}
                  onClick={() => {
                    if (projectId && isSelectable) {
                      void handleProjectSelection(projectId, projectName);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (projectId && isSelectable && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      void handleProjectSelection(projectId, projectName);
                    }
                  }}
                  className={`group rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    isSelectable ? 'cursor-pointer' : 'cursor-default opacity-80'
                  } ${
                    isActive ? 'border-primary/60 shadow-lg shadow-primary/10' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold font-mono group-hover:text-primary transition-colors truncate">
                        {projectName}
                      </h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.repositoryUrl && (
                        <p className="mt-2 text-xs text-muted-foreground truncate">
                          {project.repositoryUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{project.promptCount ?? 0} prompts</span>
                    </div>
                    <Badge variant={isActive ? 'glow' : 'secondary'}>
                      {isActive ? 'Active' : isSelectable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Updated {updatedAt}</span>
                  </div>
                  {statusMessage && (
                    <div
                      className={`mt-2 flex items-start gap-2 text-xs ${
                        isSelectable ? 'text-amber-400' : 'text-destructive'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 mt-[2px]" />
                      <span className="leading-snug">{statusMessage}</span>
                    </div>
                  )}
                </div>
              </Fragment>
            );
          })}

          <div
            onClick={() => setModalOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setModalOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            className="rounded-xl border border-dashed border-border bg-card/50 p-5 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-primary/50 hover:bg-card transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium">Create new project</p>
            <p className="mt-1 text-xs text-muted-foreground">Organize related prompts</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">No projects available yet. Create one to get started.</p>
        </div>
      )}

      <ProjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
