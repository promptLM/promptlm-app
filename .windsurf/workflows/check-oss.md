---
description: Check a module or the whole project for open-source readiness and produce a structured findings report
---

Check open-source readiness for:

```text
$ARGUMENTS
```

If `$ARGUMENTS` is empty, check the whole project. Otherwise treat `$ARGUMENTS` as a module path relative to the project root (e.g. `components/promptlm-domain`).

Set `TARGET` to the resolved path: `$ARGUMENTS` if provided, otherwise the project root.

---

## Instructions

Work through every check category below **in order**. For each check, use shell commands, file reads, and grep searches to gather evidence. Do **not** skip a check because you assume it will pass — verify it.

After completing all checks, generate a **OSS Readiness Report** (see report format below).

---

## Check Categories

### 1. Legal & Licensing

**1.1 LICENSE file**
Verify a `LICENSE` file exists at `TARGET` or at the project root. Read its first line to confirm the license type (Apache 2.0, MIT, BSD, EPL, etc.). Note the exact license name.

**1.2 Copyright headers in source files**
Scan Java source files under `TARGET/src/main` for copyright/license header comments.
Run: `grep -rL "Copyright\|license\|Licensed" TARGET/src/main/java` (list files WITHOUT a header).
Flag any files missing a header — Apache 2.0 recommends but does not require them; their absence is a WARNING.

**1.3 Dependency license compatibility**
Run `mvn dependency:resolve -f TARGET/pom.xml` (or the root pom if checking the whole project) and collect the list of direct and transitive dependencies.
Then run `mvn license:aggregate-add-third-party -f TARGET/pom.xml` if the `license-maven-plugin` is configured, otherwise list dependencies with `mvn dependency:tree`.
Flag any dependencies under GPL, LGPL, AGPL, CDDL, or proprietary licenses as FAIL. Flag EPL, EUPL, MPL as WARNING (copyleft, may require source disclosure of modifications). All Apache, MIT, BSD, ISC, and similar permissive licenses are PASS.

**1.4 No embedded third-party sources**
Check for vendored third-party source files: `find TARGET/src -name "*.java" | xargs grep -l "originally from\|copied from\|ported from\|licensed under" 2>/dev/null`.
Presence of such files requires a license compatibility review.

---

### 2. Secrets & Security

**2.1 Hardcoded secrets in source code**
Scan all Java, YAML, properties, and JSON files under `TARGET/src` for common secret patterns:
- API keys: `grep -rn "sk-[a-zA-Z0-9]" TARGET/src`
- Tokens/passwords: `grep -rni "password\s*=\s*['\"][^${\s]" TARGET/src`
- Tokens: `grep -rni "(token|apikey|api_key|secret)\s*[:=]\s*['\"][^${\s]" TARGET/src`
- Bearer tokens: `grep -rn "Bearer [a-zA-Z0-9]" TARGET/src`
Flag any match that is not a placeholder (e.g. `${env.MY_KEY}`, `${apiKey}`, `changeit` test values) as FAIL.

**2.2 Secrets in configuration and environment files**
Check for `application.properties`, `application.yml`, `application-*.yml` files in `TARGET/src`.
Read each one and flag any property that has a literal value for keys like `password`, `token`, `api-key`, `secret`.

**2.3 .env excluded from version control**
Check whether `.env` appears in `.gitignore` at the project root or at `TARGET`.
Run: `git -C PROJECT_ROOT check-ignore -v .env`
FAIL if `.env` is tracked: `git -C PROJECT_ROOT ls-files .env`

**2.4 No internal infrastructure references**
Scan `TARGET/src` for hardcoded internal hostnames, private IPs, internal domain patterns:
`grep -rn "localhost\|127\.0\.0\.1\|192\.168\.\|10\.\|\.internal\|\.corp\|\.lan" TARGET/src/main`
Occurrences in test code are a WARNING (acceptable for integration tests but should be documented); occurrences in production code are FAIL.

**2.5 Git history spot-check**
Run `git log --oneline -20` from `TARGET` and `git log --all --oneline --grep="key\|token\|password\|secret" -10` to spot commit messages that hint at accidentally committed secrets.
This is a WARNING signal only — advise running `git-secrets` or `trufflehog` for a full scan.

---

### 3. Documentation

**3.1 README**
Check for `README.md` or `README.adoc` at `TARGET` and at the project root. Read it and verify the presence of:
- Project description / purpose
- Prerequisites / how to build
- How to run or use
- Reference to license
Flag as WARNING if README exists but is missing one of the above sections. Flag as FAIL if no README exists at all.

**3.2 CONTRIBUTING guide**
Check for `CONTRIBUTING.md` at `TARGET` or the project root. Its absence is a WARNING.

**3.3 Code of Conduct**
Check for `CODE_OF_CONDUCT.md` at `TARGET` or the project root. Its absence is a WARNING.

**3.4 Javadoc on public API surface**
Find all public interfaces and public classes in `TARGET/src/main/java`.
Run: `grep -rn "^public \(interface\|class\|enum\|record\)" TARGET/src/main/java | head -40`
For each, check whether the file contains a Javadoc block (`/**`). Flag classes/interfaces with no Javadoc as WARNING.

**3.5 CHANGELOG**
Check for `CHANGELOG.md`, `CHANGELOG.adoc`, or `HISTORY.md` at the project root. Absence is a WARNING.

---

### 4. Build & Dependencies

**4.1 No private Maven repositories required**
Read all `pom.xml` files under `TARGET`. List every `<repository>` and `<pluginRepository>` element.
Flag any repository URL that:
- Is not `repo.maven.apache.org`, `repo1.maven.org`, `repo.spring.io`, `packages.spring.io`, or a well-known public registry
- Points to a private hostname (e.g. internal Nexus/Artifactory that external contributors cannot access)
as FAIL.

**4.2 No SNAPSHOT dependencies on private artifacts**
Run `mvn dependency:tree -f TARGET/pom.xml` and list all `-SNAPSHOT` dependencies.
For each SNAPSHOT: check whether it is published to a public repository. SNAPSHOT dependencies that live only in a private repo block external builds — FAIL.

**4.3 Binary blobs in source control**
Check for committed JAR, WAR, EAR, or class files outside `target/`:
`git -C PROJECT_ROOT ls-files -- "*.jar" "*.war" "*.ear" "*.class" | grep -v "/target/"`
Any result is a FAIL.

**4.4 Standalone build**
Attempt: `mvn clean verify -f TARGET/pom.xml -DskipTests` (or use `build-jdk.sh` at the root for whole-project checks).
Record whether it succeeds. If it fails due to missing private repository artifacts, that is a FAIL.

---

### 5. Code Quality

**5.1 Internal ticket / wiki references**
Scan `TARGET/src` for internal project-management references that reveal non-public context:
`grep -rni "JIRA\|PROJ-[0-9]\|TICKET\|confluence\|\.atlassian\." TARGET/src`
Such references embedded in comments or TODO notes are WARNINGs.

**5.2 Sensitive TODO / FIXME markers**
Run: `grep -rn "TODO\|FIXME\|HACK\|XXX" TARGET/src/main/java`
Flag TODOs that suggest security issues (`TODO: validate input`, `FIXME: remove hardcoded`), broken behaviour, or unfinished critical paths as FAIL. Generic enhancement TODOs are WARNING.

**5.3 Commented-out production code**
`grep -rn "^\s*//" TARGET/src/main/java | grep -v "\* " | wc -l`
A very high ratio of commented-out lines relative to total lines is a WARNING — it may hide sensitive logic or reveal unfinished work.

**5.4 Tests present**
Check that test source exists: `find TARGET/src/test -name "*Test.java" | wc -l`
Zero test files is a FAIL.

**5.5 Tests pass**
Run `mvn test -f TARGET/pom.xml`. Record result as PASS or FAIL.

---

### 6. Repository Hygiene

**6.1 .gitignore coverage**
Read `.gitignore` at the project root and at `TARGET`. Verify that at minimum the following are covered:
- `target/` or `**/target/`
- IDE config dirs (`.idea/`, `.vscode/`, `*.iml`)
- `.env` or `*.env`
- OS metadata (`.DS_Store`)
Missing entries are WARNINGs.

**6.2 Large or unexpected binary files**
Check for tracked binary files that are unlikely to belong in source control:
`git -C PROJECT_ROOT ls-files -- "*.png" "*.jpg" "*.pdf" "*.zip" "*.docx" | grep TARGET`
Unexpected binary files (e.g. documents, screenshots, test data dumps) are WARNINGs. Binary assets explicitly needed by the module (e.g. test fixtures) should be documented.

**6.3 Sensitive file patterns**
`git -C PROJECT_ROOT ls-files -- "*.pem" "*.p12" "*.jks" "*.key" "*.crt" "id_rsa" "*.pfx"`
Any certificate, keystore, or private key tracked in git is a FAIL.

---

## Report Format

Produce the report as structured Markdown using the following template and save it as
`oss-readiness-report-<module-name-or-project>-<YYYY-MM-DD>.md` in the project root.
Print the path to the saved file at the end.

```markdown
# OSS Readiness Report

**Target:** <module path or "whole project">
**Date:** <today>
**Prepared by:** Cascade

---

## Summary

| Category | PASS | WARN | FAIL |
|---|---|---|---|
| 1. Legal & Licensing | n | n | n |
| 2. Secrets & Security | n | n | n |
| 3. Documentation | n | n | n |
| 4. Build & Dependencies | n | n | n |
| 5. Code Quality | n | n | n |
| 6. Repository Hygiene | n | n | n |
| **Total** | **n** | **n** | **n** |

**Overall verdict:** READY TO OSS / NEEDS WORK / NOT READY

---

## Findings

### 1. Legal & Licensing
| # | Check | Status | Finding |
|---|---|---|---|
| 1.1 | LICENSE file | ✅ / ⚠️ / ❌ | <brief explanation> |
| 1.2 | Copyright headers | ✅ / ⚠️ / ❌ | <brief explanation> |
| 1.3 | Dependency licenses | ✅ / ⚠️ / ❌ | <brief explanation> |
| 1.4 | Embedded third-party sources | ✅ / ⚠️ / ❌ | <brief explanation> |

### 2. Secrets & Security
| # | Check | Status | Finding |
|---|---|---|---|
| 2.1 | Hardcoded secrets in source | ✅ / ⚠️ / ❌ | <brief explanation> |
| 2.2 | Secrets in config files | ✅ / ⚠️ / ❌ | <brief explanation> |
| 2.3 | .env excluded from VCS | ✅ / ⚠️ / ❌ | <brief explanation> |
| 2.4 | Internal infrastructure refs | ✅ / ⚠️ / ❌ | <brief explanation> |
| 2.5 | Git history spot-check | ✅ / ⚠️ / ❌ | <brief explanation> |

### 3. Documentation
| # | Check | Status | Finding |
|---|---|---|---|
| 3.1 | README | ✅ / ⚠️ / ❌ | <brief explanation> |
| 3.2 | CONTRIBUTING guide | ✅ / ⚠️ / ❌ | <brief explanation> |
| 3.3 | Code of Conduct | ✅ / ⚠️ / ❌ | <brief explanation> |
| 3.4 | Javadoc on public API | ✅ / ⚠️ / ❌ | <brief explanation> |
| 3.5 | CHANGELOG | ✅ / ⚠️ / ❌ | <brief explanation> |

### 4. Build & Dependencies
| # | Check | Status | Finding |
|---|---|---|---|
| 4.1 | No private Maven repos required | ✅ / ⚠️ / ❌ | <brief explanation> |
| 4.2 | No private SNAPSHOT deps | ✅ / ⚠️ / ❌ | <brief explanation> |
| 4.3 | No binary blobs in VCS | ✅ / ⚠️ / ❌ | <brief explanation> |
| 4.4 | Standalone build | ✅ / ⚠️ / ❌ | <brief explanation> |

### 5. Code Quality
| # | Check | Status | Finding |
|---|---|---|---|
| 5.1 | Internal ticket/wiki refs | ✅ / ⚠️ / ❌ | <brief explanation> |
| 5.2 | Sensitive TODO/FIXME markers | ✅ / ⚠️ / ❌ | <brief explanation> |
| 5.3 | Commented-out production code | ✅ / ⚠️ / ❌ | <brief explanation> |
| 5.4 | Tests present | ✅ / ⚠️ / ❌ | <brief explanation> |
| 5.5 | Tests pass | ✅ / ⚠️ / ❌ | <brief explanation> |

### 6. Repository Hygiene
| # | Check | Status | Finding |
|---|---|---|---|
| 6.1 | .gitignore coverage | ✅ / ⚠️ / ❌ | <brief explanation> |
| 6.2 | Unexpected binary files | ✅ / ⚠️ / ❌ | <brief explanation> |
| 6.3 | Sensitive file patterns | ✅ / ⚠️ / ❌ | <brief explanation> |

---

## Action Items

List only FAIL and WARN findings here as actionable bullets, ordered by severity (FAIL first):

- ❌ **[n.n Check name]** — <what to do>
- ⚠️ **[n.n Check name]** — <what to do>

---

## Notes

Any contextual observations that don't fit neatly into a pass/fail verdict.
```
