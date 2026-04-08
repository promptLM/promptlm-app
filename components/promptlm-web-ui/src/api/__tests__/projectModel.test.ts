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

import { describe, expect, it } from 'vitest';
import type { ProjectSpec } from '@promptlm/api-client';

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

const buildProject = (overrides: Partial<ProjectSpec> = {}): ProjectSpec => ({
  id: 'project-1',
  name: 'Primary Project',
  updatedAt: '2026-03-01T10:00:00.000Z',
  ...overrides,
});

describe('projectModel helpers', () => {
  it('reads generated project identifiers and falls back to stable keys', () => {
    const unnamedProject = buildProject({
      id: '  ',
      name: '  ',
      localPath: '/tmp/worktrees/project-a',
      repositoryUrl: 'https://example.com/project-a.git',
    });

    expect(getProjectId(buildProject())).toBe('project-1');
    expect(getProjectId(unnamedProject)).toBeNull();
    expect(getProjectName(unnamedProject)).toBe('/tmp/worktrees/project-a');
    expect(getProjectKey(unnamedProject, 4)).toBe('https://example.com/project-a.git');
  });

  it('parses timestamps from generated models and sorts most-recent-first', () => {
    const oldest = buildProject({ id: 'project-1', updatedAt: '2026-01-02T08:00:00.000Z' });
    const newest = buildProject({ id: 'project-2', updatedAt: '2026-03-02T08:00:00.000Z' });
    const invalid = buildProject({ id: 'project-3', updatedAt: 'not-a-date' });

    expect(getProjectUpdatedAt(oldest)?.toISOString()).toBe('2026-01-02T08:00:00.000Z');
    expect(getProjectUpdatedAt(invalid)).toBeNull();
    expect([oldest, invalid, newest].sort(compareProjectsByUpdatedAt).map((project) => project.id)).toEqual([
      'project-2',
      'project-1',
      'project-3',
    ]);
  });

  it('flags generated health states without remapping them', () => {
    expect(hasProjectHealthIssue(buildProject({ healthStatus: 'BROKEN_LOCAL' }))).toBe(true);
    expect(hasProjectHealthIssue(buildProject({ healthStatus: 'BROKEN_REMOTE' }))).toBe(true);
    expect(hasProjectHealthIssue(buildProject({ healthStatus: 'HEALTHY' }))).toBe(false);
    expect(hasProjectHealthIssue(buildProject({ healthStatus: undefined }))).toBe(false);
  });

  it('blocks selection for projects with missing local repositories', () => {
    const brokenLocal = buildProject({
      healthStatus: 'BROKEN_LOCAL',
      healthMessage: 'Local repository missing at "/tmp/test-repo"',
    });
    const brokenRemote = buildProject({
      healthStatus: 'BROKEN_REMOTE',
      healthMessage: 'Remote is unreachable',
    });

    expect(isProjectSelectable(brokenLocal)).toBe(false);
    expect(isProjectSelectable(brokenRemote)).toBe(true);
    expect(isProjectSelectable(buildProject({ healthStatus: 'HEALTHY' }))).toBe(true);

    expect(getProjectSelectionBlockedReason(brokenLocal)).toBe('Local repository missing at "/tmp/test-repo"');
    expect(getProjectSelectionBlockedReason(brokenRemote)).toBeNull();
  });
});
