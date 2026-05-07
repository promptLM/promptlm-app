# Developer Guide

Technical details for working on the agentskills repository itself.

## Repository structure

```
.github/workflows/
  update-readme.yml        ← CI: regenerates skills table on push to main
hooks/
  pre-commit               ← Git hook: regenerates skills table before commit
scripts/
  update-skill-table.sh    ← Core script: parses SKILL.md front matter → README table
skills/
  <skill-name>/
    SKILL.md               ← Skill definition (YAML front matter + Markdown body)
    README.md              ← Optional: architecture / design notes
    scripts/               ← Optional: supporting shell scripts
install.sh                 ← Consumer-facing installer (curl | bash)
```

## Auto-generated skills table

The **Skills** section in `README.md` is generated automatically from the YAML
front matter (`name`, `description`) of every `skills/*/SKILL.md` file.

The table lives between two HTML comment markers:

```markdown
<!-- SKILL_TABLE_START -->
| Skill | Description |
|---|---|
| ... | ... |
<!-- SKILL_TABLE_END -->
```

**Do not edit the table by hand** — it will be overwritten.

### How it works

`scripts/update-skill-table.sh`:

1. Finds every `skills/*/SKILL.md`.
2. Extracts `name` and `description` from the YAML front matter.
3. Builds a Markdown table.
4. Replaces everything between the `<!-- SKILL_TABLE_START -->` and
   `<!-- SKILL_TABLE_END -->` markers in `README.md`.

The script is idempotent — running it twice produces the same output.

### When it runs

| Trigger | Mechanism | File |
|---|---|---|
| **Before each commit** (local) | Git pre-commit hook | `hooks/pre-commit` |
| **On push to main** (CI) | GitHub Actions workflow | `.github/workflows/update-readme.yml` |

The pre-commit hook only fires when a `SKILL.md` file is staged. The CI
workflow is a safety net in case the hook was bypassed (e.g. `--no-verify`).

## Setting up the pre-commit hook

After cloning, activate the hook:

```bash
ln -sf ../../hooks/pre-commit .git/hooks/pre-commit
```

This is a one-time step per clone.

## Running the script manually

```bash
bash scripts/update-skill-table.sh
```

## Adding a new skill

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor-facing guide. The
short version:

1. Create `skills/<name>/SKILL.md` with `name` and `description` in the YAML
   front matter.
2. Commit — the hook updates the README table automatically.

## install.sh

The consumer-facing installer downloads only the `skills/` directory from this
repo and places it at `.agents/skills/` in the target project. It supports
branch names and tags as the first argument (default: `main`). It tries the
branch archive URL first, then falls back to the tag archive URL.
