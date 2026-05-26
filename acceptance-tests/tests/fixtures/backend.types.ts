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
 * Public surface of the `backend` Playwright test fixture for the promptLM
 * acceptance-test suite.
 *
 * One interface, two adapters: a mock adapter (`backend.mock.ts`, used today
 * by every spec) and a real adapter (`backend.real.ts`, a stub that throws —
 * wired up in a later issue). The interface is shaped from
 * `.claude/orchestration/design-mock-and-fixture.md` § 2.2.
 *
 * Specs interact exclusively through this interface; they never reach into
 * `createMockBackend()` or any Playwright `page.route(...)` directly. That
 * way the same spec body can run against a real Java backend once the real
 * adapter lands.
 */

import type {
  Capabilities,
  ChatCompletionResponse,
  ModelCatalogResponse,
  ProjectSpec,
  PromptSpec,
  Revision,
} from '@promptlm/api-client';

/** Which adapter the current `backend` fixture is bound to. */
export type BackendMode = 'mock' | 'real';

/**
 * Options accepted by {@link BackendFixture.expectCalled}.
 *
 * `times` defaults to 1 and asserts an *exact* count.
 * `atLeast` (added by A4 — issue #252) asserts the minimum count and is
 * mutually exclusive with `times`; useful for smoke specs that want to
 * prove a wire path is alive without pinning to a specific consumer
 * count (e.g. `getCapabilities` fires once per `App` mount plus once
 * per `PromptFormShell` mount — exact counts change with routing).
 *
 * `withBodyMatching` is an optional predicate run against each captured
 * request body. The fixture asserts that the matching call count meets
 * the `times` / `atLeast` constraint.
 */
export interface ExpectCalledOptions {
  /**
   * Exact number of matching calls expected. Defaults to `1` when neither
   * `times` nor `atLeast` is supplied. Mutually exclusive with `atLeast`.
   */
  readonly times?: number;
  /**
   * Lower bound on matching calls. Useful when the SPA's React lifecycle
   * issues a request from multiple places (e.g. an initial render plus
   * an effect rebind) and we only care that the wire shape was exercised
   * at least once. Mutually exclusive with `times`.
   */
  readonly atLeast?: number;
  readonly withBodyMatching?: (body: unknown) => boolean;
}

/**
 * The mock LLM script accepts either a partial response (merged onto the
 * canned default) or a callback that receives the incoming request and
 * returns a fresh response — handy for tests that vary content per
 * invocation. Real-mode is a no-op + annotation.
 */
export type MockLlmScript =
  | Partial<ChatCompletionResponse>
  | ((req: unknown) => ChatCompletionResponse);

/**
 * Test-scoped fixture exposed by Playwright as `backend`. Every test gets a
 * fresh instance — state never leaks across tests. In mock mode the
 * implementation lives in `backend.mock.ts`; the real adapter
 * (`backend.real.ts`) is a stub that throws and is selected only when
 * `PLAYWRIGHT_PROFILE=real`.
 */
export interface BackendFixture {
  readonly mode: BackendMode;

  /* ---- seeding ---------------------------------------------------------- */

  /**
   * Inserts (or replaces) a project record. The first seeded project
   * becomes the active project — subsequent ones must call
   * {@link BackendFixture}-level activation helpers (out of scope for
   * #251).
   */
  seedProject(
    spec: Partial<ProjectSpec> & Pick<ProjectSpec, 'id' | 'name'>,
  ): Promise<ProjectSpec>;

  /**
   * Inserts (or replaces) a prompt record. `id`, `name`, and `group` are
   * mandatory because the mock derives the canonical `${group}/${name}` id
   * from them and addresses prompts by id.
   */
  seedPrompt(
    spec: Partial<PromptSpec> & Pick<PromptSpec, 'id' | 'name' | 'group'>,
  ): Promise<PromptSpec>;

  /**
   * Appends a revision to a prompt's history.
   *
   * Real mode throws — no server endpoint exists for direct revision
   * seeding; tests that need a populated history must be tagged
   * `@mock-only`.
   */
  seedRevision(
    promptId: string,
    rev: Partial<Revision> & Pick<Revision, 'sha'>,
  ): Promise<Revision>;

  /* ---- inspection ------------------------------------------------------- */

  getPromptById(id: string): Promise<PromptSpec | undefined>;
  listPrompts(): Promise<PromptSpec[]>;
  getActiveProject(): Promise<ProjectSpec | undefined>;

  /* ---- LLM scripting ---------------------------------------------------- */

  /**
   * Override the canned LLM response. Real mode is a no-op + annotation;
   * the spec must be tagged `@mock-only` to be honoured.
   */
  mockLLM(script: MockLlmScript): void;

  /* ---- failure injection ----------------------------------------------- */

  /**
   * Pre-program the *next* invocation of `opId` to return the given
   * status / body. Real mode is a no-op + annotation.
   */
  failNext(opId: string, status: number, body?: unknown): void;

  /* ---- assertions ------------------------------------------------------- */

  /**
   * Awaits a `(opId, times, body-matcher)` condition and throws if it is
   * not met. In mock mode the assertion reads from the in-memory call log;
   * in real mode it inspects the captures recorded via Playwright's
   * `page.on('request', …)` listener.
   */
  expectCalled(opId: string, opts?: ExpectCalledOptions): Promise<void>;

  /* ---- catalog overrides ----------------------------------------------- */

  /**
   * Replace the canned `Capabilities` response. Real mode is a no-op +
   * annotation.
   */
  setCapabilities(caps: Partial<Capabilities>): void;

  /**
   * Replace the canned `ModelCatalogResponse`. Real mode is a no-op +
   * annotation.
   */
  setModelCatalog(catalog: ModelCatalogResponse): void;

  /* ---- schema-contract validation -------------------------------------- */

  /**
   * Directly invoke the mock's response-schema validator for `(opId,
   * status, body)`. Throws `MockContractViolation` (re-exported from
   * `@promptlm/api-client/mock`) when the body violates the response
   * schema declared in the OpenAPI spec; returns `void` on a pass.
   *
   * Intended primarily as the canary for
   * `tests/specs/schema-contract/skeleton.spec.ts` — production specs
   * never need to call this directly because the fixture already runs
   * the validator on every routed response before `route.fulfill`.
   *
   * Real mode throws — there is no validator wired in the real adapter
   * (the live backend is the source of truth). Specs that depend on
   * this must be tagged `@mock-only`.
   *
   * Added by A4 (issue #252) so the "deliberate violation" test case in
   * the schema-contract canary can assert the validator catches
   * off-spec bodies without depending on Playwright route-handler
   * exception plumbing.
   */
  validateResponse(opId: string, status: number, body: unknown): void;
}
