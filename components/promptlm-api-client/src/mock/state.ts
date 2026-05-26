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
 * In-memory state model that backs the OpenAPI-driven mock backend.
 *
 * The state owns the *behaviour* — wire-format types live in
 * `@promptlm/api-client` (re-exported from `../generated/client/models`).
 *
 * Tests interact with state through the `BackendFixture` surface in
 * `acceptance-tests/tests/fixtures/backend.ts` (introduced by issue #251).
 * This module only knows how to mutate itself and how to compute responses
 * for the operations listed in
 * `scripts/generate-mock.mjs` → `STATE_DRIVEN_HANDLERS`.
 */

import type { Capabilities } from '../generated/client/models/Capabilities';
import type { ChatCompletionResponse } from '../generated/client/models/ChatCompletionResponse';
import type { Execution } from '../generated/client/models/Execution';
import type { ModelCatalogResponse } from '../generated/client/models/ModelCatalogResponse';
import type { ProjectSpec } from '../generated/client/models/ProjectSpec';
import type { PromptSpec } from '../generated/client/models/PromptSpec';
import type { PromptSpecCreationRequest } from '../generated/client/models/PromptSpecCreationRequest';
import type { PromptStats } from '../generated/client/models/PromptStats';
import type { RepoHistoryPage } from '../generated/client/models/RepoHistoryPage';
import type { RepositoryOwner } from '../generated/client/models/RepositoryOwner';
import type { Revision } from '../generated/client/models/Revision';

import { buildSeedCapabilities, buildSeedModelCatalog, buildSeedOwners } from './defaults';
import { defaultLlmCanned } from './llm';
import type { MockResponse, MockHandler } from './handler-types';

type HandlerArgs<TReq = unknown> = Parameters<MockHandler<TReq, unknown>>[0];

/**
 * Loose lookup helper that lets handler methods read fields off the
 * `unknown` request body without forcing each call site to cast. We bridge
 * between the two flavours of generated types — the openapi-typescript
 * `operations[id]` shape (used in `handlers.ts`) and the
 * openapi-typescript-codegen model shape (used here) — through `unknown`
 * because the two type systems do not align on namespace-scoped enums or
 * `oneOf` discriminators.
 */
function field<T>(body: unknown, key: string): T | undefined {
  if (body == null || typeof body !== 'object') return undefined;
  const value = (body as Record<string, unknown>)[key];
  return value as T | undefined;
}

/**
 * A pre-programmed failure to apply to the *next* invocation of an
 * operation. Pushed via the `BackendFixture.failNext` test API; consumed
 * (popped) by the matching handler.
 */
export interface FailureInjection {
  readonly opId: string;
  readonly status: number;
  readonly body?: unknown;
}

/**
 * Single call-log entry. Recorded for every routed request regardless of
 * outcome (failure, success, validation error) so `expectCalled(...)` can
 * make assertions in either mode.
 */
export interface CallLogEntry {
  readonly opId: string;
  readonly method: string;
  readonly url: string;
  readonly body?: unknown;
}

/**
 * Construct the fresh empty state every test starts with. Pre-populates the
 * three catalog-style endpoints (capabilities / model catalog / repository
 * owners) with the hand-curated seeds in `defaults.ts` so unseeded tests
 * still get a plausible response.
 */
export function createInitialState(): MockBackendState {
  return new MockBackendState();
}

/**
 * Mutable in-memory store for one test run. Each field maps onto one or more
 * operations in the OpenAPI spec; `handle<Kind>` methods are invoked by the
 * generated `defaultHandlers` to produce a `MockResponse`.
 *
 * Invariant: every operation listed under `STATE_DRIVEN_HANDLERS` in the
 * generator has a corresponding `handle<Kind>` method here. The
 * generator-side test asserts every operationId is wired into
 * `defaultHandlers`; the TypeScript compiler enforces the rest by typing
 * each handler against `operations['<opId>']` from `@promptlm/api-client`.
 */
export class MockBackendState {
  projects: ProjectSpec[] = [];
  prompts: PromptSpec[] = [];
  revisions: Map<string, Revision[]> = new Map();
  history: Map<string, Execution[]> = new Map();
  activeProjectId: string | undefined = undefined;

  capabilities: Capabilities = buildSeedCapabilities();
  modelCatalog: ModelCatalogResponse = buildSeedModelCatalog();
  owners: RepositoryOwner[] = buildSeedOwners();

  llmCanned: ChatCompletionResponse = defaultLlmCanned();
  failNextQueue: FailureInjection[] = [];
  callLog: CallLogEntry[] = [];

  // --- core mutators -------------------------------------------------------

  /** Returns the active project — or `undefined` if no project is active. */
  activeProject(): ProjectSpec | undefined {
    if (this.activeProjectId == null) return undefined;
    return this.projects.find((p) => p.id === this.activeProjectId);
  }

  /**
   * Idempotently inserts or replaces a `PromptSpec` keyed by `id`. The id
   * convention is `${group}/${name}` (see open question #1 — the SPA's hooks
   * derive ids the same way).
   */
  upsertPrompt(spec: PromptSpec): void {
    const idx = this.prompts.findIndex((p) => p.id === spec.id);
    if (idx >= 0) this.prompts.splice(idx, 1, spec);
    else this.prompts.push(spec);
  }

  /**
   * Realises a `PromptSpec` from a create / update request payload.
   * Generates the canonical `${group}/${name}` id when the request omits
   * it. The argument is typed as `unknown` because the openapi-typescript
   * and openapi-typescript-codegen flavours of `PromptSpecCreationRequest`
   * are nominally distinct types — the spec-side caller hands us the
   * former; we read the fields we care about by name.
   *
   * The `request` field is preserved verbatim (including its `type`
   * discriminator and any kind-specific fields) so a downstream
   * `getPromptById` round-trip retains the polymorphic payload — required
   * by issue #255 (B3) which proves the wire format preserves
   * `chat/completion` / `images/generations` / `audio/speech` across
   * save → read. `messages` is copied through for the same reason.
   */
  materialisePromptFromCreationRequest(req: unknown): PromptSpec {
    const group = field<string>(req, 'group') ?? '';
    const name = field<string>(req, 'name') ?? '';
    const reqId = field<string>(req, 'id');
    const id = reqId && reqId.length > 0 ? reqId : `${group}/${name}`;
    const requestPayload = field<PromptSpec['request']>(req, 'request');
    const messagesField = field<unknown>(req, 'messages');
    // The SPA mirrors `messages` both onto `request.messages` (per
    // `ChatCompletionRequest`) and as a top-level convenience field. The
    // generated `PromptSpec` type only carries them nested under
    // `request`, so fold the top-level array into the request if the
    // request omitted them.
    let finalRequest: PromptSpec['request'] | undefined = requestPayload;
    if (
      finalRequest != null &&
      Array.isArray(messagesField) &&
      (finalRequest as { messages?: unknown }).messages == null
    ) {
      finalRequest = {
        ...(finalRequest as object),
        messages: messagesField,
      } as PromptSpec['request'];
    }
    return {
      id,
      name,
      group,
      description: field<string>(req, 'description'),
      version: field<string>(req, 'version'),
      repositoryUrl: field<string>(req, 'repositoryUrl'),
      request: finalRequest,
    };
  }

  appendExecution(promptId: string, exec: Execution): void {
    const existing = this.history.get(promptId);
    if (existing) existing.push(exec);
    else this.history.set(promptId, [exec]);
  }

  /** Resets every mutable field to its initial value. */
  reset(): void {
    this.projects = [];
    this.prompts = [];
    this.revisions = new Map();
    this.history = new Map();
    this.activeProjectId = undefined;
    this.capabilities = buildSeedCapabilities();
    this.modelCatalog = buildSeedModelCatalog();
    this.owners = buildSeedOwners();
    this.llmCanned = defaultLlmCanned();
    this.failNextQueue = [];
    this.callLog = [];
  }

  // --- handler dispatch helpers -------------------------------------------

  /** Pops the next failure scheduled for `opId`, if any. */
  consumeFailure(opId: string): FailureInjection | undefined {
    const idx = this.failNextQueue.findIndex((f) => f.opId === opId);
    if (idx < 0) return undefined;
    const [hit] = this.failNextQueue.splice(idx, 1);
    return hit;
  }

  recordCall(entry: CallLogEntry): void {
    this.callLog.push(entry);
  }

  // --- per-operation handlers ---------------------------------------------
  //
  // Each handle* method is invoked by the matching generated default handler
  // in `src/generated/mock/handlers.ts`. The dispatch arg comes from the
  // route handler and carries the parsed request body + path/query params.

  handleActiveProject404(_args: HandlerArgs): MockResponse<unknown> {
    const active = this.activeProject();
    if (active == null) {
      // Open question #3 — mock returns `404` with no body; ajv skips body
      // validation when there is none.
      return { status: 404, body: undefined as unknown };
    }
    return { status: 200, body: active };
  }

  handleCloneStore(args: HandlerArgs): MockResponse<string> {
    const remote = field<string>(args.body, 'remoteUrl') ?? '<unknown>';
    const reqName = field<string>(args.body, 'name');
    const id = `cloned-${this.projects.length + 1}-${reqName ?? 'project'}`;
    const project: ProjectSpec = {
      id,
      name: reqName ?? id,
      repositoryUrl: field<string>(args.body, 'remoteUrl'),
      localPath: field<string>(args.body, 'targetDir'),
    };
    this.projects.push(project);
    if (this.activeProjectId == null) this.activeProjectId = id;
    return { status: 200, body: `Cloned ${remote}` };
  }

  handleCreateStore(args: HandlerArgs): MockResponse<ProjectSpec> {
    const repoName = field<string>(args.body, 'repoName');
    const id = `created-${this.projects.length + 1}-${repoName ?? 'project'}`;
    const project: ProjectSpec = {
      id,
      name: repoName ?? id,
      localPath: field<string>(args.body, 'repoDir'),
      description: field<string>(args.body, 'description'),
    };
    this.projects.push(project);
    if (this.activeProjectId == null) this.activeProjectId = id;
    return { status: 200, body: project };
  }

  /**
   * Open question #4 — the spec declares `200` with **no body** for
   * `switchProject` (the server returns `ResponseEntity<Void>`). Activating
   * the project is still observable via the `getActiveProject` follow-up
   * call. The handler returns `body: undefined` so the route fulfilment
   * writes an empty body.
   */
  handleSwitchProject(args: HandlerArgs): MockResponse<unknown> {
    const projectId = args.ctx.pathParams.projectId;
    if (projectId != null) this.activeProjectId = projectId;
    return { status: 200, body: undefined };
  }

  handleConnectRepository(args: HandlerArgs): MockResponse<ProjectSpec> {
    const displayName = field<string>(args.body, 'displayName');
    const id = `connected-${this.projects.length + 1}-${displayName ?? 'repo'}`;
    const project: ProjectSpec = {
      id,
      name: displayName ?? id,
      localPath: field<string>(args.body, 'repoPath'),
    };
    this.projects.push(project);
    if (this.activeProjectId == null) this.activeProjectId = id;
    return { status: 200, body: project };
  }

  handleListOwners(_args: HandlerArgs): MockResponse<RepositoryOwner[]> {
    return { status: 200, body: this.owners.slice() };
  }

  handleAllProjects(_args: HandlerArgs): MockResponse<ProjectSpec[]> {
    return { status: 200, body: this.projects.slice() };
  }

  handlePromptById(args: HandlerArgs): MockResponse<unknown> {
    const id = args.ctx.pathParams.promptSpecId;
    const found = id != null ? this.prompts.find((p) => p.id === id) : undefined;
    if (!found) return { status: 404, body: undefined as unknown };
    return { status: 200, body: found };
  }

  handleUpdatePromptSpec(
    args: HandlerArgs,
  ): MockResponse<unknown> {
    const id = args.ctx.pathParams.promptSpecId;
    const existing = id != null ? this.prompts.find((p) => p.id === id) : undefined;
    if (!existing) return { status: 404, body: undefined as unknown };
    const next = this.materialisePromptFromCreationRequest(args.body);
    next.id = existing.id;
    this.upsertPrompt(next);
    return { status: 200, body: next };
  }

  handleRetirePrompt(args: HandlerArgs): MockResponse<unknown> {
    const id = args.ctx.pathParams.promptSpecId;
    const existing = id != null ? this.prompts.find((p) => p.id === id) : undefined;
    if (!existing) return { status: 404, body: undefined as unknown };
    // PromptSpec.status is a namespace-scoped enum (RETIRED/ACTIVE) — cast
    // through `unknown` rather than depending on the codegen namespace
    // import, which would force this module to be type-only and break the
    // pattern with the rest of the file.
    existing.status = 'RETIRED' as unknown as PromptSpec['status'];
    existing.retiredAt = new Date(0).toISOString();
    existing.retiredReason = args.ctx.query.reason;
    return { status: 200, body: existing };
  }

  handleListPromptSpecs(_args: HandlerArgs): MockResponse<PromptSpec[]> {
    return { status: 200, body: this.prompts.slice() };
  }

  handleCreatePromptSpec(
    args: HandlerArgs,
  ): MockResponse<PromptSpec> {
    const spec = this.materialisePromptFromCreationRequest(args.body);
    this.upsertPrompt(spec);
    return { status: 200, body: spec };
  }

  /**
   * `releasePrompt` gates on a pre-release execution against `state.llmCanned`.
   * Open question #5 — sets the `X-PromptLM-Release-State` header even though
   * the SPA does not currently read it.
   */
  handleReleasePrompt(args: HandlerArgs): MockResponse<unknown> {
    const id = args.ctx.pathParams.promptSpecId;
    const existing = id != null ? this.prompts.find((p) => p.id === id) : undefined;
    if (!existing) return { status: 404, body: undefined as unknown };
    return {
      status: 200,
      body: existing,
      headers: { 'X-PromptLM-Release-State': 'released' },
    };
  }

  handleCompleteReleasePrompt(args: HandlerArgs): MockResponse<unknown> {
    const id = args.ctx.pathParams.promptSpecId;
    const existing = id != null ? this.prompts.find((p) => p.id === id) : undefined;
    if (!existing) return { status: 404, body: undefined as unknown };
    return {
      status: 200,
      body: existing,
      headers: { 'X-PromptLM-Release-State': 'completed' },
    };
  }

  /**
   * Wire shape: 200 returns the updated `PromptSpec` with the new execution
   * appended. The captured `response` field on the spec carries the
   * canned LLM payload (`state.llmCanned`).
   */
  handleExecuteStoredPrompt(
    args: HandlerArgs,
  ): MockResponse<PromptSpec> {
    const id = args.ctx.pathParams.promptSpecId;
    const existing = id != null ? this.prompts.find((p) => p.id === id) : undefined;
    if (!existing) return { status: 404, body: undefined as unknown as PromptSpec };
    // `kind: 'MANUAL'` mirrors the real backend: `executeStoredPrompt`
    // persists an Execution stamped with `ExecutionKind.MANUAL` (see
    // `PromptSpecController.executeStoredPrompt`). B5 (issue #257)
    // depends on this so the editor-run spec can assert the wire-level
    // kind, replacing the Java HappyPath@Order(25) Execution assertion.
    const exec: Execution = {
      id: `exec-${this.history.size + 1}`,
      timestamp: new Date(0).toISOString(),
      response: this.llmCanned,
      ok: true,
      kind: 'MANUAL' as Execution['kind'],
    };
    this.appendExecution(existing.id, exec);
    const next: PromptSpec = {
      ...existing,
      response: this.llmCanned,
      executions: [...(existing.executions ?? []), exec],
    };
    this.upsertPrompt(next);
    return { status: 200, body: next };
  }

  /**
   * Wire shape: 200 returns a synthesised `PromptSpec` whose `response`
   * field is `state.llmCanned`. The endpoint accepts an ad-hoc spec in the
   * request body, so we return what the server would have built rather
   * than the raw LLM response.
   */
  handleExecutePrompt(args: HandlerArgs): MockResponse<PromptSpec> {
    // The endpoint accepts an ad-hoc spec — read its identifying fields
    // off the body via the loose `field` helper (the body's static type is
    // openapi-typescript's `ExecutePromptRequest`, which is nominally
    // distinct from the codegen `PromptSpec`).
    const promptSpecLike = field<unknown>(args.body, 'promptSpec') ?? args.body;
    const synthesised: PromptSpec = {
      id: field<string>(promptSpecLike, 'id') ?? 'mock/execute',
      name: field<string>(promptSpecLike, 'name') ?? 'execute',
      group: field<string>(promptSpecLike, 'group') ?? 'mock',
      response: this.llmCanned,
    };
    return { status: 200, body: synthesised };
  }

  handleRepoHistory(args: HandlerArgs): MockResponse<RepoHistoryPage> {
    const id = args.ctx.pathParams.promptSpecId;
    const items = id != null ? (this.history.get(id) ?? []) : [];
    const page: RepoHistoryPage = {
      items,
      page: Number(args.ctx.query.page ?? 0),
      pageSize: Number(args.ctx.query.pageSize ?? 20),
      total: items.length,
    };
    return { status: 200, body: page };
  }

  handleRevisionsByGroupAndName(args: HandlerArgs): MockResponse<Revision[]> {
    const group = args.ctx.pathParams.group;
    const name = args.ctx.pathParams.name;
    const key = `${group}/${name}`;
    return { status: 200, body: this.revisions.get(key)?.slice() ?? [] };
  }

  /**
   * Wire shape: 200 returns a starter `PromptSpec` the SPA can clone into a
   * fresh draft. The contents are static seeds — tests overriding the
   * template behaviour can replace this method via subclassing or seed
   * `state.defaultTemplate` if future #251 work adds the override hook.
   */
  handleDefaultTemplate(_args: HandlerArgs): MockResponse<PromptSpec> {
    const tmpl: PromptSpec = {
      id: 'support/support_welcome',
      name: 'support_welcome',
      group: 'support',
      description: '',
      placeholders: { startPattern: '{{', endPattern: '}}' },
    };
    return { status: 200, body: tmpl };
  }

  handlePromptStats(_args: HandlerArgs): MockResponse<PromptStats> {
    const stats: PromptStats = {
      totalPrompts: this.prompts.length,
      activePrompts: this.prompts.filter((p) => String(p.status) !== 'RETIRED').length,
      retiredPrompts: this.prompts.filter((p) => String(p.status) === 'RETIRED').length,
      countByGroup: {},
      activeProjects: this.projects.length,
      lastUpdated: new Date(0).toISOString(),
    };
    return { status: 200, body: stats };
  }

  /**
   * Open question #8 — the spec declares `responses['200'].content['application/json'].schema`
   * as `{ type: 'string' }` (singular), but the actual wire shape from the
   * server is `string[]`. The mock matches the *wire* shape and casts
   * through `unknown` so the generated handler's declared (and currently
   * wrong) `MockResponse<string>` type lines up. A follow-up issue should
   * fix the schema to `{ type: 'array', items: { type: 'string' } }`.
   */
  handlePromptGroups(_args: HandlerArgs): MockResponse<string> {
    const groups = Array.from(new Set(this.prompts.map((p) => p.group).filter(Boolean)));
    return { status: 200, body: groups as unknown as string };
  }

  handleModelCatalog(_args: HandlerArgs): MockResponse<ModelCatalogResponse> {
    return { status: 200, body: this.modelCatalog };
  }

  handleCapabilities(_args: HandlerArgs): MockResponse<Capabilities> {
    return { status: 200, body: this.capabilities };
  }
}
