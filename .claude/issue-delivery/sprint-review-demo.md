# Sprint review / demo — issue #76

## Issues addressed

**#76 Backend: expose prompt revision history endpoint**
([https://github.com/promptLM/promptlm-app/issues/76](https://github.com/promptLM/promptlm-app/issues/76))

## User problem solved

The redesigned prompt detail page wants to render a per-prompt revision history
table and a spec-level diff view between revisions. Until now there was no
backend endpoint that exposed git history for a prompt — the OpenAPI
`PromptSpec` model had no `history` / `revisions` field, and `PromptStore`'s
`listVersions()` was stubbed. This issue closes the gap so the UI work
unblocked by it can land next.

## User-visible behavior

### Before

- `GET /api/prompts/{id}/revisions` did not exist (404 from the routing layer).
- No `Revision` schema in OpenAPI; `@promptlm/api-client` had no method for it.
- Webui had no hook; the v2 prompt-detail design's revision history table had no data source.

### After

- `GET /api/prompts/{group}/{name}/revisions` and `/api/prompts/{promptSpecId}/revisions` return a newest-first list of `Revision { rev, tag?, sha, author, when, msg, kind, spec? }`, backed by JGit log + diff against the prompt's `promptlm.yml` path.
- OpenAPI lists `Revision` and `Kind`; `@promptlm/api-client` regenerated with `getRevisionsByGroupAndName` on `PromptSpecificationsService`.
- Webui adds `usePromptRevisions(id)` gated on `featureFlags.revisionHistory` (`VITE_FEATURE_HISTORY=true`). Default is `false`, so v1 behavior is unchanged.

## Demo script

1. Stand up the webapp against a project whose repo has at least three commits touching `prompts/support/welcome/promptlm.yml`:

   ```bash
   ./build-jdk.sh
   java -jar apps/promptlm-webapp/target/promptlm-webapp-0.1.0-SNAPSHOT.jar \
     --promptlm.active-project.repoDir=/path/to/seeded-project
   ```

2. Curl the endpoint via the explicit `{group}/{name}` route:

   ```bash
   curl -sf http://localhost:8080/api/prompts/support/welcome/revisions | jq .
   ```

   Expected response (excerpt):

   ```json
   [
     { "rev": "r3", "sha": "f0d51b...", "kind": "edit", "msg": "Polish welcome copy",
       "when": "2026-04-02T12:00:00Z", "author": "Jane Doe",
       "spec": { "id": "support/welcome", "name": "welcome", "group": "support",
                 "version": "1.2", "revision": 3, "description": "final" } },
     { "rev": "r2", "kind": "edit", "...": "..." },
     { "rev": "r1", "kind": "add",  "...": "..." }
   ]
   ```

3. Negative cases:

   ```bash
   # Unknown prompt → 404
   curl -sf -o /dev/null -w "%{http_code}\n" \
     http://localhost:8080/api/prompts/support/does-not-exist/revisions
   # Output: 404

   # Unsafe segment → 400
   curl -sf -o /dev/null -w "%{http_code}\n" \
     "http://localhost:8080/api/prompts/support/..%2Fescape/revisions"
   # Output: 400
   ```

4. Webui hook (optional, requires the feature flag):

   ```bash
   cd components/promptlm-web-ui
   VITE_FEATURE_HISTORY=true bun run dev
   ```

   Open the prompt detail page in DevTools → Network. Observe a `GET /api/prompts/<group>/<name>/revisions` request firing once the page mounts. With the env var unset (the v1 default), no request is made.

## Acceptance-criteria checklist

- [x] AC-1: 200 with newest-first list — `getRevisionsByGroupAndNameReturnsListNewestFirst` (controller) + `listRevisionsReturnsAddEditEditNewestFirst` (integration).
- [x] AC-2: `Revision` shape — controller + integration tests assert every field.
- [x] AC-3: `kind` mapping — `listRevisionsReturnsAddEditEditNewestFirst`, `listRevisionsReportsRemoveWhenSpecFileIsDeleted`, `listRevisionsReportsRenameAsAddOnNewPathAndRemoveOnOld` (the last documents v1 RENAME limitation).
- [x] AC-4: 404 — `getRevisionsReturnsNotFoundWhenStoreReturnsEmpty`.
- [x] AC-5: 400 — `getRevisionsReturnsBadRequestWhenStoreRejectsSegment`, `getRevisionsByPromptIdReturnsBadRequestWhenIdIsMalformed`, `listRevisionsRejectsUnsafeSegments`.
- [x] AC-6: regenerated client — `models/Revision.ts`, `models/Kind.ts`, `getRevisionsByGroupAndName` on `PromptSpecificationsService.ts`; tsc clean.
- [x] AC-7: hook gating — 4 vitest cases in `usePromptRevisions.test.tsx`.

## Evidence

- Generated OpenAPI fragment in `apps/promptlm-webapp/target/generated/openapi/promptlm-webapp-openapi.json` (`/revisions` paths and `Revision` schema present).
- Generated TS client at `components/promptlm-api-client/src/generated/client/{models/Revision.ts,models/Kind.ts,services/PromptSpecificationsService.ts}`.
- Test outputs captured in `review-report.md`.

## Tests + verification

Tests added:

- `components/promptlm-store/promptlm-store-github/src/test/java/dev/promptlm/store/github/GitHubPromptStoreRevisionsTest.java` — 7 cases (happy path, REMOVE, rename-as-add+remove, no-history, unsafe segments, soft-fail YAML, semver tag).
- 5 new cases in `components/promptlm-web-api/src/test/java/dev/promptlm/web/PromptSpecControllerWebMvcTest.java` — happy path (group/name), promptId split, 404, 400 from store, malformed id 400.
- `components/promptlm-web-ui/src/api/__tests__/usePromptRevisions.test.tsx` — 4 cases (flag off, flag on happy path, malformed id variants, enabled:false).

Commands run:

```
mvn -pl components/promptlm-store/promptlm-store-github -am test \
    -Dtest=GitHubPromptStoreRevisionsTest                  → 7 passed
mvn -pl components/promptlm-web-api -am test \
    -Dtest=PromptSpecControllerWebMvcTest                  → 19 passed (5 new)
mvn -pl <touched modules> -am test                         → 44 passed
mvn -pl apps/promptlm-webapp -am -DskipTests package       → BUILD SUCCESS (regenerates openapi.json)
cd components/promptlm-api-client && npm run generate && npm run build
                                                            → tsc clean
cd components/promptlm-web-ui && npm test                  → 85 passed (4 new)
```

Skipped: `./build-full.sh`. The local-build feedback note flags vfox per-shell activation, a broken `/var/run/docker.sock` symlink, and flaky Playwright HappyPath tests as known issues unrelated to this change. The targeted module-level commands cover the diff.

## Review-loop summary

- Findings: blocker × 0, high × 1 (downgraded — matches existing `/release` pattern), medium × 2 (1 fixed, 1 already-handled), low × 2 (1 fixed, 1 known generator limitation), note × 3.
- Fixes applied: `firstLine` strips trailing CR for CRLF commit messages; removed misleading `@JsonInclude(ALWAYS)` on `Revision`.
- Unresolved (with rationale): TS `Revision.spec` is typed as `PromptSpec` instead of `PromptSpec | null` — known `openapi-typescript-codegen` limitation; not introduced by this change. Long-history performance — accepted for v1 (flag off).

## Security summary

- Threat-model highlights: path traversal on `{group}/{name}` (mitigated by `GitFileNameStrategy`); YAML deserialization safe (constrained `modelYamlMapper`, no default typing); long-history DoS (accepted for v1).
- Findings + severity: 2 × low (path traversal, YAML deserialization — both mitigated), 1 × low (DoS, accepted), 2 × note (information disclosure inherited from existing endpoints; auth posture unchanged).
- Pen-test scenarios + outcomes: none — read-only threat-model review only. Authorization gate not engaged.
- Residual risks: `/api/prompts/**` remains unauthenticated (entire-API concern, out of scope).

## Known limitations

1. **RENAME emission deferred.** JGit's `LogCommand.addPath()` does not follow renames; renames surface as `add` on the new path and `remove` on the old path. `Kind.RENAME` is preserved in the schema for forward compatibility.
2. **`tag` is null in v1.** No git tags created by the current release flow. Tag resolution is implemented and will populate automatically when tagging lands.
3. **Snapshot soft-fail.** Historical commits whose YAML cannot be deserialized yield `spec: null` with a logged warning. Diff tools must handle the null case.
4. **Performance.** Full git log + N tree walks per request; acceptable for v1.
5. **Auth.** `/api/prompts/**` remains unauthenticated; out of scope here.

## Recommended follow-ups

- Wire `RevisionHistoryTable` (already in `@promptlm/ui`) into the prompt detail page once the diff-view issue (#78) is delivered.
- True RENAME detection (blob-SHA matching across commits, or `--follow` equivalent) when needed.
- HEAD-sha-keyed cache + `If-None-Match`/ETag on the endpoint.
- Authn/authz for `/api/prompts/**` as a separate concern.
