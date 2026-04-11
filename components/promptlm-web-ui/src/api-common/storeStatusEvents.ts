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
  type StoreStatusEvent,
  type StoreStatusEventSourceFactory,
  type StoreStatusEventsSubscription,
  subscribeToStoreStatusEvents,
} from '@promptlm/api-client';

import { resolveGeneratedApiBaseUrl } from './generatedClientProvider';

export type SubscribeToStoreOperationStatusOptions = {
  operationId: string;
  baseUrl?: string;
  withCredentials?: boolean;
  eventSourceFactory?: StoreStatusEventSourceFactory;
  onStatus?: (event: StoreStatusEvent) => void;
  onError?: (error: Error) => void;
};

export const createStoreOperationId = (): string => {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }

  return `store-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const isTerminalStoreStatusEvent = (event: StoreStatusEvent): boolean => {
  return event.status === 'completed' || event.status === 'failed';
};

export const subscribeToStoreOperationStatus = ({
  baseUrl,
  ...options
}: SubscribeToStoreOperationStatusOptions): StoreStatusEventsSubscription => {
  return subscribeToStoreStatusEvents({
    ...options,
    baseUrl: resolveGeneratedApiBaseUrl(baseUrl),
  });
};
