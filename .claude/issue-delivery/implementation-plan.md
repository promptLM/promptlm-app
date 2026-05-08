# Implementation plan — issue #76

## Objective

Expose `GET /api/prompts/{id}/revisions` so the new UI can render a per-prompt
revision-history table and (later) a spec-level diff. Each revision exposes git
metadata plus the `PromptSpec` snapshot at that revision. Regenerate the
`@promptlm/api-client` and add a flag-gated webui hook.

## Issues in scope

- #76 only.

## Product assumptions (auto-mode defaults; see decision-log D-002…D-007)

- Multi-project routing not required for v1 — the active project's repo is the source of truth, mirroring `resolveActiveProjectLastUpdatedFromGitMetadata()`.
- Historical YAML that fails to deserialize → emit a revision with `spec: null` and a logged warning. `Revision.spec` is `nullable: true`.
- `kind` is derived from JGit `DiffFormatter` with rename detection.
- `tag` is null in v1 (release flow does not yet tag commits). Tag resolution is implemented anyway.
- Path-traversal: rely on the existing `GitFileNameStrategy` segment validation (`[a-z0-9._-]+`, rejects `/`, `\`, `..`). Invalid → `400`.
- The controller exposes both `/api/prompts/{promptSpecId}/revisions` (id = `group/name`) and `/api/prompts/{group}/{name}/revisions`, mirroring the `release` endpoint pair.
- v1 webui ships `revisionHistory: false`. Hook is added but rendering is deferred to issue #78.

## Acceptance criteria

- [ ] AC-1: `GET /api/prompts/{id}/revisions` returns `200` with newest-first list when prompt has commits.
- [ ] AC-2: Each revision exposes `rev`, `tag` (nullable), `sha`, `author`, `when` (ISO8601), `msg`, `kind`, `spec` (nullable).
- [ ] AC-3: `kind` ∈ `{add, edit, remove, rename}` and reflects the diff to parent.
- [ ] AC-4: `404` when prompt id has no commits.
- [ ] AC-5: `400` when id contains invalid segments.
- [ ] AC-6: OpenAPI spec lists `Revision`; `@promptlm/api-client` regenerates with `getRevisions()`.
- [ ] AC-7: `usePromptRevisions(id)` hook in `@/api/hooks.ts`, gated on `featureFlags.revisionHistory`.

## Demo scenarios

1. Seeded JGit repo with three commits (ADD → MODIFY → MODIFY) on `prompts/support/welcome/promptlm.yml`. Curl `/api/prompts/support/welcome/revisions` and show three revisions newest-first with deserialized snapshots.
2. Curl with `..` segment and observe `400`.
3. Curl with unknown id and observe `404`.
4. Boot webui with `VITE_FEATURE_HISTORY=true`, observe the `/revisions` request firing on the prompt detail page.

## Architecture approach

- **`Revision` record** (new, `dev.promptlm.store.api`) — `record Revision(String rev, String tag, String sha, String author, Instant when, String msg, Kind kind, PromptSpec spec)` with `enum Kind { ADD, EDIT, REMOVE, RENAME }`. Serialized lowercase. `@Schema` annotations for springdoc.
- **`PromptStore.listRevisions(group, name)`** — `default` returning `List.of()`.
- **`GitHubPromptStore.listRevisions(group, name)`** — JGit override:
  1. Validate via `fileNameStrategy.buildPromptPath(group, name)` (throws on bad input).
  2. Bail to `List.of()` if no active repo.
  3. `git.log().addPath(promptPath).all()` — every commit touching the file.
  4. Build `commitSha → tag` map once via `tagList()`, semver-shaped only.
  5. For each commit: `DiffFormatter.scan(parent, commit)` filtered to the prompt path, rename detection on. ADD/MODIFY/DELETE/RENAME → `Kind`. Initial commit → ADD if file present.
  6. Read blob via `TreeWalk` + `ObjectReader`; deserialize through `modelYamlMapper`. Soft-fail to `spec=null` on parse error with a `WARN` log.
  7. `rev = "r" + (totalCommits - index)`; newest first.
- **Controller** — both `@GetMapping("/{promptSpecId}/revisions")` (split on `/`) and `@GetMapping("/{group}/{name}/revisions")` matching the existing `release` endpoint pair. `IllegalArgumentException` → `400`. Empty list → `404`.

## Workstreams

| # | Workstream | Mapped to AC | Owner | Notes |
|---|---|---|---|---|
| 1 | `Revision` record + interface default | AC-2 | architect→xp-driver | New types only |
| 2 | JGit-backed `listRevisions` override | AC-1, AC-3 | xp-driver | Reuses pattern from `resolveActiveProjectLastUpdatedFromGitMetadata` |
| 3 | Controller endpoints + validation | AC-1, AC-4, AC-5 | xp-driver | Mirrors `release`/`releaseByGroupAndName` |
| 4 | WebMvcTest | AC-1, AC-4, AC-5 | test-engineer | Mock `PromptStore`; happy/400/404 |
| 5 | JGit-backed integration test | AC-1, AC-2, AC-3 | test-engineer | Real local repo with seeded commits |
| 6 | Regenerate `@promptlm/api-client` | AC-6 | xp-driver | `mvn package` → `npm run generate` |
| 7 | `usePromptRevisions` hook + Vitest | AC-7 | xp-driver+test-engineer | Pattern follows `usePromptDetails` |
| 8 | Security review | — | security-analyst | Read-only |

## XP pair-engineering plan

- Driver: orchestrator (this conversation) operating in xp-driver mode for slices 1–3.
- Navigator: code-reviewer subagent at the end of each slice (or batched after slice 3 since the slices are tightly coupled).
- Slice cadence: backend (slices 1–5 of the matrix above) → regenerate client (slice 6) → webui hook (slice 7) → review pass.

## Parallelization plan

Sequential. The webui hook depends on the regenerated client which depends on the backend endpoint. Read-only review work at the end can run alongside writing the demo doc.

## Files likely to change

New:

- `components/promptlm-store/promptlm-store-api/src/main/java/dev/promptlm/store/api/Revision.java`
- `components/promptlm-store/promptlm-store-github/src/test/java/dev/promptlm/store/github/GitHubPromptStoreRevisionsTest.java`
- `components/promptlm-web-ui/src/api/__tests__/usePromptRevisions.test.tsx`

Modified:

- `components/promptlm-store/promptlm-store-api/src/main/java/dev/promptlm/store/api/PromptStore.java`
- `components/promptlm-store/promptlm-store-github/src/main/java/dev/promptlm/store/github/GitHubPromptStore.java`
- `components/promptlm-web-api/src/main/java/dev/promptlm/web/PromptSpecController.java`
- `components/promptlm-web-api/src/test/java/dev/promptlm/web/PromptSpecControllerWebMvcTest.java`
- `components/promptlm-web-ui/src/api/hooks.ts`
- Regenerated outputs under `components/promptlm-api-client/src/generated/...`

## Verification matrix

| Acceptance criterion | Test type | Test / file | Command |
|---|---|---|---|
| AC-1, AC-4, AC-5 | controller | `PromptSpecControllerWebMvcTest` | `mvn -pl components/promptlm-web-api test -Dtest=PromptSpecControllerWebMvcTest` |
| AC-1, AC-2, AC-3 | integration | `GitHubPromptStoreRevisionsTest` | `mvn -pl components/promptlm-store/promptlm-store-github test -Dtest=GitHubPromptStoreRevisionsTest` |
| AC-6 | regen | manual + diff | `mvn -pl apps/promptlm-webapp -DskipTests=true package`; `cd components/promptlm-api-client && npm run generate && npm run build` |
| AC-7 | unit | `usePromptRevisions.test.tsx` | `cd components/promptlm-web-ui && bun test src/api/__tests__/usePromptRevisions.test.tsx` |
| Cross | full build | — | `./build-full.sh` (may be skipped per local-build feedback note) |

## Threat-model summary

- **Assets**: YAML blobs at past commits in the active project repo.
- **Trust boundaries**: `/api/prompts/**` is unauthenticated today (no Spring Security on classpath). The new endpoint inherits this posture; not changed by this issue.
- **Attackers / abuse cases**:
  - Path traversal via `{id}` segments — mitigated by `GitFileNameStrategy` (rejects `/`, `\`, `..`, non-`[a-z0-9._-]`).
  - YAML deserialization gadget — `modelYamlMapper` has no default typing; soft-fail just skips. No eval / no class loading.
  - Resource exhaustion via long histories — acknowledged; v1 ships flag off, follow-up: caching / ETag / pagination.
- **Sensitive data flows**: snapshot blobs may contain prompt content (sometimes proprietary). Same exposure as the existing `GET /{id}` (which returns the latest spec). No new data class introduced.

## Pen-test scope

Threat-model review only (read-only, no authorization gate needed). No adversarial testing required because the endpoint is read-only with deterministic, reused validation. If the user wants pen-testing, request explicit authorization per procedure step 11.

## Rollback plan

Additive change. Revert the commit; no migrations, no schema breakage, no removed behavior.

## Open risks

1. Historical YAML parse failures — soft-fail by design.
2. Full git log per request — fine for v1 (flag off); follow-up for caching/pagination.
3. Future store backends silently return `List.of()` from the default until they override.
4. `r{n}` is derived from list length and shifts on amend/rebase; `sha` is the stable identifier.

## Proposed GitHub-issue update (for step 13 confirmation)

> **Implementation summary**
>
> Added `GET /api/prompts/{id}/revisions` (and `/{group}/{name}/revisions`) returning a newest-first list of `Revision { rev, tag, sha, author, when, msg, kind, spec }`, backed by JGit log + diff against the prompt's `promptlm.yml` path. Historical YAML that fails to deserialize emits `spec: null` with a logged warning. Path validation reuses `GitFileNameStrategy`.
>
> `@promptlm/api-client` regenerated. Webui adds a flag-gated `usePromptRevisions(id)` hook; `revisionHistory` defaults to `false`.
>
> Verification: WebMvcTest (200/400/404), JGit-backed integration test covering all four `kind` values, Vitest covering the hook's enabled/disabled paths.
>
> Out of scope (deferred): rendering the revision table on the detail page (#78), caching/pagination, adding authn to `/api/prompts/**`.
