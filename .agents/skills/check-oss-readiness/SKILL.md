---
name: check-oss-readiness
description: Check module or project for open source readiness and offers fixes to user (3 supporting files)
---
Check open-source readiness for:

```text
$ARGUMENTS
```

If `$ARGUMENTS` is empty, check the whole project. Otherwise, treat `$ARGUMENTS` as a module path relative to the project root (e.g. `components/promptlm-domain`).

Set `TARGET` to the resolved absolute path: `$ARGUMENTS` if provided, otherwise the project root.
Set `PROJECT_ROOT` to the git repository root (`git rev-parse --show-toplevel`).
Set `SKILL_DIR` to the directory containing this SKILL.md file.

---

## Instructions

Work through every check category below **in order**. For each check, use the
specified tools, shell commands, file reads, and grep searches to gather
evidence. Do **not** skip a check because you assume it will pass — verify it.

After completing all checks, generate an **OSS Readiness Report** using the
format defined in the [Report Format](#report-format) section below.

### Design principle: two-tier tool checks

Many checks follow a two-tier pattern:

1. **Tier 1 — Is an appropriate tool configured?**
   Look for config files, CI steps, or build-plugin declarations that show the
   project has automated enforcement. If no tool is configured, that is itself
   a finding (typically WARNING).

2. **Tier 2 — Does the tool pass?**
   If a tool *is* configured, run it and verify it reports no violations.
   Violations are WARN or FAIL depending on severity.

This ensures the skill works on any project — it never assumes a tool is
installed, but rewards projects that have them.

### Well-known tools (reference, not requirements)

| Concern | Tools to look for |
|---|---|
| License headers | `license-eye` (`.licenserc.yaml`), `license-maven-plugin` (Mycila), `licensecheck`, REUSE (`reuse lint`) |
| Secret scanning | `gitleaks` (`.gitleaks.toml`), `detect-secrets` (`.secrets.baseline`), `trufflehog`, `trivy` |
| Vulnerability scanning | `trivy`, OWASP `dependency-check-maven`, `npm audit`, `pip-audit`, Snyk, Dependabot |
| Dependency licenses | `trivy fs --scanners license`, `license-eye dep check`, `license-checker` (npm), `pip-licenses` |
| Static analysis | Checkstyle, SpotBugs, PMD, Error Prone (Java); ESLint, Biome (JS/TS); Ruff, Pylint, mypy (Python) |

---

## Step 0: Language Detection

Before running any checks, detect which languages and build systems are present
in `TARGET`. Run:

```
find TARGET -maxdepth 3 \( -name "pom.xml" -o -name "build.gradle" -o -name "build.gradle.kts" -o -name "package.json" -o -name "pyproject.toml" -o -name "requirements.txt" -o -name "setup.py" -o -name "setup.cfg" \) | grep -v node_modules | grep -v target
```

From the results, set one or more of these flags (can be multiple):
- **LANG_JAVA** — `pom.xml` or `build.gradle(.kts)` present
- **LANG_NODE** — `package.json` present
- **LANG_PYTHON** — `pyproject.toml`, `requirements.txt`, `setup.py`, or `setup.cfg` present

Record the detected stack in the report Notes section.

---

## Check Categories

### 1. Legal & Licensing

**1.1 LICENSE file**
Verify a `LICENSE` (or `LICENSE.txt`, `LICENSE.md`) file exists at `TARGET` or
at `PROJECT_ROOT`. Read its first lines to identify the license type
(Apache-2.0, MIT, BSD-3-Clause, etc.). Note the SPDX identifier.
Absence → FAIL.

**1.2 License header tooling configured** *(two-tier)*
Check whether the project has automated license header enforcement:
- `.licenserc.yaml` → Apache SkyWalking Eyes (`license-eye`)
- `license-maven-plugin` (Mycila) in any `pom.xml`
- `.reuse/dep5` or `LICENSES/` dir → REUSE spec
- `licensecheck` config in `package.json`
- Any equivalent configuration

**Tier 1:** If none found → **WARN** "No automated license header tool
configured — consider license-eye, REUSE, or license-maven-plugin."

**Tier 2:** If a tool is found, run it:
- `license-eye -c .licenserc.yaml header check` (if `.licenserc.yaml` exists)
- `mvn license:check` (if Mycila plugin is configured)
- `reuse lint` (if `.reuse/` or `LICENSES/` exists)

If the tool reports violations → **WARN** with the list of files.
If the tool passes → **PASS**.
If the tool is not installed → report the config as PASS for Tier 1, note that
the tool binary was not available to run Tier 2, and suggest installing it.

**1.3 Dependency license compatibility** *(two-tier)*
Check whether the project has automated dependency-license scanning configured:
- `trivy` in CI config or available on PATH
- `license-eye dep check` config
- `license-checker` in npm devDependencies
- `pip-licenses` in dev requirements
- OWASP `dependency-check-maven` with license goal

**Tier 1:** No tool → **WARN**.
**Tier 2:** Run the available tool. Flag any dependency under GPL, AGPL, CDDL,
or proprietary licenses as **FAIL**. Flag EPL, EUPL, MPL as **WARN**. Apache,
MIT, BSD, ISC → PASS.

**1.4 No embedded third-party sources**
Scan source files for vendoring markers:
```
grep -rn "originally from\|copied from\|ported from" TARGET --include="*.java" --include="*.ts" --include="*.py" 2>/dev/null
```
Exclude `node_modules/`, `venv/`, `target/`, `dist/`.
Presence → **WARN** (requires license compatibility review).

---

### 2. Secrets & Security

**2.1 Secret scanning tool configured** *(two-tier)*
Check whether the project has automated secret scanning:
- `.gitleaks.toml` or `.gitleaksrc` → gitleaks
- `.secrets.baseline` → detect-secrets (Yelp)
- `.pre-commit-config.yaml` containing `detect-secrets` or `gitleaks`
- `trivy` in CI with `--scanners secret`
- GitHub Advanced Security / secret scanning enabled

**Tier 1:** No tool → **WARN** "No automated secret scanning configured —
consider gitleaks, detect-secrets, or trivy."

**Tier 2:** If a tool is found and installed, run it:
- `gitleaks detect --no-git --source TARGET` (filesystem scan)
- `detect-secrets scan TARGET`
- `trivy fs --scanners secret TARGET`

Findings → **FAIL**. Clean → **PASS**.
If tool binary not installed → note in report, suggest installing.

**2.2 .env excluded from version control**
Check whether `.env` appears in `.gitignore`:
```
git -C PROJECT_ROOT check-ignore -v .env
```
FAIL if `.env` is tracked: `git -C PROJECT_ROOT ls-files .env`

**2.3 No internal infrastructure references**
Scan production source files in `TARGET` for hardcoded internal hostnames,
private IPs, or internal domain patterns:
```
grep -rn "localhost\|127\.0\.0\.1\|192\.168\.[0-9]\|10\.[0-9]\+\.[0-9]\+\.[0-9]\+\|\.internal\|\.corp\|\.lan" TARGET
```
Exclude `node_modules/`, `venv/`, `target/`, `dist/`, test directories.
Production code → **FAIL**. Test code only → **WARN**.

**2.4 Git history spot-check**
```
git log --all --oneline --grep="key\|token\|password\|secret" -10
```
This is a **WARN** signal only — advise running a full history scan with
gitleaks or trufflehog.

---

### 3. Documentation

**3.1 README**
Check for `README.md` or `README.adoc` at `TARGET` and at `PROJECT_ROOT`.
Verify presence of: project description, prerequisites/build instructions,
usage instructions, license reference.
Missing README → **FAIL**. Incomplete → **WARN**.

**3.2 CONTRIBUTING guide**
Check for `CONTRIBUTING.md` at `TARGET` or `PROJECT_ROOT`. Absence → **WARN**.

**3.3 Code of Conduct**
Check for `CODE_OF_CONDUCT.md`. Absence → **WARN**.

**3.4 Public API documentation**
*Delegated to language scripts* — the scripts check for Javadoc, JSDoc, or
Python docstrings. See [Step 2](#step-2-run-language-specific-scripts).

**3.5 CHANGELOG**
Check for `CHANGELOG.md`, `CHANGELOG.adoc`, or `HISTORY.md` at
`PROJECT_ROOT`. Absence → **WARN**.

**3.6 SECURITY.md — vulnerability reporting policy**
Check for `SECURITY.md` at `PROJECT_ROOT`. This file should describe how to
report security vulnerabilities (OpenSSF requirement `vulnerability_report_process`).
Absence → **FAIL**.

**3.7 CI/CD configuration present**
Check for at least one of:
- `.github/workflows/*.yml`
- `.gitlab-ci.yml`
- `Jenkinsfile`
- `.circleci/config.yml`
- `.travis.yml`
- `azure-pipelines.yml`

Absence → **WARN** (OpenSSF recommends continuous integration).

---

### 4. Build & Dependencies

**4.1–4.5 Language-specific build checks**
*Delegated to language scripts* — private registries, SNAPSHOT/unstable deps,
standalone build, pinned versions. See [Step 2](#step-2-run-language-specific-scripts).

**4.6 Binary blobs in source control**
```
git -C PROJECT_ROOT ls-files | grep -E "\.(jar|war|ear|class|pyc|pyo|egg|whl|tgz|zip|node)$"
```
Any result → **FAIL**.

---

### 5. Code Quality

**5.1 Internal ticket / wiki references**
```
grep -rni "JIRA\|PROJ-[0-9]\|TICKET\|confluence\|\.atlassian\." TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.js" --include="*.md"
```
Exclude build output dirs. Findings → **WARN**.

**5.2 Sensitive TODO / FIXME markers**
```
grep -rn "TODO\|FIXME\|HACK\|XXX" TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.js"
```
Exclude test dirs and build output. Security-related TODOs → **FAIL**.
Generic → **WARN**.

**5.3–5.6 Language-specific quality checks**
*Delegated to language scripts* — commented-out code, tests present, tests
pass, static analysis config. See [Step 2](#step-2-run-language-specific-scripts).

---

### 6. Repository Hygiene

**6.1 .gitignore coverage**
*Delegated to language scripts* (each checks for language-specific entries).
Also verify these universal entries in `.gitignore`:
`.env`, `.DS_Store`, `.idea/`, `.vscode/`
Missing → **WARN**.

**6.2 Large or unexpected binary files**
```
git -C TARGET ls-files -- "*.png" "*.jpg" "*.pdf" "*.zip" "*.docx"
```
Unexpected binary files (documents, spreadsheets, compiled artifacts) → **FAIL**.

**6.3 PII in source or documentation**
Scan for patterns suggesting personally identifiable information:
```
grep -rni "social.security\|SSN\|date.of.birth\|passport" TARGET --include="*.java" --include="*.ts" --include="*.py" --include="*.md" --include="*.json"
```
Exclude test fixtures with clearly synthetic data. Real PII → **FAIL**.

---

## Step 2: Run Language-Specific Scripts

After completing the checks above, run the appropriate language script(s) from
`SKILL_DIR/scripts/`. Each script accepts `TARGET` as its first argument and
outputs structured `CHECK_ID|STATUS|message` lines.

```bash
# Java / Maven
if LANG_JAVA; then
  bash "$SKILL_DIR/scripts/check-java.sh" "$TARGET"
fi

# Node / npm / TypeScript
if LANG_NODE; then
  bash "$SKILL_DIR/scripts/check-node.sh" "$TARGET"
fi

# Python
if LANG_PYTHON; then
  bash "$SKILL_DIR/scripts/check-python.sh" "$TARGET"
fi
```

Parse each output line and merge the results into the report. The scripts cover
these checks: 3.4, 4.1, 4.2, 4.4, 4.5, 5.3, 5.4, 5.5, 5.6, 6.1.

---

## Report Format

Write the report to a file named `oss-readiness-report-<target-name>-<YYYY-MM-DD>.md` in `PROJECT_ROOT`.

```markdown
# OSS Readiness Report — <target> (<YYYY-MM-DD>)

## Summary
| Category               | Status             |
|------------------------|--------------------|
| 1. Legal & Licensing   | PASS / WARN / FAIL |
| 2. Secrets & Security  | PASS / WARN / FAIL |
| 3. Documentation       | PASS / WARN / FAIL |
| 4. Build & Dependencies| PASS / WARN / FAIL |
| 5. Code Quality        | PASS / WARN / FAIL |
| 6. Repository Hygiene  | PASS / WARN / FAIL |

## Findings

For each check that is not PASS, list:
- **[check id] [check name]** — `FAIL` or `WARNING`
  - Evidence: (file path / line number / command output excerpt)
  - Suggested fix: (one sentence)

## Tooling

List which tools were detected as configured and whether they were executed:
| Tool | Configured | Executed | Result |
|------|-----------|----------|--------|
| license-eye | yes/no | yes/no/not-installed | PASS/FAIL/n/a |
| gitleaks | yes/no | yes/no/not-installed | PASS/FAIL/n/a |
| trivy | yes/no | yes/no/not-installed | PASS/FAIL/n/a |
| ... | ... | ... | ... |

## Notes
- Detected stack: (LANG_JAVA / LANG_NODE / LANG_PYTHON)
- Target: (resolved TARGET path)
- Project root: (resolved PROJECT_ROOT path)
```

---

## After the Report: Interactive Fix Walkthrough

After writing the report file, **do not stop**. Walk the user through every
FAIL and WARNING item interactively, in priority order (FAILs first, then
WARNINGs).

For each item:

1. **State the problem** in one sentence, referencing the exact file and line.
2. **Propose a concrete fix** — show the exact change (code snippet, config
   snippet, or shell command) that would resolve it.
3. **Ask the user what to do** by presenting four mutually exclusive choices.
   Use interactive buttons or option selectors if the environment supports
   them; otherwise present a numbered list. Wait for the user's response.

   - **Apply fix** — Apply the proposed fix now.
   - **Skip** — Leave this item unchanged and move to the next one.
   - **Apply all remaining** — Apply this and all subsequent fixes without asking.
   - **Stop** — Stop the walkthrough and summarise what was done so far.

4. **Act on the response**:
   - *Apply fix*: apply the edit, confirm, move to next.
   - *Skip*: note as skipped, move to next.
   - *Apply all remaining*: apply all remaining fixes, then summarise.
   - *Stop*: give final summary and halt.

Rules:
- One problem, one fix per proposal.
- If a fix requires information you don't have, ask before presenting choices.
- If a fix is outside the codebase (e.g. "install gitleaks"), state it as a
  manual step and move on.
- After all items are addressed, give a one-sentence summary of what was fixed
  and what remains.