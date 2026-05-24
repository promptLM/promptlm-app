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

/**
 * Hand-curated seeds for the small set of catalog-style endpoints that have
 * no natural empty state (capabilities, model catalog, repository owners).
 * Everything else starts empty and tests seed the records they need.
 *
 * Designed to match the tier-3 fallback in `scripts/generate-mock.mjs` —
 * schema-driven defaults are good for unit tests bypassing state, but a
 * realistic-looking model catalog and capabilities object make UI smoke
 * specs less brittle.
 */

import type { Capabilities } from '../generated/client/models/Capabilities';
import type { ModelCatalogResponse } from '../generated/client/models/ModelCatalogResponse';
import type { RepositoryOwner } from '../generated/client/models/RepositoryOwner';

export function buildSeedCapabilities(): Capabilities {
  return { features: [] };
}

export function buildSeedModelCatalog(): ModelCatalogResponse {
  return {
    vendors: [
      {
        vendor: 'openai',
        displayName: 'OpenAI',
        active: true,
        models: [
          { id: 'gpt-4o-mini', displayName: 'gpt-4o-mini', supportsChat: true },
        ],
      },
    ],
  };
}

export function buildSeedOwners(): RepositoryOwner[] {
  return [
    // Cast through `unknown` because `RepositoryOwner.type` is a
    // namespace-scoped enum (USER/ORGANIZATION) in the codegen output.
    { id: 'mock-user', displayName: 'Mock User', type: 'USER' as unknown as RepositoryOwner['type'] },
  ];
}
