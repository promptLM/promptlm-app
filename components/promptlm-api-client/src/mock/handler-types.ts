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
 * Wire types shared between the generator output (`src/generated/mock/`) and
 * the hand-written runtime (`src/mock/`). Kept separate from `state.ts` so
 * the generator never has to import the runtime — that keeps `tsc` happy in
 * the bootstrap case (mock generator runs before runtime files compile).
 */

import type { MockBackendState } from './state';

/**
 * Per-request information exposed to handlers. `body` is parsed JSON or
 * `undefined` if the route carried no body. `query` is the flattened
 * `URLSearchParams` (later values for repeated keys win — Playwright
 * `route.request()` exposes them the same way).
 */
export interface MockRouteContext {
  readonly opId: string;
  readonly method: string;
  readonly url: string;
  readonly pathParams: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
}

/**
 * Discriminated response shape emitted by a `MockHandler`. `headers` is
 * optional and merged on top of the default `Content-Type: application/json`
 * the route handler always sets.
 */
export interface MockResponse<TBody> {
  readonly status: number;
  readonly body: TBody;
  readonly headers?: Readonly<Record<string, string>>;
}

/**
 * Mock handler signature. `Req` is the parsed request body type (or
 * `undefined` for body-less operations) and `Res` is the success-status
 * response body type — both resolved from `operations['<opId>']` in
 * `@promptlm/api-client`.
 *
 * Handlers may be synchronous (the common case) or return a promise. The
 * runtime awaits whatever they return, so either is fine.
 */
export type MockHandler<Req, Res> = (args: {
  readonly ctx: MockRouteContext;
  readonly body: Req;
  readonly state: MockBackendState;
}) => MockResponse<Res> | Promise<MockResponse<Res>>;
