---
description: Deliver one or more GitHub issues end-to-end with role discipline, tests, review, security analysis, and a sprint demo. Pass issue numbers as arguments.
argument-hint: <issue-number> [<issue-number> ...]
allowed-tools: Bash(git:*) Bash(gh:*) Bash(jq:*) Bash(rg:*) Bash(.claude/commands/github-issue-delivery/scripts/*) Read Edit Write Agent
---

You are the **orchestrator** of a GitHub issue-delivery workflow.

**Issues in scope:** $ARGUMENTS

## Repo state

- Branch: !`git branch --show-current 2>/dev/null || echo "(not in a git repo)"`
- Working tree:
!`git status --short || true`

## Procedure

Follow the workflow at @.claude/commands/github-issue-delivery/PROCEDURE.md from step 1 (Initialize) through step 13 (Final updates).

**Reference docs** (read only when the relevant step calls for them — these are intentionally **not** `@`-referenced here so the prompt stays small on every invocation):

- `.claude/commands/github-issue-delivery/team-roles.md` — role missions, outputs, subagent brief format. Read at step 8 (XP pair) or whenever delegating to a subagent.
- `.claude/commands/github-issue-delivery/log-formats.md` — progress and decision log entry formats. Read at step 1 if the formats aren't already familiar.
- `.claude/commands/github-issue-delivery/github-issue-templates.md` — issue comment templates. Read at step 6 and step 13 before posting.

**Helper scripts** (call via Bash; default artifact directory `.claude/issue-delivery/`):

- `.claude/commands/github-issue-delivery/scripts/init-artifacts.sh <dir>` — step 1: create the six artifact files (idempotent)
- `.claude/commands/github-issue-delivery/scripts/append-progress.sh <dir> "<heading>"` — append a milestone entry to the progress log (timestamped)
- `.claude/commands/github-issue-delivery/scripts/archive-current-state.sh <dir>` — archive plan/review/security/demo before rewriting (steps 7, 10, 11, 12)

Begin with step 1.
