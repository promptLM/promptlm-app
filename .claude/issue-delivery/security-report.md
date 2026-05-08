# Security report — issue #76

Read-only threat-model review. No adversarial testing performed; no
authorization gate required. If pen-testing is later requested, scope must be
recorded under "Authorization confirmation" before any actions.

## Threat model

- **Assets**:
  - YAML blobs at past commits in the active project's git repository (may
    contain prompt content that's commercially sensitive).
  - Git metadata (author names, timestamps, commit messages, tags).
- **Trust boundaries**:
  - `/api/prompts/**` — unauthenticated today. There is no `spring-boot-starter-security`
    on the classpath (verified). The new endpoint inherits this posture; it
    does not change the surface.
  - The active project's `repoDir` is treated as trusted local storage.
- **Attackers / abuse cases**:
  - Anyone who can reach the API (network-adjacent, or local) can request
    revisions for any group/name. No new privilege escalation path.
  - Path-traversal on `{group}` / `{name}` to read files outside the prompt
    namespace.
  - Malicious YAML at a historical commit triggering deserialization gadgets.
  - Long-history DoS on `listRevisions`.
- **Sensitive flows**:
  - Reading historical YAML blobs by SHA → deserializing through `modelYamlMapper`.

## Findings

| ID | Severity | Area | Description | Mitigation | Status |
|---|---|---|---|---|---|
| S-1 | low | Path traversal | `{group}` and `{name}` are concatenated into a JGit path. | Routed through `GitFileNameStrategy.buildPromptPath()` which (a) lowercases, (b) rejects `/`, `\\`, `..`, (c) requires regex `[a-z0-9._-]+`. Spring's default `UrlPathHelper` rejects encoded slashes and dots, defending the path-variable surface. | mitigated by existing helper; covered by `listRevisionsRejectsUnsafeSegments` test |
| S-2 | low | YAML deserialization | Historical YAML is parsed through `modelYamlMapper` (Jackson 3 / `tools.jackson`) into `PromptSpec`. | The configured mapper has no default typing (verified) — class instantiation is constrained to the target type. Soft-fail catches `IOException` and `RuntimeException` (Jackson 3 wraps parse errors in `JacksonException extends RuntimeException`) and emits `spec=null`. No `eval`, no class-loading, no polymorphism. | mitigated; covered by `listRevisionsSoftFailsOnUnparseableYaml` test |
| S-3 | low | DoS via deep history | Walking the full git log + N TreeWalks per request. | v1 webui ships `revisionHistory: false` so practical exposure is the size of the prompt's history (typically tens of commits). | accepted for v1; follow-up for caching / pagination / ETag (recorded as open risk in implementation-plan.md) |
| S-4 | note | Information disclosure | Endpoint exposes git author names, commit messages, and historical spec content. Same risk surface as the existing `GET /{id}` (which returns the latest spec) — no new data class. | inherited; no new exposure |
| S-5 | note | Auth posture unchanged | `/api/prompts/**` remains unauthenticated. | out of scope for this issue (separate concern affecting the entire prompts API) |

## Authorization confirmation

(Not required — only read-only threat-model review was performed. No
adversarial testing was scoped or executed.)

## Pen-test results

(None performed.)
