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
 * Placeholder delimiters + defaults round-trip spec for issue #253
 * (epic #248, phase B1).
 *
 * This spec is the TS-mock replacement for the placeholder block of the
 * Java `HappyPathUserJourneyTest@Order(20)` assertions — see
 * `acceptance-tests/src/test/java/dev/promptlm/test/HappyPathUserJourneyTest.java`
 * lines 240-245 (`createdPrompt.getPlaceholders().getStartPattern()` etc.).
 * Coverage parity is the goal: B2 (#254) trims those Java assertions only
 * after this spec lands green.
 *
 * Flow:
 *  1. Pre-seed an active project so the editor's bootstrap calls succeed.
 *  2. Open `/prompts/new`, fill name + group + description.
 *  3. Configure custom delimiters `[[` / `]]` via the placeholder rail.
 *  4. Add placeholders `number_one` and `number_two`; set their default
 *     values to `1` and `2` respectively.
 *  5. Add a user message and type a body that references both
 *     placeholders using the configured delimiters.
 *  6. Pick a vendor + model so the form passes required-field validation.
 *  7. Save and wait for the SPA to navigate to `/prompts/:id`.
 *  8. Round-trip assertion: read the persisted PromptSpec back through the
 *     mock fixture and assert the placeholder wire-format is preserved
 *     (`startPattern`, `endPattern`, and the two `defaults` entries).
 *
 * The third-step delimiter typing matters: the SPA carries `[[ … ]]` in
 * the user message verbatim; the B3 (#255) spec will widen this into a
 * full request-discriminator round-trip. Here we only assert what the
 * placeholder field of the wire-format carries.
 */

import { test, expect } from '../../fixtures/backend';

/** Fixed-prefix UUID matching the A3/A4 seed style. */
const PROJECT_ID = '44444444-4444-4444-8444-444444444401';

const PROMPT_NAME = 'b1-placeholders';
const PROMPT_GROUP = 'b1-group';

test('placeholder delimiters and default values round-trip via createPromptSpec', async ({
  page,
  backend,
}) => {
  // The editor's bootstrap (`useCapabilities`, `useGetAllProjects`,
  // `useListPromptSpecs`) needs a non-empty projects array so the active
  // project sidebar resolves — the smoke spec already documents the
  // schema-validator nuance around empty lists.
  await backend.seedProject({ id: PROJECT_ID, name: 'B1 placeholders project' });

  await page.goto('/prompts/new');

  // Wait for the editor shell to mount before driving form inputs — the
  // shell unfolds the rails lazily and stale captures would race against
  // the user-message section's append. The heading is the canonical
  // "editor is interactive" signal (see Java HappyPath@Order(20)).
  await expect(page.getByTestId('prompt-editor-heading')).toBeVisible();

  // Required fields per `validation.ts`: name, group, description, vendor,
  // model, plus one user message with content. We mirror the Java test
  // exactly for the placeholder-relevant fields and fill the others with
  // the minimum to clear validation.
  await page.getByTestId('prompt-name-input').fill(PROMPT_NAME);
  await page.getByTestId('prompt-group-input').fill(PROMPT_GROUP);
  await page.getByTestId('description-text').fill('B1 placeholder round-trip.');

  // Pick vendor + model so the model-config validator passes. The vendor
  // select carries `openai` per the seed catalog in `defaults.ts`; the
  // model input is a free-text field.
  await page.getByTestId('request-vendor-select').selectOption('openai');
  await page.getByTestId('request-model-select').fill('gpt-4o-mini');

  // Configure custom delimiters via the placeholder rail (see
  // `components/ui/src/prompts-v2/form/sections.tsx` line 615-626). Tab
  // out of each field so React commits the value into state before the
  // next interaction.
  const openInput = page.getByTestId('placeholder-open-sequence-input');
  const closeInput = page.getByTestId('placeholder-close-sequence-input');
  await openInput.fill('[[');
  await openInput.press('Tab');
  await closeInput.fill(']]');
  await closeInput.press('Tab');

  // Add two placeholders. The rail's '+ Add' button appends an empty row;
  // we then fill the freshly-added (last) row's `placeholder-name-input-N`
  // input, then Tab to commit so the row's testid resolves to
  // `placeholder-row-${name}` and the value textarea testid resolves to
  // `placeholder-value-textarea-${name}-0`.
  await addPlaceholder(page, 'number_one');
  await addPlaceholder(page, 'number_two');

  // Set each placeholder's default value via the row's value textarea.
  await page.getByTestId('placeholder-value-textarea-number_one-0').fill('1');
  await page.getByTestId('placeholder-value-textarea-number_one-0').press('Tab');
  await page.getByTestId('placeholder-value-textarea-number_two-0').fill('2');
  await page.getByTestId('placeholder-value-textarea-number_two-0').press('Tab');

  // Fill the user message referencing both placeholders using the
  // configured delimiters. The editor's `draftState.ts` seeds a fresh
  // draft with one empty user message by default (line 87); we fill that
  // existing row rather than clicking `user-prompt-button` — clicking the
  // button would add a *second* empty user message, which fails the
  // per-message non-empty validation in `validation.ts` line 244. The
  // last textarea inside `prompt-messages` carries the `prompt-text`
  // testid (`sections.tsx` line 372 — set only for the last user
  // message), so we target that.
  await page
    .getByTestId('prompt-text')
    .fill('Number one [[number_one]] plus number two [[number_two]] equals?');

  // Save. The PrimaryButton's testid in create-mode is `save-prompt-button`
  // (`PromptFormPage.tsx` line 388). On success the shell navigates from
  // `/prompts/new` to `/prompts/:id` where `:id` is the freshly-created
  // PromptSpec's id (the mock's `materialisePromptFromCreationRequest`
  // synthesises `${group}/${name}` when the request omits `id`).
  await page.getByTestId('save-prompt-button').click();

  // Wait for the navigation transition. We explicitly exclude `/prompts/new`
  // (the starting URL) — a generic `/prompts/<token>` regex matches it and
  // would resolve immediately. This mirrors the Java HappyPath logic.
  await page.waitForURL((url) => {
    if (url == null) return false;
    const href = url.toString();
    const idx = href.indexOf('/prompts/');
    if (idx < 0) return false;
    let tail = href.substring(idx + '/prompts/'.length);
    const slash = tail.indexOf('/');
    if (slash >= 0) tail = tail.substring(0, slash);
    const q = tail.indexOf('?');
    if (q >= 0) tail = tail.substring(0, q);
    const h = tail.indexOf('#');
    if (h >= 0) tail = tail.substring(0, h);
    return tail.length > 0 && tail !== 'new';
  });

  // Extract the id segment from the URL after navigation.
  const navUrl = new URL(page.url());
  const segments = navUrl.pathname.split('/').filter(Boolean);
  // `/prompts/<id>` — `<id>` is everything after the `/prompts/` prefix
  // joined back with `/` (the mock's synthetic ids are `${group}/${name}`,
  // which contains a slash; the SPA encodes it but react-router decodes
  // path segments). Belt-and-braces: pop the literal expected id off the
  // captured PromptSpec instead.
  expect(segments[0]).toBe('prompts');

  // Round-trip assertion — read the PromptSpec back via the fixture and
  // assert the placeholder wire-format. The mock's
  // `materialisePromptFromCreationRequest` translates the SPA's flattened
  // `placeholderStartPattern` / `placeholderEndPattern` / `placeholder`
  // request fields into the nested `placeholders.{startPattern, endPattern,
  // defaults}` response shape — the same projection the real backend
  // performs server-side.
  //
  // We look the prompt up via `listPrompts()` keyed on `(group, name)`
  // rather than `getPromptById(id)` because the mock synthesises ids as
  // `${group}/${name}` (slash inside) and `getPromptById` is just a
  // convenience that ultimately scans the same list. Matching on
  // `(group, name)` keeps this independent of the id-synthesis rule —
  // see open question #1 in the design doc.
  const allPrompts = await backend.listPrompts();
  const created = allPrompts.find(
    (p) => p.name === PROMPT_NAME && p.group === PROMPT_GROUP,
  );
  expect(
    created,
    `Expected prompt ${PROMPT_GROUP}/${PROMPT_NAME} to be persisted; observed ids=${JSON.stringify(allPrompts.map((p) => p.id))}`,
  ).toBeDefined();
  expect(created?.placeholders).toBeDefined();
  expect(created?.placeholders?.startPattern).toBe('[[');
  expect(created?.placeholders?.endPattern).toBe(']]');
  expect(created?.placeholders?.defaults).toMatchObject({
    number_one: '1',
    number_two: '2',
  });

  // Belt-and-braces: confirm the SPA actually issued the create call
  // through the mock. Without this, a regression that silently bypasses
  // the wire path (e.g. a future optimistic-only create) would still
  // appear to "pass" because the test harness wouldn't observe a real
  // request.
  await backend.expectCalled('createPromptSpec', {
    atLeast: 1,
    withBodyMatching: (body) => {
      if (body == null || typeof body !== 'object') return false;
      const b = body as Record<string, unknown>;
      return (
        b.name === PROMPT_NAME &&
        b.group === PROMPT_GROUP &&
        b.placeholderStartPattern === '[[' &&
        b.placeholderEndPattern === ']]'
      );
    },
  });
});

/**
 * Add a placeholder row and commit its `name`. Mirrors
 * `HappyPathUserJourneyTest.addPlaceholder` in the Java suite. The Tab
 * press is load-bearing: it moves focus off the name input so React
 * commits the row's name into state, which then resolves the row's
 * `placeholder-row-${name}` testid and the value textarea's
 * `placeholder-value-textarea-${name}-0` testid.
 */
async function addPlaceholder(
  page: import('@playwright/test').Page,
  name: string,
): Promise<void> {
  await page.getByTestId('placeholder-add-button').click();
  const nameInputs = page.locator("[data-testid^='placeholder-name-input-']");
  const last = nameInputs.last();
  await last.waitFor({ state: 'visible' });
  await last.fill(name);
  await last.press('Tab');
}
