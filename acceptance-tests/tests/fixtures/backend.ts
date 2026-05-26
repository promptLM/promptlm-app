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
 * Public entrypoint for the `backend` Playwright fixture.
 *
 * Specs always import `test` and `expect` from this module — they never
 * import from `backend.mock.ts` or `backend.real.ts` directly. The choice
 * between mock and real is driven by the `PLAYWRIGHT_PROFILE` env var,
 * matching the project names in `playwright.config.ts`:
 *
 *   - unset (default) or `mock` → `backend.mock.ts`
 *   - `real`                    → `backend.real.ts`
 *
 * The selection happens at module load. Tests run inside a single profile
 * — Playwright invokes the file once per project, so this is cheap.
 */

import { test as mockTest, expect as mockExpect } from './backend.mock';
import { test as realTest, expect as realExpect } from './backend.real';

const profile = process.env.PLAYWRIGHT_PROFILE ?? 'mock';

export const test = profile === 'real' ? realTest : mockTest;
export const expect = profile === 'real' ? realExpect : mockExpect;

export type { BackendFixture, BackendMode, ExpectCalledOptions, MockLlmScript } from './backend.types';
