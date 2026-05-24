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
 * Schema-contract canary for issue #252 (epic #248, phase A4).
 *
 * Proves that the ajv-compiled response-schema validator embedded in
 * `BackendFixture` (mock mode) does its job in both directions:
 *
 *   1. *happy path*  — well-formed responses produced by the canned
 *      handler table pass validation; driving a handful of routes does
 *      not throw `MockContractViolation`.
 *
 *   2. *deliberate violation* — an off-spec body deliberately injected
 *      via the fixture's `validateResponse` entrypoint surfaces a
 *      `MockContractViolation` whose `opId` and `status` match the
 *      injection, instead of silently leaking through.
 *
 * This is the canary that A4 must not erode: if a future change to the
 * mock pipeline accidentally short-circuits validation, this spec fails
 * loudly with the actual symptom rather than waiting for a downstream
 * spec to surface a flaky off-spec body.
 *
 * The `validateResponse` method on `BackendFixture` was added by A4
 * (see `backend.types.ts`) precisely so this canary can assert the
 * validator throws without depending on Playwright's route-handler
 * exception plumbing.
 */

import { test, expect } from '../../fixtures/backend';
import { MockContractViolation } from '@promptlm/api-client';

const PROJECT_ID = '55555555-5555-4555-8555-555555555501';
const PROMPT_ID = '55555555-5555-4555-8555-555555555502';

test('happy path — well-formed mock responses pass schema validation', async ({ page, backend }) => {
  // Seed so the bootstrap calls return non-empty, schema-compliant
  // bodies. The mock validator runs on every routed response before
  // `route.fulfill`; an empty `prompts` array would fail the
  // `listPromptSpecs` schema (see PR #274 note 8) and we want this test
  // to prove the *happy path*, not exercise that edge case.
  await backend.seedProject({ id: PROJECT_ID, name: 'Schema happy path' });
  await backend.seedPrompt({
    id: PROMPT_ID,
    name: 'hello',
    group: 'schema',
  });

  // Drive a few routes so the validator runs against multiple operations.
  // If any response violates its schema, the route-handler will throw
  // `MockContractViolation` and the page navigation will fail — which
  // surfaces here as a test failure with a precise message.
  await page.goto('/');
  await page.getByRole('heading', { name: 'What changed' }).waitFor();

  await page.goto('/prompts');
  await page.getByTestId('create-prompt-button').waitFor();

  await page.goto('/prompts/new');
  await page.getByTestId('prompt-editor-heading').waitFor();

  // Direct call into the fixture's validator entrypoint for a couple of
  // well-formed catalog bodies — proves the validator returns void (not
  // just "fails to throw" via a successful navigation).
  expect(() =>
    backend.validateResponse('getActiveProject', 200, {
      id: PROJECT_ID,
      name: 'Schema happy path',
    }),
  ).not.toThrow();

  expect(() =>
    backend.validateResponse('listPromptSpecs', 200, [
      { id: PROMPT_ID, name: 'hello', group: 'schema' },
    ]),
  ).not.toThrow();
});

test('deliberate violation — malformed response surfaces MockContractViolation', async ({ backend }) => {
  // Inject a body that obviously violates the `listPromptSpecs` 200
  // response schema. The spec declares the response as
  // `{ type: 'array', items: { $ref: '#/components/schemas/PromptSpec' } }`,
  // so a plain object trips the `type` check immediately and ajv
  // produces a single `type: array` error.
  const opId = 'listPromptSpecs';
  const status = 200;
  const malformedBody = { not: 'an array' };

  // The validator throws synchronously, so wrap it in a function and
  // assert `toThrow(MockContractViolation)`. The `rejects.toThrow`
  // form from the issue body applies when the trigger is async; this
  // path is sync because we don't need to plumb through a Playwright
  // route handler — the gap-documentation rationale in the issue body.
  let captured: unknown;
  try {
    backend.validateResponse(opId, status, malformedBody);
  } catch (err) {
    captured = err;
  }

  expect(captured).toBeInstanceOf(MockContractViolation);
  const violation = captured as MockContractViolation;
  expect(violation.opId).toBe(opId);
  expect(violation.status).toBe(status);
  // The error array should be non-empty — ajv always emits at least one
  // entry on failure (we asked for `allErrors: true` in `schema-validate.ts`).
  expect(violation.errors.length).toBeGreaterThan(0);
});

test('deliberate violation — async path through Promise.reject equivalent', async ({ backend }) => {
  // The issue body suggests `await expect(promise).rejects.toThrow(...)`
  // as the canonical shape. The validator is synchronous, so we wrap
  // it in a microtask to demonstrate the async surface as well — the
  // mock pipeline's *consumers* are async (e.g. `route.fulfill` flows
  // through `await`), so proving the async assertion shape works
  // protects against future re-pluming.
  const trigger = Promise.resolve().then(() => {
    backend.validateResponse('getAllProjects', 200, 'not-an-array' as unknown);
  });

  await expect(trigger).rejects.toThrow(MockContractViolation);
});
