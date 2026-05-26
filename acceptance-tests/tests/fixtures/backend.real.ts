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
 * Real-mode adapter for the `backend` Playwright fixture.
 *
 * Issue #251 is **mock-only** by its body. This module exists so the public
 * `backend.ts` entrypoint can switch on `PLAYWRIGHT_PROFILE=real` without
 * crashing at import time, and so the `BackendFixture` interface is
 * satisfied symmetrically across modes.
 *
 * Every method throws a clear `'real mode not yet wired'` error. The wiring
 * — `PromptSpecificationsService.*`, `PromptStoreService.*`, the
 * `page.on('request', …)` capture used for `expectCalled` — lands in a
 * later issue once at least one real-mode spec exists to justify the
 * shape.
 */

import { test as base, expect } from '@playwright/test';

import type { BackendFixture, ExpectCalledOptions, MockLlmScript } from './backend.types';

const NOT_YET_WIRED = 'real mode not yet wired';

/** Construct a real-mode fixture stub. Every method throws. */
export function buildRealBackendFixtureStub(): BackendFixture {
  const unsupported = (): never => {
    throw new Error(NOT_YET_WIRED);
  };

  return {
    mode: 'real',

    async seedProject() {
      return unsupported();
    },
    async seedPrompt() {
      return unsupported();
    },
    async seedRevision() {
      return unsupported();
    },

    async getPromptById() {
      return unsupported();
    },
    async listPrompts() {
      return unsupported();
    },
    async getActiveProject() {
      return unsupported();
    },

    mockLLM(_script: MockLlmScript) {
      unsupported();
    },

    failNext(_opId: string, _status: number, _body?: unknown) {
      unsupported();
    },

    async expectCalled(_opId: string, _opts?: ExpectCalledOptions) {
      unsupported();
    },

    setCapabilities() {
      unsupported();
    },
    setModelCatalog() {
      unsupported();
    },

    validateResponse() {
      unsupported();
    },
  };
}

export interface RealFixtures {
  backend: BackendFixture;
}

/**
 * Playwright `test` extended with a no-op `backend` fixture for real mode.
 * Selecting this profile is sufficient to satisfy Playwright's typing — any
 * spec that touches `backend` will throw at the first method call until
 * the real adapter is implemented.
 */
export const test = base.extend<RealFixtures>({
  backend: async ({}, use) => {
    await use(buildRealBackendFixtureStub());
  },
});

export { expect };
