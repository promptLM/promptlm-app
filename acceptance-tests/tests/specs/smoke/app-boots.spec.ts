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

import { test, expect } from '../../fixtures/backend';

/**
 * First end-to-end smoke spec for the TS-mock suite (epic #248, issue #251).
 *
 * Asserts the SPA boots against the OpenAPI-driven mock backend:
 *   - the Vite-served root URL resolves
 *   - the primary-navigation sidebar renders (proving React + the app
 *     shell are mounted)
 *   - the SPA's bootstrap `getCapabilities` call was routed through the
 *     mock fixture exactly once
 *
 * Per design § 2.5 — replaces the temporary `scaffold.spec.ts` placeholder
 * that A1 (#249, PR #268) added so `playwright test --list` would exit 0.
 */
test('app boots and calls getCapabilities through the mock', async ({ page, backend }) => {
  // Pre-seed a project and a prompt so the SPA's bootstrap `listPromptSpecs`
  // and `getAllProjects` calls return non-empty arrays. The mock's
  // ajv-compiled response schemas would otherwise reject the empty default
  // because the springdoc-generated spec emits a stray
  // `"contains": { "default": "" }` on the list endpoints, which JSON
  // Schema interprets as "must contain >= 1 item". (Spec follow-up —
  // see PR #274 note 8.) Seeding makes the smoke spec independent of that
  // spec bug.
  // IDs are UUIDs per the OpenAPI schema (`format: uuid`). The mock's
  // schema validator enforces this on every response, so seed values
  // must be valid UUIDs even though they're test fixtures.
  await backend.seedProject({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Smoke project',
  });
  await backend.seedPrompt({
    id: '22222222-2222-4222-8222-222222222222',
    name: 'hello',
    group: 'smoke',
  });

  await page.goto('/');

  // The app shell's primary navigation is rendered by `AppSidebar` as
  // `<nav aria-label="Primary navigation">…</nav>` (see
  // `components/ui/src/prompts-v2/shell/AppSidebar.tsx`). It is the first
  // stable, accessibility-labeled element the SPA paints, so it doubles
  // as our "the app booted" signal.
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible();

  // The bootstrap `useCapabilities()` hook in App.tsx fires exactly once
  // on mount. If the mock did not service it, `expectCalled` would throw
  // with the observed-vs-expected message instead of silently passing.
  await backend.expectCalled('getCapabilities', { times: 1 });
});
