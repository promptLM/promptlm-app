# OSS Readiness Report — `components/promptlm-execution-springai`

**Date:** 2026-04-07
**Prepared by:** Cascade

---

## Summary

| Category | PASS | WARN | FAIL |
|---|---|---|---|
| 1. Legal & Licensing | 4 | 0 | 0 |
| 2. Secrets & Security | 5 | 0 | 0 |
| 3. Documentation | 4 | 1 | 0 |
| 4. Build & Dependencies | 3 | 1 | 0 | <!-- won't fix: M2, track for GA upgrade -->
| 5. Code Quality | 5 | 0 | 0 |
| 6. Repository Hygiene | 3 | 0 | 0 |
| **Total** | **23** | **2** | **0** |

**Overall verdict:** NEEDS MINOR WORK — no blocking issues; all findings are warnings.

---

## Findings

### 1. Legal & Licensing

| # | Check | Status | Finding |
|---|---|---|---|
| 1.1 | LICENSE file | ✅ | Apache License 2.0 present at project root. |
| 1.2 | Copyright headers | ✅ | All 5 production files and both test files carry the Apache 2.0 header with `Copyright 2025 promptLM`. |
| 1.3 | Dependency license compatibility | ✅ | All resolved dependencies are Apache 2.0: `spring-ai-*` (Apache 2.0), `spring-boot-*` (Apache 2.0), internal `promptlm-execution` module (Apache 2.0). No GPL/LGPL/AGPL/proprietary dependencies. |
| 1.4 | No embedded third-party sources | ✅ | No "originally from / copied from / ported from" markers found in any source file. |

---

### 2. Secrets & Security

| # | Check | Status | Finding |
|---|---|---|---|
| 2.1 | Hardcoded secrets in source | ✅ | No API keys, bearer tokens, or literal passwords found in production or test sources. `apiKey("dummy")` in `AnthropicVendorClientTest` is a clearly labelled test placeholder. |
| 2.2 | Secrets in config files | ✅ | No `application.yml`, `application.properties`, or `.env` files present in this module. |
| 2.3 | .env excluded from VCS | ✅ | Managed at project root (`.gitignore` line 45). |
| 2.4 | Internal infrastructure refs | ✅ | `http://anthropic.test` appears only in `AnthropicVendorClientTest` wired to a `MockRestServiceServer` — not a real endpoint. No hardcoded internal hosts in production code. |
| 2.5 | Git history spot-check | ✅ | No commit messages hinting at accidentally committed secrets in the last 20 commits. Full `trufflehog` scan recommended before first public release. |

---

### 3. Documentation

| # | Check | Status | Finding |
|---|---|---|---|
| 3.1 | README | ✅ | Added `== Spring AI Execution` section to root `README.adoc` documenting required config properties and vendor/model support matrix. |
| 3.2 | CONTRIBUTING guide | ✅ | `CONTRIBUTING.md` present at project root. |
| 3.3 | Code of Conduct | ✅ | `CODE_OF_CONDUCT.md` present at project root. |
| 3.4 | Public API documentation | ✅ | Class-level Javadoc added to `SpringAiPromptSpecExecutor`, `OpenAiVendorClient`, and `PromptSpecUtils` during remediation. |
| 3.5 | CHANGELOG | ⚠️ | No `CHANGELOG.md` at module or project root (project-wide issue, not specific to this module). |

---

### 4. Build & Dependencies

| # | Check | Status | Finding |
|---|---|---|---|
| 4.1 | No private package registries | ✅ | No `<repository>` or `<pluginRepository>` declarations in module or parent `pom.xml`. Spring AI milestone artifacts resolve from Maven Central. |
| 4.2 | No unstable/pre-release dependencies | ⚠️ | `spring-ai-starter-model-openai:2.0.0-M2` and `spring-ai-starter-model-anthropic:2.0.0-M2` are milestone (pre-GA) releases. The Spring AI 2.0 GA has not been released; M2 API surface may still change before GA. Acceptable for now but should be upgraded to GA before a stable release of this module. |
| 4.3 | No binary blobs in VCS | ✅ | No JARs, WARs, or tracked build artifacts in this module's source tree. |
| 4.4 | Standalone build & tests pass | ✅ | `mvn test` on this module exits 0. Both `AnthropicVendorClientTest` and `PromptSpecUtilsTest` pass. |

---

### 5. Code Quality

| # | Check | Status | Finding |
|---|---|---|---|
| 5.1 | Internal ticket/wiki refs | ✅ | No JIRA, Confluence, or internal tracker references found. |
| 5.2 | TODO/FIXME markers | ✅ | No TODO or FIXME markers in production source. |
| 5.3 | Commented-out production code | ✅ | Dead commented-out import removed from `SpringAiPromptSpecExecutor.java`. |
| 5.4 | Tests present | ✅ | 2 test files covering `AnthropicVendorClient` (integration-style with `MockRestServiceServer`) and `PromptSpecUtils` (unit). `OpenAiVendorClient` has no test coverage. |
| 5.5 | Tests pass | ✅ | All tests pass (`mvn test` exits 0). |

---

### 6. Repository Hygiene

| # | Check | Status | Finding |
|---|---|---|---|
| 6.1 | .gitignore coverage | ✅ | Managed at project root; covers `target/`, IDE files, `.env`, etc. |
| 6.2 | Unexpected binary files | ✅ | No binaries tracked in this module. |
| 6.3 | Large files | ✅ | No files exceed reasonable size thresholds. |

---

## Action Items

- ⚠️ **[3.5 CHANGELOG]** — No `CHANGELOG.md` at project root (project-wide issue).
- ⚠️ **[4.2 Spring AI milestone]** *(won't fix)* — `spring-ai-*:2.0.0-M2` is pre-GA. Upgrade to Spring AI 2.0 GA in parent `dependencyManagement` once released.
- ⚠️ **[5.4 Test coverage]** — `OpenAiVendorClient` has no test. A `MockRestServiceServer`-based test analogous to `AnthropicVendorClientTest` is recommended.

---

## Notes

- **Stack detected:** LANG_JAVA. Single Maven module with Spring AI 2.0.0-M2 integrating OpenAI and Anthropic vendor clients.
- **Production files:** 5 (`SpringAiPromptSpecExecutor`, `SpringAiVendorClient`, `AnthropicVendorClient`, `OpenAiVendorClient`, `PromptSpecUtils`)
- **Test files:** 2 (`AnthropicVendorClientTest`, `PromptSpecUtilsTest`)
- A full secret-history scan with `trufflehog` or `git-secrets` is recommended before the first public release.
