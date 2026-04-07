# OSS Readiness Skill — Design & Architecture

## Purpose

This skill checks a project or module for open-source readiness and walks the
user through fixes interactively. It is invoked via the `/check-oss` workflow.

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
SKILL.md                          ← agent instructions (language-agnostic checks + orchestration)
scripts/
  check-java.sh   TARGET          ← Java/Maven specific checks
  check-node.sh   TARGET          ← Node/npm/TypeScript specific checks
  check-python.sh TARGET          ← Python/pip specific checks
```

### Separation of concerns

- **SKILL.md** handles language detection, runs language-agnostic checks
  (LICENSE, SECURITY.md, README, secrets, git hygiene, etc.), invokes the
  appropriate language script(s), collects results, writes the report, and
  drives the interactive fix walkthrough.
- **Language scripts** encapsulate all build-system and language-specific
  logic. They accept `TARGET` as `$1` and print structured result lines.

### Script output contract

Each script outputs one line per check result:

```
CHECK_ID|STATUS|message
```

- `CHECK_ID` — matches the check number in the report (e.g. `1.2`, `4.1`).
- `STATUS` — one of `PASS`, `WARN`, `FAIL`.
- `message` — human-readable detail (file path, line number, short description).

Example:

```
1.2|WARN|Missing copyright header: src/main/java/dev/promptlm/cli/App.java
1.3|PASS|All dependencies use permissive licenses
1.5|WARN|Missing SPDX-License-Identifier: src/main/java/dev/promptlm/cli/App.java
2.6|WARN|1 known vulnerability found — run mvn dependency-check:check for details
4.1|PASS|No private registries
4.2|WARN|SNAPSHOT dependency: dev.promptlm:core:0.1-SNAPSHOT
5.6|WARN|No static analysis plugin configured (checkstyle, spotbugs, errorprone)
```

## Check Categories

### Language-agnostic (in SKILL.md)

| ID   | Check                                   | Fail / Warn |
|------|-----------------------------------------|-------------|
| 1.1  | LICENSE file present                    | FAIL        |
| 1.4  | No embedded third-party sources         | WARN        |
| 2.1  | Hardcoded secrets (common patterns)     | FAIL        |
| 2.3  | .env excluded from VCS                  | FAIL        |
| 2.4  | No internal infrastructure references   | FAIL/WARN   |
| 2.5  | Git history spot-check                  | WARN        |
| 3.1  | README present and complete             | FAIL/WARN   |
| 3.2  | CONTRIBUTING.md                         | WARN        |
| 3.3  | CODE_OF_CONDUCT.md                      | WARN        |
| 3.5  | CHANGELOG                               | WARN        |
| 3.6  | SECURITY.md (vulnerability policy)      | FAIL        |
| 3.7  | CI/CD configuration present             | WARN        |
| 4.3  | Binary blobs in source control          | FAIL        |
| 5.1  | Internal ticket / wiki references       | WARN        |
| 5.2  | Sensitive TODO / FIXME markers          | FAIL/WARN   |
| 6.2  | Large or unexpected binary files        | FAIL        |
| 6.3  | PII in source or documentation          | FAIL        |

### Language-specific (in scripts)

| ID   | Check                                   | Java            | Node             | Python           |
|------|-----------------------------------------|-----------------|------------------|------------------|
| 1.2  | Copyright / license headers             | `*.java`        | `*.ts`, `*.js`   | `*.py`           |
| 1.3  | Dependency license compatibility        | `mvn`           | `npm`/`npx`      | `pip-licenses`   |
| 1.5  | SPDX-License-Identifier in headers      | `*.java`        | `*.ts`, `*.js`   | `*.py`           |
| 2.2  | Secrets in config files                 | `application.*` | `.env.*`, config  | `settings.py`    |
| 2.6  | Known vulnerability scan                | `dependency-check` | `npm audit`   | `pip-audit`      |
| 3.4  | Public API documentation                | Javadoc         | JSDoc            | docstrings       |
| 4.1  | No private registries                   | pom.xml repos   | .npmrc           | pip.conf/pyproject |
| 4.2  | No unstable / private pre-release deps  | SNAPSHOTs       | git+/file: deps  | git+/file: deps  |
| 4.4  | Standalone build succeeds               | `mvn verify`    | `npm ci && build` | `pip install`   |
| 4.5  | Pinned dependency versions              | no ranges       | no `*`/`latest`  | pinned in lock   |
| 5.3  | Commented-out code (>20%)               | `//` lines      | `//` lines       | `#` lines        |
| 5.4  | Tests present                           | `*Test.java`    | `*.test.ts`      | `test_*.py`      |
| 5.5  | Tests pass                              | `mvn test`      | `npm test`       | `pytest`         |
| 5.6  | Static analysis configured              | checkstyle/spotbugs | eslint/prettier | pylint/ruff  |
| 6.1  | .gitignore coverage                     | `target/`, `*.iml` | `node_modules/` | `__pycache__/` |

## Change Log

### 2026-04-07

- **Review fixes applied:** `find` operator precedence, `git ls-files` path
  bug, `10.x` IP pattern narrowed, Javadoc check scoped to public types,
  SNAPSHOT check made verifiable, `setup.cfg` added to LANG_PYTHON,
  commented-code threshold set to 20%, redundant walkthrough step removed.
- **Report format template** added to SKILL.md.
- **Interactive fix walkthrough** updated to use buttons/options (portable
  description, not tool-specific).
- **Architecture plan** created: extract language checks into shell scripts.
- **New checks identified** from OpenSSF/FINOS/CFPB/REUSE research:
  SECURITY.md, CI/CD config, SPDX headers, known CVE scanning, static
  analysis config, pinned versions, PII scanning.
