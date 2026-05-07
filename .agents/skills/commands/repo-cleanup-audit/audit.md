---
description: Strictly read-only audit of a Git repository — branches, worktrees, stashes, tags, remotes, suspicious paths, large blobs, and GitHub issues — producing a prioritized cleanup report and a self-contained handoff document. Optional first arg is the repo path; pass --quick to sample large lists.
argument-hint: [<repo-path>] [--quick]
allowed-tools: Bash(git:*) Bash(gh:*) Bash(jq:*) Bash(bash:*) Bash(.claude/commands/repo-cleanup-audit/scripts/*) Read Write
---

You are running a **strictly read-only** repository audit.

**Arguments:** $ARGUMENTS

## Read-only contract

This command must not mutate the repository, working tree, Git history,
remotes, worktrees, GitHub state, or any file outside the announced output
directory. The bundled `scripts/audit.sh` enforces this internally; you must
also avoid running any forbidden command yourself. The full forbidden /
allowed list is in `@.claude/commands/repo-cleanup-audit/PROCEDURE.md` under
"Read-only command policy".

## Repo state (preloaded)

- Working directory: !`pwd`
- Inside a git repo: !`git rev-parse --is-inside-work-tree 2>/dev/null || echo false`
- Current branch: !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(unknown)"`
- HEAD SHA: !`git rev-parse HEAD 2>/dev/null || echo "(unknown)"`
- Status (porcelain v2):
!`git status --porcelain=v2 --branch 2>/dev/null || echo "(not a git repo)"`
- gh auth: !`command -v gh >/dev/null 2>&1 && gh auth status 2>&1 | head -n 3 || echo "gh absent"`

## Procedure

Follow the workflow at @.claude/commands/repo-cleanup-audit/PROCEDURE.md
from step 1 (Sanity check) through step 6 (Produce the handoff document)
and the final Validation checklist.

**Helper script** (read-only data collector):

- `.claude/commands/repo-cleanup-audit/scripts/audit.sh <repo-path> <output-dir> [--quick]`
  - Writes plain-text fact files under `<output-dir>/facts/`.
  - Snapshots HEAD and `git status` before and after; aborts non-zero if
    either changed.
  - Refuses to exec any forbidden command (exit 99).

## What to do

1. Parse `$ARGUMENTS`:
   - First non-flag token, if present, is the repo path. Otherwise use
     the current working directory.
   - If `--quick` is present, pass it through to the script.
2. Propose an output directory (default: a fresh subdirectory under the
   system temp dir, e.g. `/tmp/repo-cleanup-audit-<timestamp>/`) and
   announce it explicitly before writing anything.
3. Invoke the helper script with the resolved repo path and output dir.
4. Read the fact files under `<output-dir>/facts/`.
5. Classify and risk-rate findings as described in PROCEDURE.md (steps 3–4).
6. Write `<output-dir>/REPORT.md` and `<output-dir>/HANDOFF.md` following
   the example skeletons in PROCEDURE.md.
7. Print a final console summary listing the three deliverables (facts dir,
   REPORT.md, HANDOFF.md) and a one-paragraph overview.
8. Run the Validation checklist from PROCEDURE.md before reporting "done".
   Confirm HEAD and `git status --porcelain=v2 --branch` match the
   pre-invocation snapshot above.

Begin with step 1.
