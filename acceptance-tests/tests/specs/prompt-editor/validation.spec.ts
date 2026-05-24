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
 * TS-mock spec for the prompt form's required-field validation
 * (epic #248, phase C1 — issue #259). This spec covers the invariants
 * currently asserted by the Java helper
 * `PromptWorkflowHelper.assertRequiredFieldValidation`, called from
 * `HappyPathUserJourneyTest#shouldValidateRequiredFields` (`@Order(50)`),
 * which C2 (#260) will delete once this spec is green on main.
 *
 * Coverage parity with `assertRequiredFieldValidation`:
 *   - Open `/prompts/new` and **clear** the name + group inputs (the SPA
 *     pre-populates them from `getDefaultTemplate`, mirroring the
 *     production flow that the Java helper exercises).
 *   - Tab off the cleared fields (`keyboard.press('Tab')`) so the form's
 *     error derivation catches up before we assert.
 *   - Assert `prompt-name-error` and `prompt-group-error` testids are
 *     visible.
 *   - Assert the submit button (`save-prompt-button`) is disabled.
 *
 * SPA behaviour (verified by code-reading
 * `components/ui/src/prompts-v2/form/validation.ts`,
 * `components/ui/src/prompts-v2/form/PromptFormPage.tsx`, and
 * `components/promptlm-web-ui/src/features/prompt-editor/PromptFormShell.tsx`):
 *   - On `/prompts/new`, the editor calls `getDefaultTemplate` and seeds the
 *     draft from the response. The OpenAPI spec ships example values for
 *     name + group (`support_welcome` / `support`), so a freshly-loaded
 *     `/prompts/new` does NOT have empty required fields — the user (or
 *     the Java helper) has to clear them first to see the required-field
 *     errors. This spec mirrors that interaction shape.
 *   - `validateDraft` runs on every render — errors are not gated by a
 *     submit attempt. Once `name` is empty, `prompt-name-error` is in
 *     the DOM on the next render.
 *   - `name` and `group` use `.trim()` before checking emptiness AND
 *     enforce a slug pattern (`^[A-Za-z0-9_-]+$`) when non-empty. So
 *     whitespace-only input fails the required check (errors still
 *     visible), not the pattern check.
 *   - The submit button is `disabled` whenever `errors.hasErrors` is
 *     true — clicking it is a no-op until every required field is
 *     valid.
 *
 * Each invariant lives in its own `test()` block so a grep of the test
 * name lands on a single failure cause.
 */

import { test, expect } from '../../fixtures/backend';
import type { Page } from '@playwright/test';

import type { BackendFixture } from '../../fixtures/backend.types';

// Fixed-prefix UUID for the seeded project. Mirrors the style established
// by the A3 (#251, PR #279) smoke spec and A4 (#252, PR #280) navigation
// spec — a UUID is required because the mock's ajv response-schema
// validator enforces `format: uuid` on project ids.
const PROJECT_ID = '44444444-4444-4444-8444-444444444401';

/**
 * Common setup: seed a project so the SPA's bootstrap `getAllProjects`
 * call returns a non-empty list (the mock's schema validator otherwise
 * trips on the spec's `contains` clause — same workaround as
 * `smoke/app-boots.spec.ts`). Then navigate to `/prompts/new` and wait
 * for the form to mount. The `prompt-name-input` testid carrying the
 * template-seeded `support_welcome` value is the canonical "the
 * template loaded" signal — until it resolves, the form is in its
 * pre-template skeleton state and clearing the field would race the
 * template fill.
 */
async function openNewPromptForm(
  page: Page,
  backend: BackendFixture,
): Promise<void> {
  await backend.seedProject({ id: PROJECT_ID, name: 'C1 validation project' });
  await page.goto('/prompts/new');
  // Wait for `getDefaultTemplate` to land — the input value transitions
  // from '' to the spec's `name` example value. Awaiting non-empty value
  // is the load-complete signal that doesn't depend on the exact
  // example.
  await expect(page.getByTestId('prompt-name-input')).not.toHaveValue('');
}

test('(a) clearing name and group on /prompts/new shows both errors and disables save', async ({
  page,
  backend,
}) => {
  await openNewPromptForm(page, backend);

  // Mirror `PromptWorkflowHelper.assertRequiredFieldValidation`: the
  // form arrived with values from `getDefaultTemplate`; clear them to
  // expose the required-field errors.
  await page.getByTestId('prompt-name-input').fill('');
  await page.getByTestId('prompt-group-input').fill('');
  // Move focus off the cleared fields so React commits the draft and
  // the error spans get a chance to mount before we assert.
  await page.keyboard.press('Tab');

  // The error spans are rendered conditionally by `IdentityBlock` when
  // `errors.metadata.name` / `errors.metadata.group` are set — see
  // `components/ui/src/prompts-v2/form/sections.tsx`. With both fields
  // empty, validation emits the messages 'Enter a prompt name.' /
  // 'Select a prompt group.' and the testid-bearing spans render.
  await expect(page.getByTestId('prompt-name-error')).toBeVisible();
  await expect(page.getByTestId('prompt-group-error')).toBeVisible();

  // Coverage parity: the Java helper asserts the save button is
  // disabled. `errors.hasErrors` is true, so the create button is
  // disabled too.
  await expect(page.getByTestId('save-prompt-button')).toBeDisabled();

  // Verify the SPA stayed on the create route — no navigation
  // occurred (which would happen on a successful create).
  expect(new URL(page.url()).pathname).toBe('/prompts/new');

  // Belt-and-braces: `createPromptSpec` was never called. The disabled
  // button can't fire a submit, so this is implied by the above — but
  // an explicit zero-call assertion documents the invariant and would
  // catch a regression where the form bypasses the button (e.g.
  // submitting on Enter).
  await backend.expectCalled('createPromptSpec', { times: 0 });
});

test('(b) filling name after clearing both clears name error; group error remains; save still disabled', async ({
  page,
  backend,
}) => {
  await openNewPromptForm(page, backend);

  // Pre-condition: clear both and confirm both errors visible — same
  // starting point as (a).
  await page.getByTestId('prompt-name-input').fill('');
  await page.getByTestId('prompt-group-input').fill('');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('prompt-name-error')).toBeVisible();
  await expect(page.getByTestId('prompt-group-error')).toBeVisible();

  // Filling a valid slug into the name input clears the name-required
  // error. Validation re-runs on every keystroke (state-driven
  // re-render), so we don't need to blur or tab out for the error
  // span to detach.
  await page.getByTestId('prompt-name-input').fill('c1-validates');

  await expect(page.getByTestId('prompt-name-error')).toBeHidden();
  await expect(page.getByTestId('prompt-group-error')).toBeVisible();

  // Save stays disabled — the group is still empty, plus the other
  // required fields (description, vendor, model, user message) are
  // still unsatisfied in the cleared state.
  await expect(page.getByTestId('save-prompt-button')).toBeDisabled();
});

test('(c) filling all required fields enables save; submit fires createPromptSpec and nav leaves /prompts/new', async ({
  page,
  backend,
}) => {
  await openNewPromptForm(page, backend);

  // Clear the template-seeded name + group and substitute our own
  // identifiers so the assertion below is meaningful (otherwise it
  // would match the template values).
  await page.getByTestId('prompt-name-input').fill('c1-validates');
  await page.getByTestId('prompt-group-input').fill('c1-group');

  // The form has more required fields than just name + group — the
  // submit button stays disabled until every entry in `validateDraft`
  // passes (see `components/ui/src/prompts-v2/form/validation.ts`):
  //   - name + group (slug pattern)
  //   - description (non-empty trim)
  //   - request.vendor + request.model
  //   - at least one user message with content
  // The template seeds vendor/model/messages but leaves description
  // blank; this fills the rest of the gap to prove the success path.
  await page.getByTestId('description-text').fill('C1 validation success path');

  // The vendor select's options are hardcoded in `RailModel` (see
  // `components/ui/src/prompts-v2/form/sections.tsx::VENDOR_OPTIONS`)
  // — 'openai' is a stable value across builds.
  await page.getByTestId('request-vendor-select').selectOption('openai');

  // Despite its `request-model-select` testid, the model field is a
  // `<TextInput>` (a free-form text input), not a `<select>` — see
  // sections.tsx line 482. We fill rather than selectOption.
  await page.getByTestId('request-model-select').fill('gpt-4o-mini');

  // The `prompt-text` testid is attached to the *last* user message
  // textarea (`sections.tsx` line 372). Filling content satisfies the
  // 'at least one user message' invariant.
  await page.getByTestId('prompt-text').fill('hello world');

  // All required fields now pass — save enables.
  const saveButton = page.getByTestId('save-prompt-button');
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // The shell navigates to `/prompts/<id>` on a successful create
  // (see `PromptFormShell.handleSubmit`). The mock's
  // `materialisePromptFromCreationRequest` synthesises an id when the
  // request omits one — currently `${group}/${name}` — so the target
  // URL is `/prompts/c1-group/c1-validates`. That two-segment path
  // doesn't match `/prompts/:id` (single segment) and lands on the
  // SPA's 404 route — that's fine for this test, because C1 only
  // needs to prove that the SPA navigated *off* `/prompts/new` after
  // the create round-trip. Matches the URL gate that the Java
  // helper's `createPromptViaForm` uses (`!"new".equals(segment)`).
  await page.waitForURL(
    (url) => {
      if (!url.pathname.startsWith('/prompts/')) return false;
      const rest = url.pathname.slice('/prompts/'.length);
      const first = rest.split('/', 1)[0] ?? '';
      return first.length > 0 && first !== 'new';
    },
    { timeout: 15_000 },
  );

  // The submit hit the mock with exactly one `createPromptSpec` call
  // carrying the slug-shaped name + group we typed. The matcher is
  // structural — we don't pin to the exact wire shape so the test
  // survives future payload tweaks.
  await backend.expectCalled('createPromptSpec', {
    times: 1,
    withBodyMatching: (body) => {
      if (typeof body !== 'object' || body == null) return false;
      const b = body as Record<string, unknown>;
      return b.name === 'c1-validates' && b.group === 'c1-group';
    },
  });
});

test('(d) whitespace-only name and group do not satisfy required fields — both errors remain visible', async ({
  page,
  backend,
}) => {
  await openNewPromptForm(page, backend);

  // `validation.ts` runs `.trim()` on both `name` and `group` before
  // the emptiness check (lines 50–56). Filling whitespace therefore
  // fails the required check — the error message stays the
  // required-field copy ('Enter a prompt name.' /
  // 'Select a prompt group.'), not the slug-pattern message.
  await page.getByTestId('prompt-name-input').fill('   ');
  await page.getByTestId('prompt-group-input').fill('   ');

  // Tab out to mirror the Java helper's `keyboard().press('Tab')` —
  // not strictly necessary because validation runs every render, but
  // it matches the production interaction shape and proves the
  // assertion isn't a transient pre-blur state.
  await page.keyboard.press('Tab');

  await expect(page.getByTestId('prompt-name-error')).toBeVisible();
  await expect(page.getByTestId('prompt-group-error')).toBeVisible();

  // Save remains disabled — whitespace doesn't unlock submission.
  await expect(page.getByTestId('save-prompt-button')).toBeDisabled();
});
