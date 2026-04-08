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
import type {
  PromptLMClient,
  PromptLMClientFactory,
  PromptLMClientFactoryOptions,
} from './client';
import { createRestClient } from './restClient';

const PromptLMClientContext = React.createContext<PromptLMClient | null>(null);

export type PromptLMClientProviderProps = {
  children: React.ReactNode;
  factory?: PromptLMClientFactory;
  options?: PromptLMClientFactoryOptions;
};

export const PromptLMClientProvider: React.FC<PromptLMClientProviderProps> = ({
  children,
  factory,
  options,
}) => {
  const client = React.useMemo(() => {
    const selectedFactory = factory ?? createRestClient;
    const resolvedOptions: PromptLMClientFactoryOptions = { ...(options ?? {}) };

    return selectedFactory(resolvedOptions);
  }, [factory, options]);

  return <PromptLMClientContext.Provider value={client}>{children}</PromptLMClientContext.Provider>;
};

export const usePromptLMClient = (): PromptLMClient => {
  const client = React.useContext(PromptLMClientContext);
  if (!client) {
    throw new Error('usePromptLMClient must be used within a PromptLMClientProvider');
  }
  return client;
};
