# Decision log

Append-only. Material decisions only. Format: see `log-formats.md` in the github-issue-delivery command directory.

## Decision D-001: Artifact directory location
Date/time: 2026-05-08
Context: Worktree `claude/eloquent-rubin-f80c4f` does not contain `.claude/commands/github-issue-delivery/` (those live only on the main branch's `.claude/`). Procedure references templates by relative path.
Options considered:
  - Use the default `.claude/issue-delivery/` inside the worktree.
  - Use the main repo's `.claude/issue-delivery/` directly.
Decision: Default `.claude/issue-delivery/` inside the worktree. Templates copied from `/Users/fk/dev/promptLM/promptlm-app/.claude/commands/github-issue-delivery/log-templates/`. Missing `review-report.md` and `security-report.md` templates were authored locally.
Rationale: Keeps artifacts on-branch with the implementation diff. Aligns with the procedure default.
Consequences: When the branch is merged, the artifacts ship with it.
Related issue(s): #76
Related file(s): `.claude/issue-delivery/*.md`

## Decision D-002: Snapshot rebuild tolerates historical-deserialization failures
Date/time: 2026-05-08
Context: `Revision.spec` requires the full `PromptSpec` snapshot at each revision. Historical YAML may not deserialize against the current schema if the format has evolved.
Options considered:
  - Hard-fail the whole `/revisions` response if any commit's YAML is unparseable.
  - Soft-fail per commit: skip the commit and log a warning.
  - Soft-fail per commit: include the commit with `spec: null`.
Decision: Soft-fail per commit by **including the commit with `spec: null`** and a `kind` reflecting the diff outcome (e.g. `remove` if file is missing at that commit, otherwise the diff-derived kind).
Rationale: Matches the UI's empty-state contract (`spec` may be missing). Diff tool can fall back to "no diff available". Hard-fail would make the endpoint useless for legitimate histories.
Consequences: Logged warning per failed commit. The `Revision.spec` field is documented as `nullable: true`.
Related issue(s): #76
Related file(s): `components/promptlm-store/promptlm-store-github/src/main/java/dev/promptlm/store/github/GitHubPromptStore.java`

## Decision D-003: `kind` derivation from JGit diff
Date/time: 2026-05-08
Context: Need to label each revision as `add` | `edit` | `remove` | `rename`.
Options considered:
  - Compare each commit's tree to its parent using JGit `DiffFormatter` with rename detection.
  - Heuristics from commit message.
Decision: Use `DiffFormatter` with `setDetectRenames(true)` against the prompt path. `ADD` → `add`, `MODIFY` → `edit`, `DELETE` → `remove`, `RENAME` → `rename`. Initial commit (no parent) where the file exists → `add`.
Rationale: Authoritative; commit-message heuristics are unreliable.
Consequences: Cost ~one diff per commit; acceptable because v1 webui ships with flag off, so volume is low.
Related issue(s): #76
Related file(s): `GitHubPromptStore`

## Decision D-004: `tag` resolution
Date/time: 2026-05-08
Context: Issue spec says `tag?` (semantic-version tag if any).
Options considered:
  - Read git tags pointing at the commit and pick the first semver-shaped one.
  - Always null for v1.
Decision: Read tags via `git.tagList()` once, build a `commitSha → tag` map, and emit the tag if its name matches `^v?\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$`. Otherwise null.
Rationale: Cheap to implement, future-proof when the release flow starts tagging. No-op today since there are no tag operations in the codebase.
Consequences: All `tag` values null in v1. No test fixtures need tags.
Related issue(s): #76
Related file(s): `GitHubPromptStore`

## Decision D-005: Path-traversal protection on `{promptSpecId}`
Date/time: 2026-05-08
Context: The id is `<group>/<name>`; controller embeds it in a JGit path (`prompts/<group>/<name>/promptlm.yml`). Without validation, `..` segments could escape the prompts root.
Options considered:
  - Strict regex on each segment: `^[a-zA-Z0-9_-]+$`.
  - Canonicalize against the prompts root and reject non-prefixed paths.
Decision: Apply both — regex on each segment, plus canonicalization. Mismatch → `400 Bad Request`.
Rationale: Defense in depth. Matches existing `PromptSpec.name`/`group` validation.
Consequences: Predictable rejection for malicious input.
Related issue(s): #76
Related file(s): `PromptSpecController`, `GitHubPromptStore`

## Decision D-006: `listRevisions` placement (PromptStore interface)
Date/time: 2026-05-08
Context: Where the git-walking lives.
Options considered:
  - One-off service in `promptlm-web-api`.
  - Method on `PromptStore` interface implemented by `GitHubPromptStore` (with a default returning empty list for other backends).
Decision: Add `default List<Revision> listRevisions(String group, String name)` to `PromptStore` returning `List.of()`; override in `GitHubPromptStore`.
Rationale: Keeps git access in the store layer (consistent with how prompts are read/written today). Default keeps unrelated stores compiling.
Consequences: Future Phase-E CLI can reuse the same in-process bean instead of going through HTTP.
Related issue(s): #76
Related file(s): `PromptStore`, `GitHubPromptStore`

## Decision D-007: Webui wiring scope
Date/time: 2026-05-08
Context: Issue says "wire into webui via the featureFlags.revisionHistory flag (currently false)". v1 ships with the flag off → empty state.
Options considered:
  - Add the hook + render `RevisionHistoryTable` from `@promptlm/ui`.
  - Add the hook only; rendering deferred to the diff-view follow-up issue.
Decision: Add a `usePromptRevisions(id)` hook in `components/promptlm-web-ui/src/api/hooks.ts` gated on `featureFlags.revisionHistory`. Do **not** wire rendering into `PromptDetail` — that belongs to the diff-view follow-up.
Rationale: The issue's "Unblocks" section explicitly calls out the table and diff view as downstream consumers. Keeps this issue's diff focused.
Consequences: Visible UI behavior under the flag is unchanged from current main; the hook exists and is queryable for the next issue.
Related issue(s): #76
Related file(s): `components/promptlm-web-ui/src/api/hooks.ts`

## Decision D-008: RENAME emission deferred to a follow-up
Date/time: 2026-05-08
Context: JGit's `LogCommand.addPath()` does not natively follow renames. With `DiffFormatter.setDetectRenames(true)` on a path-filtered scan, RENAME entries did not surface reliably in our test scenarios — a rename produced ADD on the new path and REMOVE (or DELETE) on the old path.
Options considered:
  - Implement custom rename detection via blob-SHA matching across siblings.
  - Use JGit's `RenameDetector` directly on whole-tree diffs and post-filter.
  - Defer RENAME emission and document the v1 behavior.
Decision: Defer. Implement only ADD/EDIT/REMOVE classification by comparing blob presence at commit vs parent. Keep `Kind.RENAME` in the schema for forward compatibility. Document in code (`deriveKind` Javadoc) and tests (`listRevisionsReportsRenameAsAddOnNewPathAndRemoveOnOld`).
Rationale: Rename is a rare event for prompt files, and a robust implementation requires more than a single afternoon of JGit plumbing. v1 webui ships with the flag off so the limitation is invisible to users.
Consequences: A rename surfaces as two events (ADD on new path, REMOVE on old path) rather than one RENAME. Tests pin this behavior so a future change is intentional.
Related issue(s): #76
Related file(s): `GitHubPromptStore.java`, `GitHubPromptStoreRevisionsTest.java`

## Decision D-009: `firstLine` trims trailing CR (review fix F-2)
Date/time: 2026-05-08
Context: Code review flagged that the previous `firstLine(String)` returned `message.substring(0, newline)` for CRLF inputs, leaving a `\r` in the wire payload.
Decision: `.trim()` the head substring before returning.
Rationale: Cosmetic but visible in API responses; the fix is one line.
Related issue(s): #76
Related file(s): `GitHubPromptStore.java`

## Decision D-010: Removed `@JsonInclude(ALWAYS)` on `Revision` (review fix F-5)
Date/time: 2026-05-08
Context: The annotation contradicted the test assertion that `null` `tag` is omitted from the JSON payload. The configured object mapper filters nulls regardless, so the annotation was dead code that misled readers.
Decision: Remove. Default Jackson behaviour applies.
Rationale: Behaviour-preserving cleanup; removes confusion.
Related issue(s): #76
Related file(s): `Revision.java`
