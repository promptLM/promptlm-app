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

import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],

  // Storybook 9 consolidates addon-essentials and addon-interactions into core.
  // addon-docs is installed explicitly to keep autodocs support.
  addons: [getAbsolutePath("@storybook/addon-docs"), getAbsolutePath("msw-storybook-addon")],

  // Reuse the webapp's public/ tree so the brand favicon set is served by
  // Storybook chrome too. See #111 BS-5.
  staticDirs: ['../public'],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  async viteFinal(viteConfig) {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias ??= {};
    Object.assign(viteConfig.resolve.alias, {
      '@': '/src',
      // Pre-existing path '../../../apps/promptlm-webapp/src/api-common' no
      // longer exists — the api-common module lives inside this workspace.
      // See vite.config.ts (which already points at the local copy).
      '@api-common': new URL('../src/api-common', import.meta.url).pathname,
    });

    viteConfig.optimizeDeps ??= {};
    viteConfig.optimizeDeps.include = [
      ...(viteConfig.optimizeDeps.include ?? []),
      '@mui/material',
      '@mui/material/*',
      '@mui/system',
    ];

    return viteConfig;
  }
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")));
}
