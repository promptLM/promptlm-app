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
import type { ComponentType } from 'react';
import type { PromptSpec } from '@promptlm/api-client';

export type ExtensionSlot = 'prompt-details';

export type ExtensionContext = {
  prompt: PromptSpec;
  onPromptUpdated?: (prompt: PromptSpec) => void;
  onRefresh?: () => Promise<void>;
};

export type ExtensionRegistration = {
  id: string;
  slot: ExtensionSlot;
  Component: ComponentType<ExtensionContext>;
};

type Registry = Record<ExtensionSlot, ExtensionRegistration[]>;

const registry: Registry = {
  'prompt-details': [],
};

export const registerExtension = (registration: ExtensionRegistration) => {
  const existing = registry[registration.slot] ?? [];
  if (existing.some((entry) => entry.id === registration.id)) {
    return;
  }
  registry[registration.slot] = [...existing, registration];
};

export const registerLazyExtension = (
  slot: ExtensionSlot,
  id: string,
  loader: () => Promise<{ default: ComponentType<ExtensionContext> }>,
) => {
  registerExtension({
    slot,
    id,
    Component: React.lazy(loader),
  });
};

export const getExtensionsForSlot = (slot: ExtensionSlot) => registry[slot] ?? [];
