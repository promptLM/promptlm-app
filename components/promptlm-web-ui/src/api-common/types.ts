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

import type { components } from '@promptlm/api-client';

export type PromptId = string;
export type ProjectId = string;

// --- API schema aliases ----------------------------------------------------

export type ApiPromptSpec = components['schemas']['PromptSpec'];
export type ApiPromptSpecCreationRequest = components['schemas']['PromptSpecCreationRequest'];
export type ApiProjectSpec = components['schemas']['ProjectSpec'];
export type ApiRepositoryOwner = components['schemas']['RepositoryOwner'];
export type ApiPromptStats = components['schemas']['PromptStats'];
export type ApiCloneStoreRequest = components['schemas']['CloneStoreRepoRequest'];
export type ApiCreateStoreRequest = components['schemas']['CreateStoreRequest'];
export type ApiExecutePromptRequest = components['schemas']['ExecutePromptRequest'];
export type ApiRequestBase = components['schemas']['Request'];
export type ApiMessage = components['schemas']['Message'];
export type ApiPlaceholders = components['schemas']['Placeholders'];
export type ApiPlaceholder = components['schemas']['Placeholder'];
export type ApiExecution = components['schemas']['Execution'];
export type ApiEvaluationResult = components['schemas']['EvaluationResult'];
export type ApiCapabilities = components['schemas']['Capabilities'];

// --- UI-facing domain types ------------------------------------------------

export type PromptStatus = 'ACTIVE' | 'RETIRED';

export type PromptSpecSummary = {
  id: PromptId;
  name: string;
  projectId: ProjectId;
  group?: string;
  version?: string;
  revision?: number;
  status: PromptStatus;
  description?: string;
  updatedAt?: string;
};

export type PromptPlaceholder = {
  name: string;
  value: string;
};

export type PromptPlaceholders = {
  startPattern?: string;
  endPattern?: string;
  list: PromptPlaceholder[];
  defaults?: Record<string, string>;
};

export type PromptMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type PromptMessage = {
  id: string;
  role: PromptMessageRole;
  name?: string;
  content: string;
};

export type PromptRequestParameters = {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
};

export type PromptRequest = ApiRequestBase & {
  parameters?: PromptRequestParameters;
  messages?: PromptMessage[];
  modelSnapshot?: string;
};

export type ChatCompletionResponseUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
};

export type ChatCompletionResponse = {
  type: 'chat/completion';
  durationMs?: number;
  usage?: ChatCompletionResponseUsage;
  content?: string;
};

export type PromptResponse = ChatCompletionResponse;

export type PromptEvaluationDefinition = {
  evaluator: string;
  type: string;
  description?: string;
};

export type PromptEvaluationSpec = {
  evaluations: PromptEvaluationDefinition[];
};

export type PromptEvaluationExtension = {
  spec?: PromptEvaluationSpec;
  results?: PromptEvaluationResults;
};

export type PromptEvaluationResult = {
  evaluator: string;
  type: string;
  score?: number;
  reasoning?: string;
  comments?: string;
  success: boolean;
};

export type PromptEvaluationResults = {
  evaluations: PromptEvaluationResult[];
};

export type PromptExecutionPlaceholder = {
  name: string;
  defaultValue?: string;
};

export type PromptExecution = {
  id: string;
  timestamp: string;
  response?: PromptResponse;
  placeholders: PromptExecutionPlaceholder[];
  evaluations: ApiEvaluationResult[];
};

export type PromptSpecDetails = Omit<ApiPromptSpec, 'placeholders' | 'request' | 'executions'> & {
  placeholders?: PromptPlaceholders;
  request?: PromptRequest;
  executions?: PromptExecution[];
};

export type PromptSpecDraftMetadata = {
  id?: string;
  name: string;
  group: string;
  version?: string;
  revision?: number;
  description?: string;
  authors: string[];
  purpose?: string;
  repositoryUrl?: string;
  projectId: ProjectId;
};

export type PromptSpecDraft = {
  metadata: PromptSpecDraftMetadata;
  placeholders: PromptPlaceholders;
  request: PromptRequest;
  extensions?: Record<string, unknown>;
};

export type DashboardSummary = {
  totalPrompts: number;
  activeProjects: number;
  lastUpdated: string;
};

export type Capabilities = ApiCapabilities;

export type ProjectSummary = {
  id: ProjectId;
  name: string;
  localPath: string;
  repositoryUrl: string;
  description?: string;
  promptCount: number;
  createdAt: string;
  updatedAt: string;
  healthStatus?: 'HEALTHY' | 'BROKEN_LOCAL' | 'BROKEN_REMOTE' | null;
  healthMessage?: string | null;
};

export type CreateProjectPayload = {
  repoName: string;
  repoDir: string;
  repoGroup?: string;
  description?: string;
};

export type RepositoryOwner = {
  id: string;
  displayName: string;
  type: 'USER' | 'ORGANIZATION';
};

export type ConnectProjectPayload = {
  repoPath: string;
  displayName?: string;
};

export type CloneProjectPayload = {
  remoteUrl: string;
  targetDir: string;
  name?: string;
  operationId?: string;
};

export type PromptReleaseResult = PromptSpecDetails;
