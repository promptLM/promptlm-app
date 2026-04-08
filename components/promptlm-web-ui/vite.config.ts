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

import { defineConfig, loadEnv } from 'vite';
import { cwd } from 'node:process';
import { componentTagger } from 'lovable-tagger';

const resolveShared = (relative: string) => new URL(relative, import.meta.url).pathname;
const resolveWorkspace = (relative: string) => new URL(relative, import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '');
  const proxyTarget =
    env.PROMPTLM_API_PROXY_TARGET ?? env.VITE_PROMPTLM_API_BASE_URL ?? 'http://localhost:8085';

  return {
    // Keep Vite's default JSX transform to avoid sporadic hangs in the SWC plugin path.
    plugins: [mode === 'development' && componentTagger()].filter(Boolean),
    server: {
      host: '::',
      port: 8080,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
        '@api-common': resolveShared('./src/api-common'),
        react: resolveWorkspace('../../node_modules/react'),
        'react-dom': resolveWorkspace('../../node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            typeof warning.id === 'string' &&
            warning.id.includes('/node_modules/')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  };
});
