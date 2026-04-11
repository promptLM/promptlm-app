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

import type { ProjectSpec } from '@promptlm/api-client';

const toTrimmedString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getProjectId = (project: ProjectSpec): string | null => {
  return toTrimmedString(project.id);
};

export const getProjectName = (project: ProjectSpec): string => {
  return (
    toTrimmedString(project.name) ??
    toTrimmedString(project.localPath) ??
    toTrimmedString(project.repositoryUrl) ??
    getProjectId(project) ??
    'Unnamed project'
  );
};

export const getProjectUpdatedAt = (project: ProjectSpec): Date | null => {
  const updatedAt = toTrimmedString(project.updatedAt);
  if (!updatedAt) {
    return null;
  }

  const parsed = new Date(updatedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const compareProjectsByUpdatedAt = (left: ProjectSpec, right: ProjectSpec): number => {
  const leftTime = getProjectUpdatedAt(left)?.getTime() ?? 0;
  const rightTime = getProjectUpdatedAt(right)?.getTime() ?? 0;
  return rightTime - leftTime;
};

export const getProjectKey = (project: ProjectSpec, index: number): string => {
  return getProjectId(project) ?? toTrimmedString(project.repositoryUrl) ?? toTrimmedString(project.localPath) ?? `project-${index}`;
};

export const hasProjectHealthIssue = (project: ProjectSpec): boolean => {
  return project.healthStatus === 'BROKEN_LOCAL' || project.healthStatus === 'BROKEN_REMOTE';
};

export const isProjectSelectable = (project: ProjectSpec): boolean => {
  return project.healthStatus !== 'BROKEN_LOCAL';
};

export const getProjectSelectionBlockedReason = (project: ProjectSpec): string | null => {
  if (project.healthStatus !== 'BROKEN_LOCAL') {
    return null;
  }

  return typeof project.healthMessage === 'string' && project.healthMessage.trim().length > 0
    ? project.healthMessage
    : null;
};
