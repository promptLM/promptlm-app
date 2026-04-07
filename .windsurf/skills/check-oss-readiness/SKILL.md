---
name: check-oss-readiness
description: Check module or project for open source readiness and offers fixes to user
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

## Step 0: Language Detection

Before running any checks, detect which languages and build systems are present in `TARGET`. Run:

```
find TARGET -maxdepth 3 -name "pom.xml" -o -name "package.json" -o -name "pyproject.toml" -o -name "requirements.txt" -o -name "setup.py" -o -name "setup.cfg" | grep -v node_modules | grep -v target
```

From the results, set one or more of these flags (can be multiple):
- **LANG_JAVA** — `pom.xml` present
- **LANG_NODE** — `package.json` present
- **LANG_PYTHON** — `pyproject.toml`, `requirements.txt`, or `setup.py` present

Also identify the primary source directories:
- Java: `src/main/java` under each Maven module
- Node/TypeScript: `src/` directories next to `package.json`, excluding `node_modules/` and `dist/`
- Python: package directories next to `pyproject.toml`/`setup.py`, excluding `venv/`, `.venv/`, `__pycache__/`

Record the detected stack in the report Notes section.

---

## Check Categories

### 1. Legal & Licensing

**1.1 LICENSE file**
Verify a `LICENSE` file exists at `TARGET` or at the project root. Read its first line to confirm the license type (Apache 2.0, MIT, BSD, EPL, etc.). Note the exact license name.

**1.2 Copyright headers in source files**
Scan all source files for copyright/license header comments. Apply the pattern per detected language:
- **Java** (LANG_JAVA): `grep -rL "Copyright\|license\|Licensed" TARGET/src/main/java --include="*.java"`
- **TypeScript/JavaScript** (LANG_NODE): `grep -rL "Copyright\|license\|Licensed" TARGET/src --include="*.ts" --include="*.tsx" --include="*.js"` (exclude `node_modules/`, `dist/`)
- **Python** (LANG_PYTHON): `grep -rL "Copyright\|license\|Licensed" TARGET --include="*.py"` (exclude `venv/`, `.venv/`, `__pycache__/`)

Flag files missing a header as WARNING — recommended for Apache 2.0, expected for MIT/BSD.

**1.3 Dependency license compatibility**
Check dependencies per detected build system:
- **Java** (LANG_JAVA): `mvn dependency:tree -f TARGET/pom.xml` (or root pom for whole-project). If `license-maven-plugin` is configured, run `mvn license:aggregate-add-third-party`.
- **Node** (LANG_NODE): `npm ls --all --json` inside each directory with a `package.json`, or read `package.json` / `package-lock.json` directly. If `license-checker` is installed: `npx license-checker --summary`.
- **Python** (LANG_PYTHON): Read `requirements.txt`, `pyproject.toml`, or `setup.py`. If `pip-licenses` is available: `pip-licenses --format=table`.

Flag any dependency under GPL, LGPL, AGPL, CDDL, or proprietary licenses as FAIL. Flag EPL, EUPL, MPL as WARNING. Apache, MIT, BSD, ISC, and similar permissive licenses are PASS.

**1.4 No embedded third-party sources**
Scan all source files for vendoring markers:
`grep -rn "originally from\|copied from\|ported from\|licensed under" TARGET --include="*.java" --include="*.ts" --include="*.py" 2>/dev/null`
Exclude `node_modules/`, `venv/`, `.venv/`, `target/`.
Presence of such files requires a license compatibility review.

---

### 2. Secrets & Security

**2.1 Hardcoded secrets in source code**
Scan all source and config files under `TARGET` for common secret patterns. Exclude build output dirs (`target/`, `dist/`, `build/`, `node_modules/`, `venv/`, `.venv/`, `__pycache__/`):
- API keys: `grep -rn "sk-[a-zA-Z0-9]" TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.js"`
- Bearer tokens: `grep -rn "Bearer [a-zA-Z0-9]" TARGET`
- Passwords/secrets as literals: `grep -rni "password\s*=\s*[^${ ]" TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.yml" --include="*.yaml" --include="*.properties" --include="*.toml" --include="*.json"`
- Common secret key names: `grep -rni "(api_key|apikey|secret_key|auth_token|access_token)\s*[:=]\s*[^${ ]" TARGET`

Flag any match that is not a placeholder (e.g. `${env.MY_KEY}`, `os.environ[...]`, `process.env.`, `changeit`) as FAIL.

**2.2 Secrets in configuration and environment files**
Check for config files per detected stack:
- **Java**: `application.properties`, `application*.yml` in `TARGET/src`
- **Node**: `.env.*` files, `config/*.json`, `config/*.js`
- **Python**: `config.py`, `settings.py`, `config/*.yaml`

Read each one and flag any key like `password`, `token`, `api-key`, `secret`, `private_key` that has a literal (non-placeholder) value as FAIL.

**2.3 .env excluded from version control**
Check whether `.env` appears in `.gitignore` at the project root or at `TARGET`.
Run: `git -C PROJECT_ROOT check-ignore -v .env`
FAIL if `.env` is tracked: `git -C PROJECT_ROOT ls-files .env`

**2.4 No internal infrastructure references**
Scan all production source files in `TARGET` for hardcoded internal hostnames, private IPs, or internal domain patterns:
`grep -rn "localhost\|127\.0\.0\.1\|192\.168\.\|10\.\|\.internal\|\.corp\|\.lan" TARGET`
Exclude `node_modules/`, `venv/`, `.venv/`, `target/`, `dist/`, test directories.
Occurrences in test code are WARNING (acceptable for integration tests but should be documented); occurrences in production code are FAIL.

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

**3.4 Public API documentation**
Check per detected language:
- **Java** (LANG_JAVA): `grep -rL "/\*\*" TARGET/src/main/java --include="*.java"` to find public classes/interfaces without Javadoc.
- **TypeScript** (LANG_NODE): `grep -rL "/\*\*" TARGET/src --include="*.ts"` (excluding `node_modules/`, `dist/`). Check for JSDoc on exported functions/classes.
- **Python** (LANG_PYTHON): `grep -rn "^def \|^class " TARGET --include="*.py"` and check whether each is preceded by a docstring (`"""`). Exclude `venv/`, `.venv/`.

Flag public API types/functions with no documentation as WARNING.

**3.5 CHANGELOG**
Check for `CHANGELOG.md`, `CHANGELOG.adoc`, or `HISTORY.md` at the project root. Absence is a WARNING.

---

### 4. Build & Dependencies

**4.1 No private package registries required**
Check per detected build system:
- **Java** (LANG_JAVA): Read all `pom.xml` files under `TARGET`. List every `<repository>` and `<pluginRepository>` URL. Flag any URL that is not a well-known public registry (`repo1.maven.org`, `repo.spring.io`, `packages.spring.io`, Maven Central) and requires authentication (e.g. private GitHub Packages, internal Nexus/Artifactory) as FAIL.
- **Node** (LANG_NODE): Check `.npmrc` files for `registry=` entries. Flag any non-`registry.npmjs.org` registry that is private as FAIL.
- **Python** (LANG_PYTHON): Check `pip.conf`, `pyproject.toml` `[tool.poetry.source]`, or `setup.cfg` for custom index URLs. Flag private PyPI mirrors as FAIL.

**4.2 No unstable or private pre-release dependencies**
Check per build system:
- **Java**: List all `-SNAPSHOT` dependencies from `mvn dependency:tree`. Flag any SNAPSHOT that only exists in a private registry as FAIL.
- **Node**: Check `package.json` for `git+`, `github:`, `file:`, or `link:` dependency URLs — these block clean installs for external contributors (FAIL if private, WARNING if public git).
- **Python**: Check for `git+`, `file://`, or VCS dependencies in `requirements.txt` or `pyproject.toml` (WARNING if public, FAIL if private).

**4.3 Binary blobs in source control**
Check for committed build artifacts:
`git -C PROJECT_ROOT ls-files | grep -E "\.(jar|war|ear|class|pyc|pyo|egg|whl|tgz|zip|node)$" | grep -vE "/target/|/dist/|/__pycache__/"`
Any result is a FAIL.

**4.4 Standalone build**
Attempt a clean build per detected stack (skip tests):
- **Java**: `mvn clean verify -f TARGET/pom.xml -DskipTests` (or `build-jdk.sh` at the root for whole-project checks)
- **Node**: `npm ci && npm run build` inside each `package.json` directory
- **Python**: `pip install -e TARGET` or `pip install -r requirements.txt`

Record whether each succeeds. Failure due to missing private registry credentials is a FAIL.

---

### 5. Code Quality

**5.1 Internal ticket / wiki references**
Scan all source and doc files in `TARGET` for internal project-management references that reveal non-public context:
`grep -rni "JIRA\|PROJ-[0-9]\|TICKET\|confluence\|\.atlassian\." TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.js" --include="*.md"`
Exclude `node_modules/`, `venv/`, `.venv/`, `target/`, `dist/`.
Such references in comments or TODO notes are WARNINGs.

**5.2 Sensitive TODO / FIXME markers**
Scan production source files:
`grep -rn "TODO\|FIXME\|HACK\|XXX" TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.js"`
Exclude test directories and `node_modules/`, `venv/`, `.venv/`.
Flag TODOs that suggest security issues, broken behaviour, or unfinished critical paths as FAIL. Generic enhancement TODOs are WARNING.

**5.3 Commented-out production code**
Count comment-only lines in production source per language:
- **Java/TypeScript/JavaScript**: `grep -rn "^\s*//" TARGET --include="*.java" --include="*.ts" --include="*.js" | grep -v "\* " | wc -l`
- **Python**: `grep -rn "^\s*#" TARGET --include="*.py" | wc -l`

A very high ratio of commented-out lines to total lines is a WARNING — it may hide sensitive logic or signal unfinished work.

**5.4 Tests present**
Check per detected stack:
- **Java**: `find TARGET/src/test -name "*Test.java" | wc -l`
- **Node**: `find TARGET -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" -o -name "*.spec.js" | grep -v node_modules | wc -l`
- **Python**: `find TARGET -name "test_*.py" -o -name "*_test.py" | grep -vE "venv|.venv" | wc -l`

Zero test files for any detected language is a FAIL.

**5.5 Tests pass**
Run tests per detected stack:
- **Java**: `mvn test -f TARGET/pom.xml`
- **Node**: `npm test` inside each `package.json` directory
- **Python**: `pytest TARGET` or `python -m pytest`

Record each result as PASS or FAIL.

---

### 6. Repository Hygiene

**6.1 .gitignore coverage**
Read `.gitignore` at the project root and at `TARGET`. Verify that entries appropriate for the detected stack are present:
- **All stacks**: `.env` / `*.env`, `.DS_Store`, `.idea/`, `.vscode/`
- **Java**: `target/` or `**/target/`, `*.iml`
- **Node**: `node_modules/`, `dist/`, `*.js.map` (if TypeScript), `coverage/`
- **Python**: `__pycache__/`, `*.pyc`, `*.pyo`, `venv/`, `.venv/`, `*.egg-info/`, `dist/`, `.pytest_cache/`

Missing entries are WARNINGs.

**6.2 Large or unexpected binary files**
Check for tracked binary files that are unlikely to belong in source control:
`git -C PROJECT_ROOT ls-files -- "*.png" "*.jpg" "*.pdf" "*.zip" "*.docx" | grep TARGET`
Unexpected binary files (e.g. documents