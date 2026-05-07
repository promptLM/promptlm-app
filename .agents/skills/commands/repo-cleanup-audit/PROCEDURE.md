# Repo Cleanup Audit — Procedure (Read-Only)

This is the canonical, agent-neutral procedure for the `repo-cleanup-audit`
slash command. It guides any capable coding agent through a strictly
read-only audit of a software repository: branches, remotes, worktrees,
history, on-disk hygiene risks, and (when available) GitHub issues. The
output is a prioritized cleanup report and a handoff document so a human,
another agent, or a follow-up chat can decide what to clean up.

## When to invoke

Invoke this command when any of the following is true:

- The user asks for a "repo audit", "branch cleanup", "stale branch review",
  "worktree review", "git hygiene check", or "what should I delete?".
- The user asks for a handoff or status report describing the state of a
  repository before cleanup, archival, or a major refactor.
- The user mentions large or suspicious files in history, leaked secrets,
  ignored files, dangling branches, or orphan worktrees.
- The user wants a triage of open GitHub issues alongside repo state.

Do **not** invoke this command for active development tasks (writing code,
fixing bugs, modifying configuration). This command produces *findings*,
not changes.

## Read-only command policy (CRITICAL)

This command is **strictly read-only**. The agent must not run any command
that mutates the repository, working tree, Git history, configuration,
remotes, worktrees, GitHub state (issues, labels, milestones, PRs,
releases), or any file outside a clearly-marked temporary report directory.

### Forbidden commands (non-exhaustive)

The following commands and their variants are forbidden during this command,
even with `--dry-run` flags, even "just to test":

- `git branch -d`, `git branch -D`, `git branch --move`, `git branch -m`
- `git push`, `git push --delete`, `git push --force*`
- `git worktree add`, `git worktree remove`, `git worktree prune`
- `git clean` (any flags)
- `git reset` (any flags)
- `git checkout`, `git switch`, `git restore`
- `git merge`, `git rebase`, `git cherry-pick`, `git revert`
- `git commit`, `git add`, `git rm`, `git mv`
- Bare `git stash` (which is an alias for `git stash push`), and the write subcommands `push`/`save`/`pop`/`drop`/`apply`/`create`/`store`/`clear`. Only `git stash list` and `git stash show` are allowed.
- `git tag` writes (`-d`, `-f`, creating tags); `git tag` listing is allowed
- `git remote add`, `git remote remove`, `git remote set-url`
- `git config` writes; `git config --get*`/`--list` is allowed
- `git gc`, `git prune`, `git repack`
- `git fetch`, `git pull` (these mutate refs and the object database)
- `gh issue close`, `gh issue edit`, `gh issue comment`, `gh issue create`
- `gh label create`, `gh label edit`, `gh label delete`
- `gh pr merge`, `gh pr close`, `gh pr edit`, `gh pr create`, `gh pr comment`, `gh pr checkout`
- `gh release` writes, `gh repo edit`, `gh repo delete`, `gh api -X POST|PUT|PATCH|DELETE` (case-insensitive, including `--method` and `-X=` forms)
- Any shell command that writes outside a single temporary directory the
  agent itself created and announced
- Any installer (`pip install`, `npm install`, `apt-get install`, etc.)

### Allowed commands

Only read-style commands are permitted. Examples:

- `git status`, `git status --porcelain=v2 --branch`
- `git branch -a -vv`, `git branch --merged`, `git branch --no-merged`
- `git for-each-ref`, `git rev-list --count`, `git log --oneline`
- `git remote -v`, `git remote show <name>` (this hits the network read-only)
- `git worktree list`
- `git stash list`
- `git tag --list`, `git describe --tags --always`
- `git ls-files`, `git ls-tree`, `git rev-parse`, `git show --stat`
- `git config --get`, `git config --list`
- `git diff --stat <a>...<b>` and other plain `git diff` invocations (read-only)
- `git fsck` (read-only integrity check)
- `gh auth status`, `gh issue list`, `gh issue view`, `gh pr list`,
  `gh pr view`, `gh repo view`, `gh api -X GET ...`
- POSIX read tools: `ls`, `find ... -print`, `grep`, `awk`, `sed -n`,
  `sort`, `uniq`, `comm`, `wc`, `du`, `stat`, `file`, `cat` (small files)

If a command is not on this allowed list and the agent is unsure, the agent
must skip it and record it as a manual follow-up step in the report rather
than running it speculatively.

### Network policy

`git remote show` and `gh` commands read from the network. They are allowed
because they do not mutate state. However, if `gh auth status` reports
unauthenticated, the agent must skip GitHub-specific checks and note that
they were skipped in the report — never prompt for credentials and never
attempt to authenticate.

## Inputs

The command expects:

- A working directory inside a Git repository (or a path passed in by the
  user). If the path is not a Git repo, abort cleanly with a single-line
  message and produce no report.
- An optional output directory for the report. If not provided, the agent
  must propose a path under the system temp directory and confirm with the
  user before writing files. This command writes only to the report
  directory it announces.

## Step-by-step procedure

The agent should run the bundled script first to gather facts, then read its
output and synthesize the report. The script is the only thing that touches
the shell at scale; do not improvise additional shell commands unless the
script's output points to a specific gap.

### 1. Sanity check

1. Verify the working directory is inside a Git repo:
   `git rev-parse --is-inside-work-tree` should print `true`.
2. Run `git status --porcelain=v2 --branch` and record:
   - current branch
   - upstream (if any)
   - ahead/behind counts
   - presence of unstaged or untracked changes
3. Run `gh auth status` (if `gh` exists) and record whether GitHub checks
   are available.

### 2. Run the audit script

Run `scripts/audit.sh` from the command directory, passing the repository
path as the first argument and an output directory as the second. The script
is read-only and self-contained. Example:

```bash
bash <command-dir>/scripts/audit.sh "$REPO_PATH" "$OUT_DIR"
```

The script writes plain-text fact files under `$OUT_DIR/facts/` covering:

- `branches-local.txt`, `branches-remote.txt`, `branches-merged.txt`,
  `branches-no-merged.txt`, `branches-ahead-behind.tsv`
- `worktrees.txt`, `stashes.txt`, `tags.txt`
- `remotes.txt`, `remote-show-<name>.txt` (one per remote, network read)
- `large-blobs-in-history.tsv` (top blobs by size in pack history)
- `large-files-on-disk.tsv`
- `suspicious-paths.txt` (likely-secret paths, build artifacts, OS junk)
- `gitignore-misses.txt` (tracked files matching common ignore patterns)
- `recent-commits.txt`, `commit-author-summary.tsv`
- `gh-issues.json`, `gh-prs.json` (only if `gh` is authenticated)

If the script exits non-zero, read the printed error, do **not** retry with
modifications that bypass safety checks, and surface the error in the
report's "limitations" section.

### 3. Classify findings

For each artifact the script produced, classify items into the following
categories. The classification is the agent's job; the script only collects
facts.

- **Branches**
  - *Active*: has commits within the last 30 days or matches a protected
    pattern (`main`, `master`, `release/*`, `develop`, `prod`, `production`).
  - *Stale-merged*: fully merged into the default branch and last commit
    older than 30 days.
  - *Stale-unmerged*: not merged, last commit older than 90 days.
  - *Ahead-of-remote*: local has commits the remote tracking branch does
    not. Flag for review before any deletion.
  - *Gone-upstream*: tracking branch no longer exists on the remote.
- **Worktrees**: orphaned (path missing), prunable, or active.
- **Stashes**: list every entry with its message, age, and parent branch.
  Never assume a stash is safe to drop.
- **Tags**: unannotated tags, tags pointing at unreachable commits, tags
  not pushed to a remote.
- **Remotes**: remotes that are unreachable, duplicate, or point to
  personal forks the user may have forgotten.
- **Hygiene risks**
  - Tracked files matching common secret patterns
    (`.env`, `*.pem`, `id_rsa`, `*.pfx`, `credentials*`, `*.kdbx`).
  - Build artifacts in history (`node_modules/`, `dist/`, `build/`,
    `__pycache__/`, `.next/`, `target/`, `.venv/`).
  - OS junk (`.DS_Store`, `Thumbs.db`).
  - Files larger than 10 MB on disk or >5 MB in history.
  - `.gitignore` patterns for ignored files that are nonetheless tracked.
- **GitHub issues** (when available)
  - Open issues with no activity in 180+ days.
  - Issues without labels, milestones, or assignees.
  - Duplicate-looking titles.
  - Issues referencing branches that have been deleted.

### 4. Risk-rate each finding

Assign a risk rating to every individual finding:

| Rating | Meaning |
|--------|---------|
| `low` | Cosmetic or organizational; no data loss or exposure risk. |
| `medium` | Likely safe to clean up but human review required. |
| `high` | Possible data loss, possible secret exposure, or rewrites history. |
| `blocker` | Do not act without explicit owner sign-off (e.g. ahead-of-remote branches, tags on unreachable commits, suspected leaked credentials). |

### 5. Produce the report

Write a single Markdown report to `$OUT_DIR/REPORT.md` (the agent must
announce this path before writing). Use the structure in the
[Example output structure](#example-output-structure) section below.

For every finding produce **only** an observation, a classification, a risk
rating, a recommendation, and a copy-pasteable command marked clearly as
unsafe. Do not run the suggested command.

### 6. Produce the handoff document

Write `$OUT_DIR/HANDOFF.md`. This is the structured hand-off another agent
or chat will continue from. It must be self-contained and include:

- Repo identity (path, default branch, remotes, current HEAD).
- Tooling availability (`git`, `gh`, `jq`, `find`, etc.) discovered.
- A short summary of counts by category and risk.
- A pointer to the full report and the raw fact files.
- An explicit reminder that any action requires human review and that this
  command is read-only.

## Edge cases

- **Detached HEAD.** Note the detached state, record the commit, and treat
  every "current branch" check as N/A.
- **Bare repository.** Skip worktree and on-disk hygiene checks; only the
  history-side checks apply.
- **Submodules.** List submodule paths and their pinned commits. Do not
  recurse audits into submodules — note them and stop.
- **Shallow clone.** Mark large-blob and history-size checks as
  *unreliable* in the report; recommend a full clone for accurate numbers.
- **No remotes.** Skip remote-tracking and gone-upstream checks; note in
  limitations.
- **`gh` not installed or unauthenticated.** Skip GitHub-side checks; note
  in limitations. Do not attempt to authenticate.
- **Network unavailable.** Skip `git remote show` and `gh` calls; note in
  limitations.
- **Repo is huge (>1 GB pack files, >10k branches).** Run the script with
  the `--quick` flag (it samples and caps lists). Document the sampling in
  the report.
- **Mixed line endings or non-UTF-8 paths.** Quote paths in fact files and
  the report; never inline raw bytes.
- **Working tree dirty.** Record dirtiness as a finding; do not stash, add,
  commit, or reset. The audit must work on a dirty tree.
- **CI-only checkouts.** If the repo lacks a `.git` directory but contains
  source, abort cleanly — this command needs Git metadata.

## Expected deliverables

By the end of an invocation, the agent must have produced:

1. A `facts/` directory of raw, non-interpreted command outputs.
2. `REPORT.md` — full prioritized findings with risk ratings and
   recommendations.
3. `HANDOFF.md` — short, self-contained hand-off for the next agent.
4. A console summary message linking to all three.
5. Zero modifications to the audited repository or any GitHub state.

## Validation checklist

Before reporting "done", confirm every item below. If any fails, fix it
inside the report (not by running more commands) and note it.

- [ ] No forbidden command was executed (re-read the shell history to be
      certain).
- [ ] The repository is at the same commit, with the same staged/unstaged
      state, as before invocation. Run `git status --porcelain=v2 --branch`
      and compare to the snapshot taken in step 1.
- [ ] No new branches, tags, stashes, worktrees, or remotes exist.
- [ ] No GitHub issue, label, milestone, PR, or release was modified.
- [ ] Every finding has: observation, category, risk rating, recommendation,
      unsafe-command (clearly labeled).
- [ ] Every recommended command is prefixed with the literal warning
      `# DO NOT RUN WITHOUT HUMAN REVIEW` on its own line, immediately
      above the command.
- [ ] `HANDOFF.md` is self-contained — a fresh agent reading only that file
      and the linked facts can continue without prior conversation.
- [ ] Limitations and skipped checks are listed explicitly.
- [ ] All paths in the report are absolute or rooted at the repo, and any
      paths with whitespace are quoted.

## Example output structure

The report should follow this exact skeleton. Sections with no findings
must still appear with the literal text `_No findings._` so the absence is
explicit.

```markdown
# Repo Cleanup Audit Report

- Repository: /abs/path/to/repo
- Default branch: main
- HEAD: <sha> (branch: <name> | DETACHED)
- Generated: <ISO-8601 UTC>
- Tooling: git=<version>, gh=<version|absent>, jq=<version|absent>
- Mode: full | quick (sampled)

## Summary

| Category          | low | medium | high | blocker |
|-------------------|-----|--------|------|---------|
| Branches          |     |        |      |         |
| Worktrees         |     |        |      |         |
| Stashes           |     |        |      |         |
| Tags              |     |        |      |         |
| Remotes           |     |        |      |         |
| Hygiene risks     |     |        |      |         |
| GitHub issues     |     |        |      |         |

## Findings

### Branches

#### F-B-001 — `feature/old-login` is stale-merged

- Observation: last commit 2024-08-12, fully merged into `main`.
- Classification: stale-merged
- Risk: low
- Recommendation: delete locally after confirming no open PR references it.
- Unsafe command:
  ```
  # DO NOT RUN WITHOUT HUMAN REVIEW
  git branch -d feature/old-login
  ```

(repeat per finding)

### Worktrees
_No findings._

### Stashes
...

### Tags
...

### Remotes
...

### Hygiene risks
...

### GitHub issues
...

## Limitations

- `gh` not authenticated; GitHub checks were skipped.
- Repo is a shallow clone; large-blob report is unreliable.

## Appendix: raw fact files

- facts/branches-local.txt
- facts/branches-remote.txt
- ...
```

The handoff document follows this skeleton:

```markdown
# Repo Cleanup Handoff

You are continuing a strictly read-only repository audit. Do not run any
command that mutates Git, GitHub, or local state. See `REPORT.md` for the
full prioritized findings and `facts/` for raw command outputs.

## Repo identity

- Path: /abs/path
- Default branch: main
- Remotes: origin -> git@github.com:org/repo.git
- HEAD: <sha> on <branch>
- Working tree: clean | dirty (see facts/status.txt)

## Tooling

- git: <version>
- gh: <version|absent|unauthenticated>
- jq: <version|absent>

## Findings at a glance

- Branches: 4 stale-merged (low), 1 ahead-of-remote (blocker)
- Worktrees: 1 orphaned (medium)
- Stashes: 7 entries, oldest 412 days (medium)
- Hygiene: 1 likely-secret path (high)
- GitHub: 23 stale issues (low)

## Suggested next steps for a human or follow-up agent

1. Read `REPORT.md` top to bottom.
2. Triage blockers first; never act on them without owner sign-off.
3. For low/medium items, draft a cleanup PR proposal — still as a separate
   task, not within this command.

## Read-only contract

This command produced no changes. Any cleanup must be performed by a
separate, explicitly authorized task with full human review.
```

## Notes on portability

- The bundled script targets Bash 3.2+ (works on stock macOS bash and any
  modern Linux). It does not rely on GNU-only flags except `du -b`, which
  has a transparent fallback to `du -k` for BSD/macOS.
- The procedure does not depend on any Claude-Code-specific feature beyond
  what the wrapper provides; everything in this file is plain Markdown plus
  shell helpers, so other capable coding agents can ingest it directly.
