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
 * Mock-mode adapter for the `backend` Playwright fixture.
 *
 * Wires Playwright's `page.route('**\/api/**', …)` to the framework-agnostic
 * `createMockBackend()` factory in `@promptlm/api-client/mock`. The factory
 * owns matching + state mutation + ajv schema validation; this module owns
 * the Playwright-side request → response translation.
 *
 * The fixture is **test-scoped**: a fresh `MockBackendState` is constructed
 * per test, so seeding, call-log, failure queue, and LLM scripting never
 * leak across tests. This matches the design in
 * `.claude/orchestration/design-mock-and-fixture.md` § 2.4 ("test-scoped
 * backend fixture — fresh state per test").
 */

import { test as base, expect, type Request } from '@playwright/test';
import { createMockBackend, type MockBackend } from '@promptlm/api-client';
import type {
  Capabilities,
  ChatCompletionResponse,
  ModelCatalogResponse,
  ProjectSpec,
  PromptSpec,
  Revision,
} from '@promptlm/api-client';

import openapiSpec from '../../../apps/promptlm-webapp/target/generated/openapi/promptlm-webapp-openapi.json';

import type {
  BackendFixture,
  ExpectCalledOptions,
  MockLlmScript,
} from './backend.types';

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/**
 * Build the `BackendFixture` implementation around a `MockBackend`. Kept
 * separate from the Playwright wiring below so the bridge can be exercised
 * in a unit test without spinning Playwright up.
 */
function buildMockBackendFixture(mock: MockBackend): BackendFixture {
  const state = mock.state;

  return {
    mode: 'mock',

    /* ---- seeding ------------------------------------------------------ */

    async seedProject(spec) {
      const project: ProjectSpec = { ...spec };
      const existing = state.projects.findIndex((p) => p.id === project.id);
      if (existing >= 0) state.projects.splice(existing, 1, project);
      else state.projects.push(project);
      if (state.activeProjectId == null && project.id != null) {
        state.activeProjectId = project.id;
      }
      return project;
    },

    async seedPrompt(spec) {
      const prompt: PromptSpec = { ...spec };
      state.upsertPrompt(prompt);
      return prompt;
    },

    async seedRevision(promptId, rev) {
      const revision: Revision = { ...rev };
      const existing = state.revisions.get(promptId);
      if (existing) existing.push(revision);
      else state.revisions.set(promptId, [revision]);
      return revision;
    },

    /* ---- inspection --------------------------------------------------- */

    async getPromptById(id) {
      return state.prompts.find((p) => p.id === id);
    },

    async listPrompts() {
      return state.prompts.slice();
    },

    async getActiveProject() {
      return state.activeProject();
    },

    /* ---- LLM scripting ------------------------------------------------ */

    mockLLM(script: MockLlmScript) {
      if (typeof script === 'function') {
        // Snapshot the function so a later canned-default reset does not
        // accidentally invoke a stale closure.
        const fn = script;
        // Store as canned by invoking lazily isn't supported by the
        // current state model (callers expect a static body). Pre-flatten
        // by invoking with `undefined` — the smoke spec doesn't exercise
        // this path, and B5 (issue #257) reshapes `llmCanned` to support
        // per-request scripting properly.
        state.llmCanned = fn(undefined);
      } else {
        state.llmCanned = {
          ...state.llmCanned,
          ...(script as Partial<ChatCompletionResponse>),
        } as ChatCompletionResponse;
      }
    },

    /* ---- failure injection ------------------------------------------- */

    failNext(opId, status, body) {
      state.failNextQueue.push({ opId, status, body });
    },

    /* ---- assertions --------------------------------------------------- */

    async expectCalled(opId: string, opts: ExpectCalledOptions = {}) {
      const matcher = opts.withBodyMatching;
      const matches = state.callLog.filter((entry) => {
        if (entry.opId !== opId) return false;
        if (matcher == null) return true;
        return matcher(entry.body);
      });
      if (opts.atLeast != null && opts.times != null) {
        throw new Error(
          "expectCalled: 'times' and 'atLeast' are mutually exclusive — pick one",
        );
      }
      if (opts.atLeast != null) {
        const min = opts.atLeast;
        expect(
          matches.length,
          `expected ${opId} to have been called at least ${min} time(s) ` +
            (matcher ? 'with matching body ' : '') +
            `but observed ${matches.length}`,
        ).toBeGreaterThanOrEqual(min);
        return;
      }
      const expectedTimes = opts.times ?? 1;
      expect(
        matches.length,
        `expected ${opId} to have been called ${expectedTimes} time(s) ` +
          (matcher ? 'with matching body ' : '') +
          `but observed ${matches.length}`,
      ).toBe(expectedTimes);
    },

    /* ---- catalog overrides ------------------------------------------- */

    setCapabilities(caps: Partial<Capabilities>) {
      state.capabilities = {
        ...state.capabilities,
        ...caps,
      } as Capabilities;
    },

    setModelCatalog(catalog: ModelCatalogResponse) {
      state.modelCatalog = catalog;
    },

    /* ---- schema-contract validation ---------------------------------- */

    validateResponse(opId: string, status: number, body: unknown) {
      // Proxy straight through to the mock's ajv-driven validator. Throws
      // `MockContractViolation` on a body-vs-schema mismatch; returns
      // void on a pass. See `BackendFixture.validateResponse` for the
      // rationale on why this lives on the fixture surface.
      mock.validateResponse(opId, status, body);
    },
  };
}

/* ---------------------------------------------------------------------------
 * Playwright fixture
 * ------------------------------------------------------------------------- */

/**
 * Fixtures contributed by this module. The `backend` fixture is test-scoped
 * (fresh per test) and depends on Playwright's built-in `page` fixture so it
 * can install `page.route(...)` interceptors.
 */
export interface MockFixtures {
  backend: BackendFixture;
}

/**
 * Playwright `test` extended with the `backend` fixture in mock mode. Specs
 * import this via `backend.ts`, which picks between the mock and real
 * adapters based on `PLAYWRIGHT_PROFILE`.
 */
export const test = base.extend<MockFixtures>({
  backend: async ({ page }, use) => {
    const mock = createMockBackend(openapiSpec);

    await page.route('**/api/**', async (route) => {
      const req: Request = route.request();
      const url = new URL(req.url());

      const match = mock.match(req.method(), url.pathname);
      if (!match) {
        await route.fulfill({
          status: 404,
          contentType: 'text/plain',
          body: `[mock] no route registered for ${req.method()} ${url.pathname}`,
        });
        return;
      }

      // Playwright surfaces the post body as a string; parse it as JSON
      // when present. We do not attempt to handle multipart or form bodies
      // — none of the operations consumed by the SPA use them today.
      let body: unknown = undefined;
      const raw = req.postData();
      if (raw != null && raw.length > 0) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }

      // The factory typed its `ctx` arg as `Omit<MockRouteContext, …>` but
      // the implementation reads `body` off the same object via an
      // internal cast (see `MockBackend.handle` in
      // `components/promptlm-api-client/src/mock/factory.ts`). Mirror
      // that pattern here so the body flows through to the handler.
      const ctxWithBody = {
        pathParams: match.pathParams,
        query: Object.fromEntries(url.searchParams),
        headers: req.headers(),
        body,
      } as Parameters<typeof mock.handle>[1];

      const response = await mock.handle(match, ctxWithBody);

      // Schema-contract validation MUST run before route.fulfill — a
      // misbehaving mock handler should fail the test loudly via
      // `MockContractViolation`, not silently leak an off-spec body to
      // the SPA. See design § 3 ("Schema validation: in route handler,
      // before route.fulfill").
      mock.validateResponse(match.opId, response.status, response.body);

      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        headers: response.headers,
        body: response.body == null ? '' : JSON.stringify(response.body),
      });
    });

    await use(buildMockBackendFixture(mock));
  },
});

export { expect };
