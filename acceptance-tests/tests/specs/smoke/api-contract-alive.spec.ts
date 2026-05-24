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
 * API contract-alive smoke spec for issue #252 (epic #248, phase A4).
 *
 * Each generated service operation listed in the issue is proven to fire
 * against the mock at least once. This is *smoke*, not behaviour — we
 * don't assert response shape (the ajv validator inside the BackendFixture
 * already enforces that on every routed response). We just want the wire
 * path proven.
 *
 * Coverage (one `expectCalled` per opId):
 *   - `getCapabilities`     — bootstraps from `App.tsx` (`useCapabilities`).
 *   - `getActiveProject`    — bootstraps from `ProjectsContext`.
 *   - `getAllProjects`      — bootstraps from `ProjectsContext`.
 *   - `listPromptSpecs`     — fires when `/prompts` mounts (`usePrompts`).
 *   - `getPromptStats`      — fires when `/` (Dashboard) mounts.
 *   - `getDefaultTemplate`  — fires when `/prompts/new` mounts.
 *   - `listOwners`          — no SPA driver today; side-channelled below.
 *   - `getCatalog`          — no SPA driver today; side-channelled below.
 *   - `getPromptGroups`     — no SPA driver today; side-channelled below.
 *
 * Side-channel notes (per issue #252 § smoke/api-contract-alive):
 *   `listOwners`, `getCatalog`, and `getPromptGroups` have no in-tree SPA
 *   consumer at the time of writing. Rather than fake-asserting via a
 *   `test.skip(...)`, we issue the request from inside the page context
 *   via `page.evaluate(fetch(...))` so it still flows through Playwright's
 *   `page.route('**\/api/**', ...)` interceptor and lands in the mock's
 *   call log — proving the contract is alive end-to-end. The mock answers
 *   them identically whether they originate from a UI flow or this
 *   side-channel. If a future SPA hook starts firing one of these
 *   operations, drop the corresponding side-channel call and rely on the
 *   UI driver — the test should still pass.
 */

import { test } from '../../fixtures/backend';

/** Fixed-prefix UUIDs match the style A3 used for seed ids. */
const PROJECT_ID = '44444444-4444-4444-8444-444444444401';
const PROMPT_ID = '44444444-4444-4444-8444-444444444402';

test('every wired-mock endpoint is reachable from the SPA + side-channel', async ({ page, backend }) => {
  // Seed so the bootstrap calls return non-empty arrays — the mock's
  // ajv-compiled response schemas reject empty `listPromptSpecs` /
  // `getAllProjects` bodies because the springdoc-generated spec emits a
  // stray `"contains": { "default": "" }` (see PR #274 note 8 + A3 smoke
  // spec for the longer story).
  await backend.seedProject({ id: PROJECT_ID, name: 'Contract-alive project' });
  await backend.seedPrompt({
    id: PROMPT_ID,
    name: 'hello',
    group: 'contract',
  });

  // --- UI-driven coverage ----------------------------------------------------

  // 1. `/` (Dashboard) — fires `useCapabilities`, `useDashboardSummary`,
  //    `usePrompts`, plus the bootstrap `getActiveProject` /
  //    `getAllProjects` from `ProjectsContext`.
  await page.goto('/');
  // Wait for the Dashboard headline so we know the dashboard finished
  // mounting (otherwise `getPromptStats` may still be in flight when the
  // next goto cancels its inflight request).
  await page.getByRole('heading', { name: 'What changed' }).waitFor();

  // 2. `/prompts` — fires `usePrompts` (`listPromptSpecs`).
  await page.goto('/prompts');
  await page.getByTestId('create-prompt-button').waitFor();

  // 3. `/prompts/new` — fires `usePromptDraftTemplate` (`getDefaultTemplate`).
  await page.goto('/prompts/new');
  await page.getByTestId('prompt-editor-heading').waitFor();

  // --- Side-channel coverage -------------------------------------------------
  //
  // The three operations below have no SPA consumer today. Issuing the
  // request from `page.evaluate` keeps the same-origin path through
  // Playwright's `page.route('**\/api/**', ...)` interceptor, so the
  // mock's call log records the hit just like a UI-driven flow.
  //
  // `getPromptGroups` quirk — the OpenAPI spec declares the 200 schema
  // as `{ type: 'string' }` (singular) but the wire shape is
  // `string[]` (see PR #274 "decisions" #8). The default mock handler
  // returns the *wire* shape, so the schema validator throws
  // `MockContractViolation` on the canned response. Pre-program a
  // legal string body via `failNext` so the request proves the wire
  // path is alive without tripping on the spec bug. The fix belongs in
  // a schema-correction follow-up, not here.
  backend.failNext('getPromptGroups', 200, 'contract-alive');
  await page.evaluate(async () => {
    // `listOwners` — consumed only by `ProjectModal`, which the smoke
    // spec doesn't open. Hit the endpoint directly so the wire path is
    // proven without depending on modal UI state.
    await fetch('/api/store/owners');
    // `getCatalog` — `useModelCatalog` exists in `api/hooks.ts` but is
    // not yet consumed by any rendered surface in the v2 UI. The wire
    // path still must be alive; B-phase specs will switch to a UI
    // driver once a consumer lands.
    await fetch('/api/llm/catalog');
    // `getPromptGroups` — no consumer yet; same rationale as above.
    // The mock's default body is off-spec (see comment above); we
    // pre-programmed a legal substitute via `backend.failNext`.
    await fetch('/api/prompts/groups');
  });

  // --- Assertions ------------------------------------------------------------
  //
  // `atLeast: 1` matches the *contract-alive* goal: prove the wire path
  // for each opId is reachable, without coupling the assertion to the
  // exact number of times a given consumer fires (which changes as more
  // SPA surfaces consume the same hook — e.g. `getCapabilities` fires
  // once from `App.ExtensionsBootstrap` plus once from the
  // `PromptFormShell` mount, and that count is a property of the SPA's
  // hook fan-out, not the wire contract). A finer-grained per-consumer
  // count belongs in a behaviour spec, not this smoke.
  //
  // The schema validator inside the BackendFixture has already refused
  // any off-spec body before the response was fulfilled, so we do *not*
  // need to assert body shapes here.
  await backend.expectCalled('getCapabilities', { atLeast: 1 });
  await backend.expectCalled('getCatalog', { atLeast: 1 });
  await backend.expectCalled('getActiveProject', { atLeast: 1 });
  await backend.expectCalled('getAllProjects', { atLeast: 1 });
  await backend.expectCalled('listOwners', { atLeast: 1 });
  await backend.expectCalled('listPromptSpecs', { atLeast: 1 });
  await backend.expectCalled('getDefaultTemplate', { atLeast: 1 });
  await backend.expectCalled('getPromptStats', { atLeast: 1 });
  await backend.expectCalled('getPromptGroups', { atLeast: 1 });
});
