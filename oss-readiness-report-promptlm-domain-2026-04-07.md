# OSS Readiness Report

**Target:** `components/promptlm-domain`
**Date:** 2026-04-07
**Prepared by:** Cascade

---

## Summary

| Category | PASS | WARN | FAIL |
|---|---|---|---|
| 1. Legal & Licensing | 2 | 1 | 0 |
| 2. Secrets & Security | 5 | 0 | 0 |
| 3. Documentation | 0 | 5 | 0 |
| 4. Build & Dependencies | 2 | 1 | 1 |
| 5. Code Quality | 3 | 2 | 0 |
| 6. Repository Hygiene | 3 | 0 | 0 |
| **Total** | **15** | **9** | **1** |

**Overall verdict: NEEDS WORK**

One hard blocker prevents external contributors from building the module. Several documentation gaps should be addressed before a public release.

---

## Findings

### 1. Legal & Licensing

| # | Check | Status | Finding |
|---|---|---|---|
| 1.1 | LICENSE file | ✅ | `LICENSE` at project root — Apache License 2.0, Copyright 2025 Fabian Krüger (promptLM) |
| 1.2 | Copyright headers in source files | ⚠️ | All 33 `.java` files under `src/main` lack a copyright/license header. Apache 2.0 does not require headers, but their absence makes provenance unclear for downstream consumers and contributors. |
| 1.3 | Dependency license compatibility | ✅ | All compile and test dependencies use permissive licenses: Apache 2.0 (Jackson 3.x, Hibernate Validator, Spring Boot, SLF4J, AssertJ, Mockito, JUnit), MIT (SnakeYAML), EPL-1.0 (JUnit 4 transitive via asm — test-only, not distributed). No GPL, LGPL, AGPL, or proprietary artifacts. |
| 1.4 | Embedded third-party sources | ✅ | No vendored or copied third-party Java source files found. |

### 2. Secrets & Security

| # | Check | Status | Finding |
|---|---|---|---|
| 2.1 | Hardcoded secrets in source code | ✅ | No API keys, bearer tokens, or hardcoded credentials found. `ApiKey.java` is a value-object wrapper class; `token` occurrences in `ChatCompletionResponse.java` are LLM usage-count fields (`inputTokens`, `outputTokens`). |
| 2.2 | Secrets in configuration files | ✅ | No `application.properties` or `application*.yml` files exist in this module. |
| 2.3 | `.env` excluded from VCS | ✅ | `.env` is correctly gitignored via `/.env` in the root `.gitignore`. |
| 2.4 | Internal infrastructure references | ✅ | No hardcoded `localhost`, private IPs, or internal hostnames in production source code. |
| 2.5 | Git history spot-check | ✅ | No commit messages referencing `key`, `token`, `password`, or `secret` found in the last 20 commits or across all branches. Full scan with `trufflehog` or `git-secrets` is recommended before public release. |

### 3. Documentation

| # | Check | Status | Finding |
|---|---|---|---|
| 3.1 | README | ⚠️ | `README.adoc` exists at the project root with description, features, and build instructions. Missing: an explicit license section (e.g. "Licensed under Apache 2.0"). No module-level README for `promptlm-domain` itself. |
| 3.2 | CONTRIBUTING guide | ⚠️ | No `CONTRIBUTING.md` found at module or project root. External contributors have no guidance on how to submit patches, open issues, or set up a dev environment. |
| 3.3 | Code of Conduct | ⚠️ | No `CODE_OF_CONDUCT.md` found. Expected for public OSS projects to set community expectations. |
| 3.4 | Javadoc on public API surface | ⚠️ | 25 of 33 source files contain no Javadoc (`/**`) at all. Key public types with no documentation include `PromptSpec`, `AppContext`, `ApiKey`, `Request`, `Response`, `EvaluationSpec`, `PromptSpecBuilder`, and all event records. As the domain module, this is the primary API surface consumers depend on. |
| 3.5 | CHANGELOG | ⚠️ | No `CHANGELOG.md` or `CHANGELOG.adoc` at the project root. Adopters have no documented history of breaking changes or releases. |

### 4. Build & Dependencies

| # | Check | Status | Finding |
|---|---|---|---|
| 4.1 | No private Maven repositories required | ❌ | The parent `pom.xml` declares a GitHub Packages repository: `https://maven.pkg.github.com/promptlm/promptlm-gitea-artifactory`. GitHub Packages requires authenticated access (a personal access token with `read:packages`) even for public repositories. External contributors cannot build the project without configuring credentials in their `~/.m2/settings.xml`. This is a hard blocker for OSS adoption. |
| 4.2 | No private SNAPSHOT dependencies | ⚠️ | The module itself (`promptlm-domain`) is versioned `0.1.0-SNAPSHOT`. All declared third-party dependencies are release versions. However, deploying or consuming a SNAPSHOT artifact requires access to the private GitHub Packages registry configured in the parent pom. |
| 4.3 | No binary blobs in VCS | ✅ | No `.jar`, `.war`, `.ear`, or `.class` files found tracked outside of `target/` directories. |
| 4.4 | Standalone build | ✅ | `mvn clean verify -DskipTests` succeeds in 14 seconds. All 43 tests pass (`mvn test`). |

### 5. Code Quality

| # | Check | Status | Finding |
|---|---|---|---|
| 5.1 | Internal ticket / wiki references | ✅ | No Jira ticket IDs, Confluence links, or internal project-management references found in source or test code. |
| 5.2 | Sensitive TODO / FIXME markers | ⚠️ | Two `// TODO: Use constructor` comments in `PromptSpec.java` (lines 335, 342). These flag a refactoring desire, not a security or correctness issue. Should be resolved before a stable release to avoid publishing known technical debt. |
| 5.3 | Commented-out production code | ✅ | Only 4 single-line comments across 33 files. No significant blocks of commented-out code detected. |
| 5.4 | Tests present | ✅ | 7 test classes found under `src/test`. |
| 5.5 | Tests pass | ✅ | 43 tests run, 0 failures, 0 errors (`BUILD SUCCESS`). |

### 6. Repository Hygiene

| # | Check | Status | Finding |
|---|---|---|---|
| 6.1 | `.gitignore` coverage | ✅ | Root `.gitignore` covers `/**/target/`, `.idea/`, `*.iml`, `/.env`, and `.DS_Store`. All required patterns present. |
| 6.2 | Unexpected binary files | ✅ | No images, PDFs, ZIPs, or documents tracked within `components/promptlm-domain`. |
| 6.3 | Sensitive file patterns | ✅ | No certificates (`.pem`, `.crt`), keystores (`.jks`, `.p12`), or private keys (`id_rsa`, `.key`) tracked in git. |

---

## Action Items

### ❌ Must Fix Before OSS

- ❌ **[4.1] Private Maven repository in parent pom** — Remove or replace `https://maven.pkg.github.com/promptlm/promptlm-gitea-artifactory` with either (a) a publicly accessible registry, (b) publishing the artifact to Maven Central, or (c) documenting the required GitHub token setup clearly in the README with exact `settings.xml` instructions. Without this, external contributors cannot build.

### ⚠️ Should Fix Before OSS

- ⚠️ **[3.4] Javadoc on public API surface** — Add Javadoc to all public interfaces, classes, and key records in the domain module. Priority: `PromptSpec`, `AppContext`, `ApiKey`, `Request`, `Response`, `EvaluationSpec`, `PromptSpecBuilder`, and all event types.
- ⚠️ **[3.2] CONTRIBUTING guide** — Create `CONTRIBUTING.md` at the project root covering: how to set up the dev environment, build instructions, how to submit a PR, and coding conventions.
- ⚠️ **[1.2] Copyright headers** — Add Apache 2.0 license headers to all Java source files. This improves provenance clarity for downstream consumers and is expected practice for Apache-licensed projects.
- ⚠️ **[3.1] README license section** — Add an explicit "License" section to `README.adoc` referencing Apache 2.0 and linking to the `LICENSE` file.
- ⚠️ **[3.5] CHANGELOG** — Create a `CHANGELOG.md` at the project root documenting the initial public version and any notable design decisions.
- ⚠️ **[3.3] Code of Conduct** — Add `CODE_OF_CONDUCT.md` (e.g. Contributor Covenant) to set community expectations.
- ⚠️ **[5.2] TODO markers** — Resolve the two `// TODO: Use constructor` comments in `PromptSpec.java` (lines 335, 342).
- ⚠️ **[4.2] SNAPSHOT version** — Consider whether to release a stable `0.1.0` before publicising the module, or document that SNAPSHOT consumption requires the GitHub Packages repository.

---

## Notes

- **`tools.jackson` (Jackson 3.x):** The dependency uses the new `tools.jackson` group ID (Jackson 3.x rebranding). This is published to Maven Central and is not the source of the GitHub Packages dependency.
- **`promptlm-gitea-artifactory`:** The private GitHub Packages registry appears to host an internal `promptlm-gitea-artifactory` artifact (version `1.2.0`). It is not consumed by `promptlm-domain` directly, but its presence in the parent pom affects all modules. Consider extracting it into a separate profile (e.g. `<profile id="internal">`) that is only activated when needed, so external builds are not blocked.
- **Security scan recommendation:** Run `trufflehog git file://. --since-commit HEAD~20` or `git-secrets --scan-history` before the first public push to confirm no secrets leaked in earlier commits.
