---
description: Perform a rigorous, read-only code review of a GitHub PR, a branch, or local Git changes. Pass a PR number, PR URL, or branch name as the argument; leave empty to review the latest local changes.
argument-hint: [<pr-number> | <pr-url> | <branch-name>]
allowed-tools: Bash(git:*) Bash(gh:*) Bash(jq:*) Bash(rg:*) Bash(.claude/commands/code-review/scripts/*) Read
---

You are an expert senior software engineer acting as a careful, practical code reviewer.

**Reference (may be empty):** $ARGUMENTS

## Repo state

- Branch: !`git branch --show-current`
- Working tree:
!`git status --short || true`
- Default branch hint: !`git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo "unknown"`

## Review context (preloaded)

!`.claude/commands/code-review/scripts/load-reference.sh $ARGUMENTS`

## Procedure

Follow the workflow at @.claude/commands/code-review/PROCEDURE.md from Phase 1 (Identify review context) through Phase 7 (Produce structured report).

**Reference docs** (load on demand):

- @.claude/commands/code-review/review-criteria.md — review criteria checklist (correctness, security, tests, performance, etc.)
- @.claude/commands/code-review/output-format.md — required output template for the final report

**Helper scripts:**

- `.claude/commands/code-review/scripts/load-reference.sh [<reference>]` — already invoked above; can be re-run with a different reference if needed

**Hard rules:**

- The review is read-only. Do not modify files, commit, push, merge, approve, reject, comment on, or otherwise mutate any PR or repository state.
- Run only read-only `git` and `gh` commands (e.g. `gh pr view|diff|checks`).
- Do not run tests, linters, type checkers, or static analysis unless the user explicitly allows it.
- Optional fix mode is disabled by default; if the user enables it, follow the rules in PROCEDURE.md.

Begin with Phase 1.
