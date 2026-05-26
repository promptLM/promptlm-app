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

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the promptLM TypeScript acceptance-test suite.
 *
 * Two projects are defined:
 *  - `chromium-mock` (default): runs every spec against the typed OpenAPI mock
 *    served by the BackendFixture. The `baseURL` here is a placeholder; the
 *    fixture overrides it at runtime once the mock server is bound to a port.
 *  - `chromium-real` (opt-in): same as above, but only included when the
 *    environment variable `PLAYWRIGHT_PROFILE=real` is set, so we never run
 *    real-backend specs unintentionally in CI.
 */
const includeRealProject = process.env.PLAYWRIGHT_PROFILE === 'real';

export default defineConfig({
  testDir: './tests/specs',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mock',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:0',
      },
    },
    ...(includeRealProject
      ? [
          {
            name: 'chromium-real',
            use: {
              ...devices['Desktop Chrome'],
              baseURL: 'http://localhost:0',
            },
          },
        ]
      : []),
  ],
});
