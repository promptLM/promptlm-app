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
  DashboardSummary,
  PromptSpecSummary,
  PromptSpecDetails,
  PromptMessageRole,
  ProjectSummary,
  PromptPlaceholder,
} from '@api-common/types';

type RequestMessage = NonNullable<NonNullable<PromptSpecDetails['request']>['messages']>[number];

export type PromptStatus = 'active' | 'draft' | 'archived';

export type Prompt = {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: PromptStatus;
  version: string;
  revision: number;
  modelConfig: ModelConfig;
  tools: Tool[];
  updatedAt: Date;
  createdAt: Date | null;
};

export type PromptDetails = Prompt & {
  systemMessage: string;
  promptTemplate: string;
  placeholders: Placeholder[];
  messages: PromptMessage[];
  latestResponse: string | null;
};

export type Placeholder = {
  id: string;
  name: string;
  defaultValue?: string;
  description?: string;
};

export type ModelConfig = {
  vendor: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  responseFormat: 'text' | 'json';
};

export type Tool = {
  id: string;
  name: string;
  description: string;
};

export type PromptMessage = {
  id: string;
  role: PromptMessageRole;
  content: string;
  name?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  promptCount: number;
  updatedAt: Date;
  createdAt: Date | null;
  localPath?: string;
  repositoryUrl?: string;
  healthStatus?: 'HEALTHY' | 'BROKEN_LOCAL' | 'BROKEN_REMOTE' | null;
  healthMessage?: string | null;
};

export type DashboardOverview = {
  totalPrompts: number;
  activeProjects: number;
  lastUpdated: Date;
};

export const mapPromptSummary = (summary: PromptSpecSummary): Prompt => {
  const status = summary.status?.toLowerCase() ?? 'active';

  return {
    id: summary.id,
    name: summary.name,
    description: summary.description ?? '',
    projectId: summary.projectId ?? 'default-project',
    status: (status === 'retired' ? 'archived' : status) as PromptStatus,
    version: summary.version ?? '0.0.0',
    revision: summary.revision ?? 0,
    modelConfig: createDefaultModelConfig(),
    tools: [],
    updatedAt: summary.updatedAt ? new Date(summary.updatedAt) : new Date(),
    createdAt: null,
  };
};

export const mapPromptDetails = (details: PromptSpecDetails): PromptDetails => {
  const system = extractMessage(details, 'system');
  const user = extractMessage(details, 'user');

  return {
    ...mapPromptSummary(details),
    systemMessage: system,
    promptTemplate: user,
    placeholders: (details.placeholders?.list ?? []).map((item: PromptPlaceholder) => ({
      id: item.name,
      name: item.name,
      defaultValue: item.value,
      description: item.description,
    })),
    messages: (details.request?.messages ?? []).map((message: RequestMessage, index) => ({
      id: message.id ?? `msg-${index}`,
      role: (message.role?.toLowerCase() ?? 'user') as PromptMessageRole,
      content: message.content ?? '',
      name: message.name ?? undefined,
    })),
    modelConfig: {
      vendor: details.request?.vendor ?? 'unknown',
      model: details.request?.model ?? 'unknown',
      maxTokens: details.request?.parameters?.maxTokens ?? 0,
      temperature: details.request?.parameters?.temperature ?? 0,
      topP: details.request?.parameters?.topP ?? 1,
      presencePenalty: details.request?.parameters?.presencePenalty ?? 0,
      frequencyPenalty: details.request?.parameters?.frequencyPenalty ?? 0,
      responseFormat: 'text',
    },
    tools: (details.request?.messages ?? [])
      .filter((message: RequestMessage) => message.role?.toLowerCase() === 'tool')
      .map((toolMessage: RequestMessage, index) => ({
        id: toolMessage.name ?? `tool-${index}`,
        name: toolMessage.name ?? `Tool ${index + 1}`,
        description: toolMessage.content ?? '',
      })),
    latestResponse: extractLatestResponseContent(details),
    createdAt: details.createdAt ? new Date(details.createdAt) : null,
  };
};

export const mapProjectSummary = (project: ProjectSummary): Project => ({
  id: project.id,
  name: project.name,
  description: project.description ?? '',
  promptCount: project.promptCount ?? 0,
  updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
  createdAt: project.createdAt ? new Date(project.createdAt) : null,
  localPath: project.localPath ?? undefined,
  repositoryUrl: project.repositoryUrl ?? undefined,
  healthStatus: project.healthStatus ?? null,
  healthMessage: project.healthMessage ?? null,
});

export const mapDashboard = (summary: DashboardSummary): DashboardOverview => ({
  totalPrompts: summary.totalPrompts,
  activeProjects: summary.activeProjects,
  lastUpdated: summary.lastUpdated ? new Date(summary.lastUpdated) : new Date(),
});

const extractMessage = (details: PromptSpecDetails, role: PromptMessageRole): string => {
  const match = details.request?.messages?.find((message) => message.role?.toLowerCase() === role);
  return match?.content ?? '';
};

const extractLatestResponseContent = (details: PromptSpecDetails): string | null => {
  if (details.response?.content) {
    return details.response.content;
  }

  if (!details.executions?.length) {
    return null;
  }

  const latestExecution = [...details.executions]
    .filter((execution) => execution.response?.content)
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0];

  return latestExecution?.response?.content ?? null;
};

const createDefaultModelConfig = (): ModelConfig => ({
  vendor: 'unknown',
  model: 'unknown',
  maxTokens: 0,
  temperature: 0,
  topP: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
  responseFormat: 'text',
});
