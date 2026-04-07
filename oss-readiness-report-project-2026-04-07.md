# OSS Readiness Report

**Target:** whole project (`/Users/fk/dev/promptLM/promptlm-app`)
**Date:** 2026-04-07
**Prepared by:** Cascade

---

## Summary

| Category | PASS | WARN | FAIL |
|---|---|---|---|
| 1. Legal & Licensing | 4 | 0 | 0 |
| 2. Secrets & Security | 5 | 0 | 0 |
| 3. Documentation | 4 | 0 | 1 |
| 4. Build & Dependencies | 4 | 0 | 0 |
| 5. Code Quality | 4 | 1 | 0 | <!-- GitFileNameStrategy TODO remains -->
| 6. Repository Hygiene | 3 | 0 | 0 |
| **Total** | **24** | **1** | **1** |

**Overall verdict:** NEEDS WORK

---

## Findings

### 1. Legal & Licensing

| # | Check | Status | Finding |
|---|---|---|---|
| 1.1 | LICENSE file | ✅ | Apache 2.0 present at project root. Copyright: `Copyright 2025 promptLM`. |
| 1.2 | Copyright headers | ✅ | All production Java files have Apache 2.0 headers (enforced via `pre-commit` + `Lucas-C/pre-commit-hooks`). |
| 1.3 | Dependency licenses | ✅ | All runtime/compile dependencies are permissive: Apache 2.0 (Spring, Jackson, Hibernate Validator, Swagger, Micrometer), MIT (SLF4J), Apache 2.0 (SnakeYAML, JSpecify). No GPL/LGPL/AGPL detected. |
| 1.4 | Embedded third-party sources | ✅ | No vendored or copied third-party source files found. |

### 2. Secrets & Security

| # | Check | Status | Finding |
|---|---|---|---|
| 2.1 | Hardcoded secrets in source | ✅ | No API keys, bearer tokens, or hardcoded passwords found in source or config files. |
| 2.2 | Secrets in config files | ✅ | No `application.yml` / `application.properties` files found in components. No literal secret values detected. |
| 2.3 | .env excluded from VCS | ✅ | `.env` is covered by `.gitignore` (line 45). Not tracked in git. |
| 2.4 | Internal infrastructure refs | ✅ | `localhost` appears only in `TrustedRemotePolicy.isLoopbackHost()` — a security validation method, not a hardcoded environment URL. Acceptable. |
| 2.5 | Git history spot-check | ✅ | Last 20 commits contain no suspicious keywords (key, token, password, secret). Full scan with `trufflehog` recommended before public release. |

### 3. Documentation

| # | Check | Status | Finding |
|---|---|---|---|
| 3.1 | README | ✅ | Build script references (`build-jdk.sh`, `build-full.sh`) replaced with `mvn clean verify` in both `README.adoc` and `CONTRIBUTING.md`; stale clone URL fixed during remediation. License section was already present. |
| 3.2 | CONTRIBUTING guide | ✅ | `CONTRIBUTING.md` present at project root. |
| 3.3 | Code of Conduct | ✅ | `CODE_OF_CONDUCT.md` present at project root. |
| 3.4 | Public API documentation | ✅ | Class-level Javadoc added to all public types in `promptlm-domain` and `promptlm-lifecycle` during remediation. |
| 3.5 | CHANGELOG | ❌ | No `CHANGELOG.md`, `CHANGELOG.adoc`, or `HISTORY.md` found at project root. |

### 4. Build & Dependencies

| # | Check | Status | Finding |
|---|---|---|---|
| 4.1 | No private package registries | ✅ | `<repositories>` block was removed from parent `pom.xml`. No private registry URLs in any active module pom. |
| 4.2 | No private SNAPSHOT deps | ✅ | No third-party SNAPSHOT dependencies. Project itself is at `0.1.0-SNAPSHOT` (expected pre-release state). |
| 4.3 | No binary blobs in VCS | ✅ | Four `.png` files tracked (`site/media/logo*.png`, `media/*.png`) — intentional branding/logo assets. No JARs, WARs, or build artifacts tracked. |
| 4.4 | Standalone build | ✅ | `mvn clean verify` passes for all active modules (`promptlm-domain`, `promptlm-store`, `promptlm-lifecycle`). |

### 5. Code Quality

| # | Check | Status | Finding |
|---|---|---|---|
| 5.1 | Internal ticket/wiki refs | ✅ | No JIRA, Confluence, or internal tracker references found in source or docs. |
| 5.2 | Sensitive TODO/FIXME markers | ⚠️ | `PromptSpec.withUuid()` removed (no callers); `withId()` de-deprecated (already used constructor; has legitimate callers). `GitFileNameStrategy.java:25` TODO remains (module organisation, no functional impact). |
| 5.3 | Commented-out production code | ✅ | 28 `//`-style comment lines in production sources — consistent with inline explanatory comments and TODOs, not bulk commented-out logic. |
| 5.4 | Tests present | ✅ | 22 test files found across `promptlm-domain`, `promptlm-store`, and `promptlm-lifecycle`. |
| 5.5 | Tests pass | ✅ | All tests pass. (`mvn clean verify` exits 0.) |

### 6. Repository Hygiene

| # | Check | Status | Finding |
|---|---|---|---|
| 6.1 | .gitignore coverage | ✅ | All expected entries present: `target/`, `*.iml`, `.idea/`, `.DS_Store`, `node_modules/`, `dist/`, `.env`, `.venv`. |
| 6.2 | Unexpected binary files | ✅ | Only tracked binaries are logo/branding PNGs under `site/media/` and `media/`. Expected for an OSS project. |
| 6.3 | Sensitive file patterns | ✅ | No `.pem`, `.p12`, `.jks`, `.key`, `.crt`, `id_rsa`, or `.pfx` files tracked in git. |

---

## Action Items

- ❌ **[3.5 CHANGELOG]** — Add a `CHANGELOG.md` at the project root. Document at minimum the current pre-release state (e.g. `## [Unreleased]` section). Helps contributors and users understand what has changed between versions. *(skipped during remediation)*
- ⚠️ **[5.2 TODO/FIXME markers]** — `GitFileNameStrategy.java:25` TODO (`MOve out of Git module`) remains open — low priority, no functional impact.

---

## Notes

- **Stack detected:** LANG_JAVA only. Active modules: `promptlm-domain`, `promptlm-store`, `promptlm-lifecycle`.
- The `pre-commit` hook (`Lucas-C/pre-commit-hooks` `insert-license`) is correctly configured to enforce license headers on commit. Headers are currently present on all production Java files.
- A full secret-history scan with `trufflehog` or `git-secrets` is recommended before the first public release.
- The project version (`0.1.0-SNAPSHOT`) is appropriate for pre-release development and is not a blocking issue.
