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

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const resolveWorkspace = (relative: string) => new URL(relative, import.meta.url).pathname;

// promptlm-report-static produces a single self-contained .html that the
// `promptlm report` CLI emits and a CI pipeline publishes (e.g. to GitHub
// Pages). vite-plugin-singlefile inlines all CSS + JS into the HTML so the
// bundle has no fetch dependencies beyond the document itself.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      // The compiled @promptlm/ui dist references "@/..." path aliases that
      // tsc emits verbatim (we only rewrite relative imports today). Point
      // them at the consuming dist tree so Rollup can resolve them; the
      // shadcn components those aliases reach are tree-shaken out anyway.
      '@': resolveWorkspace('../ui/dist'),
      react: resolveWorkspace('../../node_modules/react'),
      'react-dom': resolveWorkspace('../../node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  base: './',
  server: {
    host: '::',
    port: 5180,
  },
});
