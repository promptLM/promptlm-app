# Review report — issue #76

Current-state document.

## Summary

Independent code review by a code-reviewer subagent on the diff of branch
`claude/eloquent-rubin-f80c4f` against `main`. Perspectives covered:
correctness, path-traversal/safety, performance/DoS, codebase consistency,
generated TS client, webui hook gating, tests.

## Findings

| ID | Severity | Area | Description | Status |
|---|---|---|---|---|
| F-1 | high | Controller routing | `/{promptSpecId}/revisions` is effectively dead under default Spring URL-firewall (encoded `/` rejected). Mirrors the existing `/release` pair, so consistent with the codebase. | accepted (matches existing pattern; webui calls `/{group}/{name}/revisions`) |
| F-2 | medium | `firstLine` | Did not strip trailing `\r` for CRLF commit messages. | fixed (use `.trim()` on the substring head) |
| F-3 | medium | `getRevisions(promptSpecId)` | Empty-segment edge case (e.g. `support//welcome`) — re-checked: `IllegalArgumentException` thrown by `GitFileNameStrategy` is wrapped to 400 by the surrounding handler. | accepted (downgraded to note by reviewer) |
| F-4 | low | TS `Revision.spec` typing | Generator emits `spec?: PromptSpec` instead of `spec?: PromptSpec \| null` despite `nullable: true` in OpenAPI schema. | accepted (known generator limitation; not introduced by this change; consumers tolerate the runtime null) |
| F-5 | low | `@JsonInclude(ALWAYS)` on `Revision` | Annotation contradicts the test assertion `$[0].tag.doesNotExist()`; the configured object mapper filters nulls regardless. The annotation was misleading. | fixed (removed annotation; tests still pass) |
| F-6 | note | Performance | Per-commit RevWalk + TreeWalk is N-quadratic-ish for deep histories. | accepted (v1, flag off; follow-up: caching / RevWalk reuse) |
| F-7 | note | Empty-segment guard | Defensive `isBlank` check unreachable because Spring rejects empty segments. | accepted (harmless) |
| F-8 | note | Path traversal | `GitFileNameStrategy` regex + explicit `/`/`\\`/`..` rejection is sufficient; Spring's default `UrlPathHelper` rejects encoded slashes/dots. | accepted |

No blocker findings.

## Verification evidence

```
$ mvn -pl components/promptlm-store/promptlm-store-github -am test \
      -Dtest=GitHubPromptStoreRevisionsTest -Dsurefire.failIfNoSpecifiedTests=false
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS

$ mvn -pl components/promptlm-web-api -am test \
      -Dtest=PromptSpecControllerWebMvcTest -Dsurefire.failIfNoSpecifiedTests=false
[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS

$ mvn -pl components/promptlm-store/promptlm-store-api,components/promptlm-store/promptlm-store-github,components/promptlm-web-api -am test
[INFO] Tests run: 44, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS

$ mvn -pl apps/promptlm-webapp -am -DskipTests=true package
[INFO] BUILD SUCCESS  (regenerates apps/promptlm-webapp/target/generated/openapi/promptlm-webapp-openapi.json)

$ cd components/promptlm-api-client && npm run generate && npm run build
✨ openapi-typescript 7.13.0 → models/Revision.ts, models/Kind.ts emitted
   getRevisionsByGroupAndName method added to PromptSpecificationsService
   tsc build clean

$ cd components/promptlm-web-ui && npm test
Test Files  17 passed (17)
Tests       85 passed (85)
```

Acceptance criteria coverage (from implementation-plan.md):

- AC-1 (200 newest-first) — `getRevisionsByGroupAndNameReturnsListNewestFirst` (controller) + `listRevisionsReturnsAddEditEditNewestFirst` (integration).
- AC-2 (record shape) — both tests above + `listRevisionsExposesSemverTag`.
- AC-3 (`kind` mapping) — `listRevisionsReturnsAddEditEditNewestFirst`, `listRevisionsReportsRemoveWhenSpecFileIsDeleted`, `listRevisionsReportsRenameAsAddOnNewPathAndRemoveOnOld` (documents v1 RENAME limitation).
- AC-4 (404) — `getRevisionsReturnsNotFoundWhenStoreReturnsEmpty`.
- AC-5 (400) — `getRevisionsReturnsBadRequestWhenStoreRejectsSegment`, `getRevisionsByPromptIdReturnsBadRequestWhenIdIsMalformed`, `listRevisionsRejectsUnsafeSegments`.
- AC-6 (regenerated client) — `models/Revision.ts`, `models/Kind.ts`, `getRevisionsByGroupAndName` on `PromptSpecificationsService.ts` (verified via grep + `tsc` clean build).
- AC-7 (hook gating) — 4 vitest cases in `usePromptRevisions.test.tsx`.

Skipped (with rationale):
- Full `./build-full.sh` — local-build feedback note flags vfox + Docker socket + flaky Playwright HappyPath tests as known issues unrelated to this change. The targeted module-level tests cover the diff.
