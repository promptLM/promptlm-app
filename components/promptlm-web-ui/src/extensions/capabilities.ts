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

export type Capability = string;

type ExtensionLoader = {
  capability: Capability;
  load: () => Promise<void>;
};

const loaders: ExtensionLoader[] = [];
const loaded = new Set<ExtensionLoader>();

export const registerCapabilityExtension = (capability: Capability, load: () => Promise<void>) => {
  loaders.push({ capability, load });
};

export const loadExtensionsForCapabilities = async (capabilities: Capability[] = []) => {
  if (!capabilities.length || !loaders.length) {
    return;
  }

  const enabled = new Set(capabilities);
  const pending = loaders.filter((loader) => enabled.has(loader.capability) && !loaded.has(loader));

  if (!pending.length) {
    return;
  }

  const results = await Promise.allSettled(
    pending.map(async (loader) => {
      loaded.add(loader);
      await loader.load();
    }),
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      // eslint-disable-next-line no-console
      console.warn('Failed to load extension for capability', pending[index]?.capability, result.reason);
    }
  });
};
