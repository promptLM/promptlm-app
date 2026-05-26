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

/**
 * Mock-mode targets the Vite dev server (`vite.config.ts` pins it to port
 * 8080). Real mode targets the Java webapp; the URL here is unused at the
 * SPA level because the real-mode `BackendFixture` is still a stub
 * (issue #251 is mock-only) — overridden in a follow-up issue.
 */
const MOCK_BASE_URL = process.env.PLAYWRIGHT_MOCK_BASE_URL ?? 'http://localhost:8080';
const REAL_BASE_URL = process.env.PLAYWRIGHT_REAL_BASE_URL ?? 'http://localhost:8085';

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
  /**
   * Launch a Vite-served SPA before running mock-mode specs. We use
   * `build` + `preview` rather than `dev` so the browser sees a
   * pre-bundled SPA (no on-demand dep optimisation, no HMR-triggered
   * reload mid-test) — that was the cause of the empty `#root` div we
   * saw with `vite dev`: the first page load aborted itself when Vite
   * finished optimising deps and reloaded.
   *
   * `cwd` is the repo root so npm can resolve the `@promptlm/web-ui`
   * workspace. Real-mode runs override `PLAYWRIGHT_SKIP_WEB_SERVER` to
   * skip this step — the SPA there points at the Java webapp directly.
   */
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command:
          'npm --workspace @promptlm/web-ui run build:dev && ' +
          'npm --workspace @promptlm/web-ui run preview -- --port 8080 --strictPort',
        cwd: '..',
        url: MOCK_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          // Feature flags consumed by featureFlags.ts at build time. The
          // mock-mode suite drives feature-gated routes (e.g. `/prompts/:id/diff`
          // under `promptDiff`) so we enable them here. Real-mode runs use
          // PLAYWRIGHT_SKIP_WEB_SERVER and inherit the Java webapp's flags.
          // Each VITE_FEATURE_* maps to a flag in
          // `components/promptlm-web-ui/src/lib/featureFlags.ts`; Vite folds
          // the env into the build, so flags flip in the bundled SPA used
          // by `preview`. See A4 (#252) for the original feature-flag
          // wiring.
          VITE_FEATURE_DIFF: 'true',
        },
      },
  projects: [
    {
      name: 'chromium-mock',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: MOCK_BASE_URL,
      },
    },
    ...(includeRealProject
      ? [
          {
            name: 'chromium-real',
            use: {
              ...devices['Desktop Chrome'],
              baseURL: REAL_BASE_URL,
            },
          },
        ]
      : []),
  ],
});
