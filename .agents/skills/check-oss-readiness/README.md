# OSS Readiness Skill — Design & Architecture

## Purpose

This skill checks a project or module for open-source readiness and walks the
user through fixes interactively. It is designed to work on **any** project —
it never assumes specific tools are installed, but rewards projects that have
automated enforcement configured.

## Standards & Sources

The checks are informed by established open-source readiness standards:

- **OpenSSF Best Practices Badge** (passing criteria) — covers licensing,
  documentation, security, quality, and analysis.
  <https://www.bestpractices.dev/en/criteria/0>
- **FINOS Open Source Readiness Checklists** — corporate compliance program
  components. <https://github.com/finos/osr-checklists>
- **CFPB Open Source Checklist** — pre-release checklist for government OSS.
  <https://github.com/cfpb/open-source-project-template>
- **REUSE Specification (FSFE)** — SPDX-based license header standard.
  <https://reuse.software/spec-3.3/>

## Architecture

```
SKILL.md                          ← agent instructions (orchestration + cross-cutting checks)
scripts/
  check-java.sh   TARGET          ← Java/Maven structural checks
  check-node.sh   TARGET          ← Node/npm/TypeScript structural checks
  check-python.sh TARGET          ← Python/pip structural checks
```

### Separation of concerns

| Layer | Responsibility |
|---|---|
| **SKILL.md** | Language detection, two-tier tool checks (license headers, secrets, CVEs, dependency licenses), documentation & hygiene checks, script orchestration, report generation, interactive fix walkthrough |
| **Language scripts** | Build-system and language-specific structural checks only: API docs (Javadoc/JSDoc/docstrings), private registries, unstable deps, build, tests, static analysis config, .gitignore coverage, pinned versions, commented-out code |

### Two-tier tool check pattern

Cross-cutting concerns (headers, secrets, vulnerabilities, dependency licenses)
use a **two-tier** approach so the skill works on any project:

1. **Tier 1 — Is a tool configured?** Check for config files, CI steps, or
   build-plugin declarations. If nothing is found → **WARN** (the project
   lacks automated enforcement).
2. **Tier 2 — Does the tool pass?** If a tool is configured *and* its binary
   is available, run it. Violations → **FAIL/WARN**. Clean → **PASS**. If the
   binary is not installed, note it in the report and suggest installing.

### Well-known tools (reference, not requirements)

| Concern | Tools to look for |
|---|---|
| License headers | `license-eye` (`.licenserc.yaml`), `license-maven-plugin` (Mycila), REUSE (`reuse lint`) |
| Secret scanning | `gitleaks` (`.gitleaks.toml`), `detect-secrets` (`.secrets.baseline`), `trivy` |
| Vulnerability scanning | `trivy`, OWASP `dependency-check-maven`, `npm audit`, `pip-audit`, Dependabot |
| Dependency licenses | `trivy fs --scanners license`, `license-eye dep check`, `license-checker` (npm), `pip-licenses` |
| Static analysis | Checkstyle, SpotBugs, PMD (Java); ESLint, Biome (JS/TS); Ruff, Pylint, mypy (Python) |

### Script output contract

Each language script outputs one line per check result:

```
CHECK_ID|STATUS|message
```

- `CHECK_ID` — matches the check number in the report (e.g. `3.4`, `4.1`).
- `STATUS` — one of `PASS`, `WARN`, `FAIL`.
- `message` — human-readable detail (file path, count, short description).

Example:

```
3.4|WARN|2 public Java type(s) without Javadoc — first: src/main/java/dev/example/Foo.java
4.1|PASS|No private Maven registries detected
4.2|WARN|1 external SNAPSHOT dependency(ies) — first: org.example:lib:0.1-SNAPSHOT
5.6|WARN|No static analysis plugin found — consider checkstyle, spotbugs, error-prone, or pmd
```

## Check Ownership

### Cross-cutting — in SKILL.md (two-tier tool checks)

| ID   | Check                                   | Severity  |
|------|-----------------------------------------|-----------|
| 1.1  | LICENSE file present                    | FAIL      |
| 1.2  | License header tooling configured       | WARN/FAIL |
| 1.3  | Dependency license scanning configured  | WARN/FAIL |
| 1.4  | No embedded third-party sources         | WARN      |
| 2.1  | Secret scanning tool configured         | WARN/FAIL |
| 2.2  | .env excluded from VCS                  | FAIL      |
| 2.3  | No internal infrastructure references   | FAIL/WARN |
| 2.4  | Git history spot-check                  | WARN      |

### Documentation & Hygiene — in SKILL.md

| ID   | Check                                   | Severity  |
|------|-----------------------------------------|-----------|
| 3.1  | README present and complete             | FAIL/WARN |
| 3.2  | CONTRIBUTING.md                         | WARN      |
| 3.3  | CODE_OF_CONDUCT.md                      | WARN      |
| 3.5  | CHANGELOG                               | WARN      |
| 3.6  | SECURITY.md (vulnerability policy)      | FAIL      |
| 3.7  | CI/CD configuration present             | WARN      |
| 4.6  | Binary blobs in source control          | FAIL      |
| 5.1  | Internal ticket / wiki references       | WARN      |
| 5.2  | Sensitive TODO / FIXME markers          | FAIL/WARN |
| 6.2  | Large or unexpected binary files        | FAIL      |
| 6.3  | PII in source or documentation          | FAIL      |

### Language-specific — in scripts

| ID   | Check                                   | Java              | Node               | Python             |
|------|-----------------------------------------|-------------------|--------------------|---------------------|
| 3.4  | Public API documentation                | Javadoc           | JSDoc              | docstrings          |
| 4.1  | No private registries                   | pom.xml repos     | .npmrc             | pip.conf/pyproject  |
| 4.2  | No unstable / pre-release deps          | SNAPSHOTs         | git+/file: deps    | git+/file: deps     |
| 4.4  | Standalone build succeeds               | `mvn verify`      | `npm ci && build`  | `pip install`       |
| 4.5  | Pinned dependency versions              | no ranges         | no `*`/`latest`    | `==` in requirements|
| 5.3  | Commented-out code (>20%)               | `//` lines        | `//` lines         | `#` lines           |
| 5.4  | Tests present                           | `*Test.java`      | `*.test.ts`        | `test_*.py`         |
| 5.5  | Tests pass                              | `mvn test`        | `npm test`         | `pytest`            |
| 5.6  | Static analysis configured              | checkstyle/spotbugs| eslint/biome      | ruff/pylint         |
| 6.1  | .gitignore coverage                     | `target/`, `*.iml`| `node_modules/`    | `__pycache__/`      |

## Change Log

### 2026-04-08

- **Two-tier tool check pattern** introduced: cross-cutting checks (license
  headers, secrets, CVEs, dependency licenses) now check for tool
  configuration first, then run the tool if available. No tool is assumed to
  be installed — portability across projects.
- **Cross-cutting checks moved to SKILL.md** from language scripts, delegating
  to well-known tools (license-eye, gitleaks, trivy, etc.).
- **Language scripts slimmed down** to structural checks only (API docs,
  registries, deps, build, tests, static analysis, .gitignore).
- **check-python.sh** created.
- **New checks added:** SECURITY.md (3.6), CI/CD config (3.7), PII (6.3).
- **Report Tooling section** added to track which tools were detected/executed.
- **Gradle support** added to language detection.

### 2026-04-07

- **Review fixes applied:** `find` operator precedence, `git ls-files` path
  bug, `10.x` IP pattern narrowed, Javadoc check scoped to public types,
  SNAPSHOT check made verifiable, `setup.cfg` added to LANG_PYTHON,
  commented-code threshold set to 20%, redundant walkthrough step removed.
- **Report format template** added to SKILL.md.
- **Interactive fix walkthrough** updated to use buttons/options.
- **Architecture plan** created: extract language checks into shell scripts.
- **New checks identified** from OpenSSF/FINOS/CFPB/REUSE research.
