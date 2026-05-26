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
 * Public entrypoint for the OpenAPI-driven mock backend. Combines the
 * generated handler table, the generated operation index, the hand-written
 * state model and the ajv schema validator into a small bundle that is
 * trivial to wire into Playwright's `page.route('**\/api/**', ...)` in
 * issue #251.
 *
 * The factory is intentionally framework-agnostic — it does not import
 * Playwright. Adapters live in `acceptance-tests/tests/fixtures/`.
 */

import { defaultHandlers } from '../generated/mock/handlers';
import {
  operationIndex,
  type OperationDescriptor,
} from '../generated/mock/operation-index';
import type { MockHandler, MockResponse, MockRouteContext } from './handler-types';
import { MockBackendState } from './state';
import { createSchemaValidator, type SchemaValidator } from './schema-validate';

/**
 * A `(method, pathname)` lookup result. `pathParams` are the named groups
 * captured by the operation's path-matcher regex.
 */
export interface RouteMatch {
  readonly opId: string;
  readonly descriptor: OperationDescriptor;
  readonly pathParams: Readonly<Record<string, string>>;
}

/**
 * Bundle returned by `createMockBackend()`. The runtime in
 * `acceptance-tests/tests/fixtures/backend.mock.ts` (introduced by #251)
 * uses these methods to drive Playwright; tests interact with the
 * `BackendFixture` interface only, never with this object directly.
 */
export interface MockBackend {
  readonly state: MockBackendState;
  readonly handlers: typeof defaultHandlers;
  readonly validator: SchemaValidator;

  /** Returns the operation matching `(method, pathname)` or `undefined`. */
  match(method: string, pathname: string): RouteMatch | undefined;

  /**
   * Executes the matched operation's default handler against the parsed
   * request `ctx` and returns the resulting response. Records a call-log
   * entry and consumes any pre-programmed failure (`state.failNextQueue`)
   * before invoking the handler.
   *
   * Schema validation is *not* applied here — the runtime can choose to
   * validate the response or skip it, depending on whether the test wants
   * to deliberately seed an off-spec body (e.g. for error-handling specs).
   * The companion `validateResponse` helper does that step explicitly.
   */
  handle(match: RouteMatch, ctx: Omit<MockRouteContext, 'opId' | 'method' | 'url'>, opts?: {
    method?: string;
    url?: string;
  }): Promise<MockResponse<unknown>>;

  /** Validate a response body against the OpenAPI schema for `(opId, status)`. */
  validateResponse(opId: string, status: number, body: unknown): void;
}

/**
 * Construct a fresh mock backend. The OpenAPI spec is supplied at call time
 * — typical callers load it as a JSON import in their test bootstrap and
 * pass the parsed value here. Keeping the spec out of the factory body lets
 * Node-side tests run without a filesystem read, and lets Playwright
 * worker-fixtures load the spec exactly once across tests.
 */
export function createMockBackend(spec: unknown): MockBackend {
  const state = new MockBackendState();
  const validator = createSchemaValidator(spec);

  // Pre-compile path-matcher regexes once. Constructing `RegExp` is
  // negligible per request but matters at scale (every Playwright route
  // hits this code path).
<<<<<<< HEAD
  //
  // Sort routes by specificity so a literal path always wins over a
  // sibling parameterised template — e.g. `GET /api/prompts/template`
  // must match `getDefaultTemplate` rather than `getById` with
  // `promptSpecId="template"`. Without this, the alphabetical operation
  // index in `operation-index.ts` (generator output) makes `getById`
  // shadow every literal `/api/prompts/*` sibling. The fewer path-param
  // groups a route has, the more specific it is — and ties break on
  // longer literal prefix length, so `/api/store/owners` wins over
  // `/api/store/switch/{projectId}`-but-with-trailing-segment cases.
  //
  // Fixed during A4 (issue #252) — `getDefaultTemplate` and
  // `getPromptGroups` were silently unreachable before this sort.
  const compiledRoutes = operationIndex
    .map((op) => ({
      descriptor: op,
      matcher: new RegExp(op.pathPattern),
      paramCount: op.pathParamNames.length,
      literalLen: op.pathTemplate.replace(/\{[^}]+\}/g, '').length,
    }))
    .sort((a, b) => {
      if (a.paramCount !== b.paramCount) return a.paramCount - b.paramCount;
      return b.literalLen - a.literalLen;
    });
=======
  const compiledRoutes = operationIndex.map((op) => ({
    descriptor: op,
    matcher: new RegExp(op.pathPattern),
  }));
>>>>>>> origin/main

  return {
    state,
    handlers: defaultHandlers,
    validator,

    match(method, pathname) {
      const upper = method.toUpperCase();
      for (const route of compiledRoutes) {
        if (route.descriptor.method !== upper) continue;
        const m = route.matcher.exec(pathname);
        if (!m) continue;
        return {
          opId: route.descriptor.opId,
          descriptor: route.descriptor,
          pathParams: { ...(m.groups ?? {}) } as Record<string, string>,
        };
      }
      return undefined;
    },

    async handle(match, partialCtx, opts) {
      const ctx: MockRouteContext = {
        opId: match.opId,
        method: opts?.method ?? match.descriptor.method,
        url: opts?.url ?? match.descriptor.pathTemplate,
        pathParams: match.pathParams,
        query: partialCtx.query,
        headers: partialCtx.headers,
      };
      state.recordCall({
        opId: match.opId,
        method: ctx.method,
        url: ctx.url,
        body: (partialCtx as { body?: unknown }).body,
      });
      const failure = state.consumeFailure(match.opId);
      if (failure) {
        return { status: failure.status, body: failure.body };
      }
      const handler = (defaultHandlers as Record<string, MockHandler<unknown, unknown>>)[
        match.opId
      ];
      if (!handler) {
        // Should be impossible — the generator test asserts every operation
        // is wired into `defaultHandlers`. Defensive in case the index and
        // handler table go out of sync via partial regeneration.
        return {
          status: 501,
          body: { error: `No default handler for operation ${match.opId}` },
        };
      }
      const body = (partialCtx as { body?: unknown }).body;
      return Promise.resolve(handler({ ctx, body, state }));
    },

    validateResponse(opId, status, body) {
      validator.validate(opId, status, body);
    },
  };
}
