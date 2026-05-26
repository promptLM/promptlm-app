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
 * Navigation smoke spec for issue #252 (epic #248, phase A4).
 *
 * Deep-links to every SPA route declared in
 * `components/promptlm-web-ui/src/App.tsx` and asserts the corresponding
 * page renders. One `test()` per route — no clever loops, so grepping for
 * a failing route lands on a single test. Each test is independent: a
 * fresh test-scoped `BackendFixture` resets the mock state between runs.
 *
 * Seed shape: one project + one prompt (`group=demo`, `name=alpha`) so the
 * id-bearing routes (`/prompts/:id`, `/prompts/:id/edit`, `/prompts/:id/diff`)
 * have a real target. UUID ids satisfy the spec's `format: uuid` constraint
 * (see A3, PR #279 — the ajv response-schema validator rejects non-UUID ids).
 */

import { test, expect } from '../../fixtures/backend';

/** Seed-id constants — fixed-prefix UUIDs match the style A3 used. */
const PROJECT_ID = '33333333-3333-4333-8333-333333333301';
const PROMPT_ID = '33333333-3333-4333-8333-333333333302';
const PROMPT_NAME = 'alpha';
const PROMPT_GROUP = 'demo';

/**
 * Pre-seed a project + prompt and confirm the primary navigation rendered.
 * Centralises the boilerplate that's identical across every route's test.
 */
async function seedAndAssertShell(
  page: import('@playwright/test').Page,
  backend: import('../../fixtures/backend.types').BackendFixture,
): Promise<void> {
  await backend.seedProject({ id: PROJECT_ID, name: 'Nav smoke project' });
  await backend.seedPrompt({
    id: PROMPT_ID,
    name: PROMPT_NAME,
    group: PROMPT_GROUP,
  });
}

test('/ renders the Index (dashboard) page', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto('/');
  // The dashboard headline ("What changed") is the first stable text on
  // the Index page — it's emitted by `pages/Dashboard.tsx` whether or not
  // the stats / prompts queries succeed.
  await expect(page.getByRole('heading', { name: 'What changed' })).toBeVisible();
});

test('/prompts renders the catalog page', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto('/prompts');
  // The catalog top bar's "+ New" button is the canonical anchor — it
  // carries the `create-prompt-button` testid added in the v2 catalog
  // (see `components/ui/src/prompts-v2/catalog/CatalogTopBar.tsx`).
  await expect(page.getByTestId('create-prompt-button')).toBeVisible();
});

test('/prompts/new renders the editor in create mode', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto('/prompts/new');
  // The editor heading testid is rendered by `PromptFormPage` once the
  // shell mounts in create mode — see
  // `components/ui/src/prompts-v2/form/PromptFormPage.tsx`.
  await expect(page.getByTestId('prompt-editor-heading')).toBeVisible();
});

test('/prompts/:id renders the prompt detail page', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto(`/prompts/${PROMPT_ID}`);
  // The detail page renders the `prompt-edit-action` button as part of
  // its action rail (see `pages/PromptDetail.tsx`) — its presence proves
  // the detail layout (not NotFound or a fallback) mounted.
  await expect(page.getByTestId('prompt-edit-action')).toBeVisible();
});

test('/prompts/:id/edit renders the editor in edit mode', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto(`/prompts/${PROMPT_ID}/edit`);
  // Edit mode reuses `PromptFormPage` — same heading testid as create mode.
  await expect(page.getByTestId('prompt-editor-heading')).toBeVisible();
});

test('/prompts/:id/diff renders the diff page', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  // The diff page's stub-corpus lookup is keyed by prompt *name*, not id
  // (`buildStubDiffCorpus` in `api-common/viewModels/promptDiff.ts`). The
  // route param is the lookup key — we deep-link to the seeded name so
  // the corpus resolves both diff sides and the page renders the
  // `prompt-diff-page` testid (gated behind `featureFlags.promptDiff`,
  // which `playwright.config.ts` flips on via `VITE_FEATURE_DIFF=true`).
  await page.goto(`/prompts/${PROMPT_NAME}/diff`);
  await expect(page.getByTestId('prompt-diff-page')).toBeVisible();
});

test('/projects renders the projects page', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto('/projects');
  // `pages/Projects.tsx` emits an `h1 "Projects"` regardless of load
  // state — the most stable anchor for "the projects page rendered".
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
});

test('/bogus-route-that-does-not-exist renders the NotFound page', async ({ page, backend }) => {
  await seedAndAssertShell(page, backend);
  await page.goto('/bogus-route-that-does-not-exist');
  // `pages/NotFound.tsx` emits a literal `h1 "404"`; matching the heading
  // role + name avoids depending on layout-specific wrapper classes.
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});
