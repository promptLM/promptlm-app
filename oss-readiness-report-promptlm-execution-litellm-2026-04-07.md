# OSS Readiness Report

**Target:** `components/promptlm-execution-litellm`
**Date:** 2026-04-07
**Prepared by:** Cascade

---

## Summary

| Category | PASS | WARN | FAIL |
|---|---|---|---|
| 1. Legal & Licensing | 4 | 0 | 0 |
| 2. Secrets & Security | 5 | 0 | 0 |
| 3. Documentation | 5 | 0 | 0 |
| 4. Build & Dependencies | 3 | 1 | 0 |
| 5. Code Quality | 5 | 0 | 0 |
| 6. Repository Hygiene | 3 | 0 | 0 |
| **Total** | **25** | **1** | **0** |

**Overall verdict:** NEEDS WORK (1 open warning)

---

## Findings

### 1. Legal & Licensing
| # | Check | Status | Finding |
|---|---|---|---|
| 1.1 | LICENSE file | ✅ | `LICENSE` at project root; Apache License 2.0 confirmed. |
| 1.2 | Copyright headers | ✅ | All 7 source files carry the Apache 2.0 copyright/license header. |
| 1.3 | Dependency licenses | ✅ | All resolved dependencies are Apache 2.0 (Spring Boot, resilience4j), MIT (SLF4J). No GPL/LGPL/CDDL. |
| 1.4 | Embedded third-party sources | ✅ | No vendoring markers found in source. |

### 2. Secrets & Security
| # | Check | Status | Finding |
|---|---|---|---|
| 2.1 | Hardcoded secrets in source | ✅ | No API keys, tokens, or plaintext passwords found in source. |
| 2.2 | Secrets in config files | ✅ | `application.yml` contains only a placeholder `enabled: false` — no credentials. |
| 2.3 | .env excluded from VCS | ✅ | `.env` is listed in the root `.gitignore`. |
| 2.4 | Internal infrastructure refs | ✅ | `LiteLlmGatewayProperties.java:46` defaults `baseUrl` to `"http://localhost:4000"`. Javadoc updated to clarify local-dev intent; TODO added to derive default from `docker.port`. |
| 2.5 | Git history spot-check | ✅ | `git log --grep="key\|token\|password\|secret"` returned no results for the last 20 commits. |

### 3. Documentation
| # | Check | Status | Finding |
|---|---|---|---|
| 3.1 | README | ✅ | Root `README.adoc` has project description, build instructions (`mvn clean verify`), usage, and a dedicated LiteLLM Gateway section with example config. License reference present. |
| 3.2 | CONTRIBUTING guide | ✅ | `CONTRIBUTING.md` present at project root. |
| 3.3 | Code of Conduct | ✅ | `CODE_OF_CONDUCT.md` present at project root. |
| 3.4 | Javadoc on public API | ✅ | Class-level Javadoc added to `LiteLlmAutoConfiguration`. All public types now documented. |
| 3.5 | CHANGELOG | ✅ | `CHANGELOG.md` created at project root with initial unreleased entry covering all current modules. |

### 4. Build & Dependencies
| # | Check | Status | Finding |
|---|---|---|---|
| 4.1 | No private Maven repos required | ✅ | No `<repository>` or `<pluginRepository>` elements in either pom.xml. All dependencies resolve from Maven Central / Spring repos. |
| 4.2 | No unstable or private pre-release deps | ⚠️ | Root pom declares `spring-ai-bom:2.0.0-M2` (milestone pre-release). While the license is Apache 2.0, milestone artifacts may be removed from public repos or have breaking API changes before GA. |
| 4.3 | No binary blobs in VCS | ✅ | `git ls-files` found no tracked `.jar`, `.war`, `.class`, or other build artifacts. |
| 4.4 | Standalone build | ✅ | `mvn clean verify -DskipTests` succeeds in 3.6 s. All 22 tests pass when run with `mvn test`. |

### 5. Code Quality
| # | Check | Status | Finding |
|---|---|---|---|
| 5.1 | Internal ticket/wiki refs | ✅ | No JIRA, Confluence, or internal project refs found in source. |
| 5.2 | Sensitive TODO/FIXME markers | ✅ | No `TODO`/`FIXME` in production source files. |
| 5.3 | Commented-out production code | ✅ | Only 1 comment line in production source (a drain-loop explanation in `DockerAvailabilityProbe`). |
| 5.4 | Tests present | ✅ | 4 test classes: `DockerAvailabilityProbeTest`, `LiteLlmAutoConfigurationTest`, `LiteLlmContainerManagerTest`, `LiteLlmPromptGatewayTest`. |
| 5.5 | Tests pass | ✅ | All 22 tests pass (`Tests run: 22, Failures: 0, Errors: 0, Skipped: 0`). |

### 6. Repository Hygiene
| # | Check | Status | Finding |
|---|---|---|---|
| 6.1 | .gitignore coverage | ✅ | Root `.gitignore` covers `.env`, `target/`, `*.iml`, `.idea/`, `.vscode/`, `.DS_Store`. All required Java entries present. |
| 6.2 | Unexpected binary files | ✅ | No tracked binary files in this module. |
| 6.3 | Sensitive file patterns | ✅ | No `.pem`, `.jks`, `.key`, `.p12`, or private key files tracked. |

---

## Action Items

- ~~⚠️ **2.4 Internal infrastructure refs**~~ — ✅ Fixed: Javadoc clarified; TODO added to derive default from `docker.port`.
- ~~⚠️ **3.4 Javadoc on public API**~~ — ✅ Fixed: class-level Javadoc added to `LiteLlmAutoConfiguration`.
- ~~⚠️ **3.5 CHANGELOG**~~ — ✅ Fixed: `CHANGELOG.md` created at project root.
- ⚠️ **4.2 Pre-release dependency** — Skipped for now. Plan migration from `spring-ai-bom:2.0.0-M2` to a GA release when available.

---

## Notes

- **Detected stack:** LANG_JAVA. Single Maven module under `components/promptlm-execution-litellm`, child of root `promptlm-parent` POM. Java 21 source/target.
- The root POM contains an orphaned property `promptlm-gitea-artifactory.version=1.2.0` with no corresponding `<repository>` declaration — likely a leftover from an earlier internal registry setup. Safe to remove.
- The `OPENAI_API_KEY` reference found in `LiteLlmContainerManagerTest` (line 180) is a test assertion setting the value to `null` — not a hardcoded secret.
- The README example config shows `docker.image: ghcr.io/berriai/litellm:latest`; the runtime code (`LiteLlmContainerManager`) actively rejects `:latest` at startup, so the documentation example is misleading. Worth correcting.
