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

import type {
  CloneProjectPayload,
  ConnectProjectPayload,
  CreateProjectPayload,
  DashboardSummary,
  PromptId,
  PromptSpecDetails,
  PromptSpecDraft,
  PromptSpecSummary,
  ProjectId,
  ProjectSummary,
  RepositoryOwner,
} from './types';

export type PromptLMClient = {
  getDashboardSummary(): Promise<DashboardSummary>;
  listPrompts(): Promise<PromptSpecSummary[]>;
  getPromptDetails(id: PromptId): Promise<PromptSpecDetails>;
  createPrompt(draft: PromptSpecDraft): Promise<PromptSpecDetails>;
  updatePrompt(id: PromptId, draft: PromptSpecDraft): Promise<PromptSpecDetails>;
  executePrompt(draft: PromptSpecDraft): Promise<PromptSpecDetails>;
  executeStoredPrompt(id: PromptId, draft: PromptSpecDraft): Promise<PromptSpecDetails>;
  listProjects(): Promise<ProjectSummary[]>;
  listRepositoryOwners(): Promise<RepositoryOwner[]>;
  releasePrompt(id: PromptId): Promise<PromptSpecDetails>;
  createProject(payload: CreateProjectPayload): Promise<ProjectSummary>;
  connectProject(payload: ConnectProjectPayload): Promise<ProjectSummary>;
  cloneProject(payload: CloneProjectPayload): Promise<ProjectSummary>;
  switchProject(projectId: ProjectId): Promise<void>;
  getActiveProject(): Promise<ProjectSummary | null>;
};

export type PromptLMClientFactoryOptions = {
  baseUrl?: string;
};

export type PromptLMClientFactory = (options?: PromptLMClientFactoryOptions) => PromptLMClient;
