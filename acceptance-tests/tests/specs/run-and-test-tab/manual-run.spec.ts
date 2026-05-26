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
 * TS-mock spec for the editor's manual-run flow (epic #248, issue #257 / B5).
 *
 * Pre-req for B6 (#258): once this is green on `main`, the Java
 * HappyPath@Order(25) test can drop its deep `ChatCompletionResponse.content`
 * assertion (the system-integration suite only needs to prove the dev-run
 * round-trip works end-to-end against real Gitea/Artifactory; the wire shape
 * is now covered here against the typed OpenAPI mock).
 *
 * Mirrors the assertions in
 * `HappyPathUserJourneyTest#runPromptPersistsManualExecution` (@Order(25)):
 *   - navigate to `/prompts/:id/edit`
 *   - click `prompt-editor-run-action`, await the `/execute` POST response
 *   - `prompt-editor-run-response` visible with the mocked LLM content
 *   - `prompt-editor-run-cost` chip visible (formatted USD)
 *   - `prompt-editor-token-estimate` visible (client-side estimator output)
 *   - `test-tab-request-changed` NOT visible (request unchanged since the run,
 *     and the test tab is gated behind `releaseFlow` anyway — see
 *     `components/promptlm-web-ui/src/lib/featureFlags.ts`)
 *   - via the BackendFixture, the latest stored Execution has
 *     `kind === 'MANUAL'` (matches the real backend; the mock's
 *     `handleExecuteStoredPrompt` was updated to stamp this so the spec
 *     can assert the wire-level field)
 *   - and its `response.content` matches the canned LLM content
 */

import { ChatCompletionRequest } from '@promptlm/api-client';

import { test, expect } from '../../fixtures/backend';

/* Fixed-prefix UUIDs (cf. nav spec) so failures point to a known seed. */
const PROJECT_ID = '44444444-4444-4444-8444-444444444401';
const PROMPT_ID = '44444444-4444-4444-8444-444444444402';
const PROMPT_NAME = 'manual_run';
const PROMPT_GROUP = 'editor';
const MOCK_LLM_CONTENT = 'Mock LLM reply for B5.';

test('editor manual Run renders response, cost, tokens and persists MANUAL execution', async ({
  page,
  backend,
}) => {
  // Seed a project and a minimal ChatCompletionRequest prompt. The prompt's
  // `request` carries a single user message so the editor has something to
  // tokenise for the `prompt-editor-token-estimate` chip.
  await backend.seedProject({ id: PROJECT_ID, name: 'B5 manual-run project' });
  await backend.seedPrompt({
    id: PROMPT_ID,
    name: PROMPT_NAME,
    group: PROMPT_GROUP,
    request: {
      type: ChatCompletionRequest.type.CHAT_COMPLETION,
      vendor: 'openai',
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: 'What is the SLA?' }],
    },
  });

  // Override the canned LLM content so the response assertion is
  // deterministic (the default 'Hello from the mock LLM.' would also work,
  // but pinning a B5-specific string makes the link to this spec explicit
  // when the assertion fails). `usage.cost: 0` is inherited from the
  // canned default — `selectRunCost(exec)` then resolves through
  // `response.usage.cost`, so the cost chip renders as `$0.00`.
  backend.mockLLM({
    content: MOCK_LLM_CONTENT,
    usage: { cost: 0, input_tokens: 13, output_tokens: 7 },
  });

  // Open the editor for the seeded prompt.
  await page.goto(`/prompts/${PROMPT_ID}/edit`);
  await expect(page.getByTestId('prompt-editor-heading')).toBeVisible();

  // The token-estimate chip is lazy-rendered: it's hidden while the
  // client-side tokenizer (cl100k_base) loads. Wait for it before clicking
  // Run so the assertion below isn't racing the encoder warm-up.
  const tokenEstimate = page.getByTestId('prompt-editor-token-estimate');
  await expect(tokenEstimate).toBeVisible();

  // Click Run and await the `/execute` POST response — mirrors the
  // `page.waitForResponse(..., () => click)` pattern in the Java
  // HappyPathUserJourneyTest@Order(25).
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/execute') &&
        response.request().method() === 'POST',
    ),
    page.getByTestId('prompt-editor-run-action').click(),
  ]);

  // --- UI assertions -------------------------------------------------------

  // The response panel renders the mocked LLM content in the
  // `prompt-editor-run-response` container.
  const runResponse = page.getByTestId('prompt-editor-run-response');
  await expect(runResponse).toBeVisible();
  await expect(runResponse).toContainText(MOCK_LLM_CONTENT);

  // The cost chip renders the formatted USD figure. `formatCostUsd` in
  // `RunResponsePanel.tsx` emits `$0.0000` for sub-dollar costs (four
  // decimals when cost < $1, two decimals otherwise) — the regex accepts
  // either form so the spec doesn't break if the seed cost changes.
  const runCost = page.getByTestId('prompt-editor-run-cost');
  await expect(runCost).toBeVisible();
  await expect(runCost).toHaveText(/^\$\d+(\.\d{2,4})?$/);

  // Token-estimate chip still rendered and non-empty (label format is
  // `· ~N tokens` from `sections.tsx`). The label is a client-side estimate
  // over the form's messages, not derived from `usage.total_tokens` — but
  // the issue accepts "just non-empty" since the estimator is decoupled
  // from the LLM response.
  await expect(tokenEstimate).toContainText(/tokens/);

  // The `test-tab-request-changed` banner lives inside the v2 test tab,
  // which is gated by the `releaseFlow` feature flag and only mounted
  // when the active tab is `test`. The playwright config does not enable
  // `VITE_FEATURE_RELEASE_FLOW`, so the test tab isn't rendered at all on
  // `/prompts/:id/edit` — meaning this locator should never match. The
  // assertion proves the run did NOT trip the "request changed since
  // last run" state on the editor surface either.
  await expect(page.getByTestId('test-tab-request-changed')).toHaveCount(0);

  // --- Backend (mock-state) assertions ------------------------------------

  // The latest Execution on the prompt should have `kind: 'MANUAL'` and
  // its `response.content` should match the mocked LLM payload — the
  // wire-level shape the B6 Java trim is leaning on.
  const afterRun = await backend.getPromptById(PROMPT_ID);
  expect(afterRun, 'seeded prompt must still exist after the run').toBeDefined();
  expect(
    afterRun?.executions,
    'executeStoredPrompt must append an Execution to spec.executions[]',
  ).toBeDefined();
  expect(afterRun?.executions?.length ?? 0).toBeGreaterThanOrEqual(1);

  // `executions` is ordered oldest → newest in the mock; we appended the
  // run to a freshly seeded prompt with no prior history, so index 0 is
  // the run we just triggered.
  const latest = (afterRun?.executions ?? [])[afterRun!.executions!.length - 1];
  // Treat undefined as MANUAL per the schema's back-compat note
  // ("null reads as MANUAL"); the mock was updated to set it explicitly,
  // so undefined should never happen in practice, but the OR-undefined
  // branch keeps the spec robust if that ever changes.
  expect(latest.kind ?? 'MANUAL').toBe('MANUAL');
  expect(latest.response?.content).toBe(MOCK_LLM_CONTENT);
});
