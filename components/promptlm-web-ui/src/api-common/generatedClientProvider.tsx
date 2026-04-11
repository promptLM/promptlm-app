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

import {
  CapabilitiesService,
  LlmCatalogService,
  OpenAPI,
  PromptSpecificationsService,
  PromptStoreService,
} from '@promptlm/api-client';

export type GeneratedApiClientConfig = {
  baseUrl?: string;
  token?: string;
  headers?: Record<string, string>;
};

export type GeneratedApiServices = {
  promptSpecs: typeof PromptSpecificationsService;
  promptStore: typeof PromptStoreService;
  capabilities: typeof CapabilitiesService;
  modelCatalog: typeof LlmCatalogService;
};

export const resolveGeneratedApiBaseUrl = (baseUrl?: string): string => {
  return baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
};

export const configureGeneratedApiClient = (config?: GeneratedApiClientConfig): GeneratedApiServices => {
  const baseUrl = resolveGeneratedApiBaseUrl(config?.baseUrl);
  OpenAPI.BASE = baseUrl;
  OpenAPI.TOKEN = config?.token;
  OpenAPI.HEADERS = config?.headers;

  return {
    promptSpecs: PromptSpecificationsService,
    promptStore: PromptStoreService,
    capabilities: CapabilitiesService,
    modelCatalog: LlmCatalogService,
  };
};

const GeneratedApiClientContext = React.createContext<GeneratedApiServices | null>(null);

export type GeneratedApiClientProviderProps = {
  children: React.ReactNode;
  config?: GeneratedApiClientConfig;
};

export const GeneratedApiClientProvider: React.FC<GeneratedApiClientProviderProps> = ({ children, config }) => {
  const services = React.useMemo(() => configureGeneratedApiClient(config), [config]);
  return <GeneratedApiClientContext.Provider value={services}>{children}</GeneratedApiClientContext.Provider>;
};

export const useGeneratedApiClient = (): GeneratedApiServices => {
  const services = React.useContext(GeneratedApiClientContext);
  if (!services) {
    throw new Error('useGeneratedApiClient must be used within a GeneratedApiClientProvider');
  }
  return services;
};
