# repo-cleanup-audit

A Claude Code slash command that performs a **strictly read-only** audit of
a Git repository: branches, worktrees, stashes, tags, remotes, suspicious
committed paths, large blobs in history, on-disk hygiene risks, and GitHub
issues/PRs (when `gh` is authenticated). Produces a prioritized cleanup
report (`REPORT.md`) and a self-contained handoff document (`HANDOFF.md`)
that another agent or chat can continue from — without modifying any
repository or GitHub state.

This command was converted from the `repo-cleanup-audit` Agent Skill
proposed in [PR #2](https://github.com/fabapp2/agentskills/pull/2). The
agent-neutral procedure lives in `PROCEDURE.md` and can be ingested by
non-Claude-Code clients.

## Layout

```
repo-cleanup-audit/
├── README.md           ← you are here
├── PROCEDURE.md        ← canonical, agent-neutral procedure
├── audit.md            ← Claude Code slash command wrapper
└── scripts/
    └── audit.sh        ← read-only data collector with built-in guard
```

## Install for Claude Code

Installation is two steps. **Step 1 is required**; step 2 is optional and
only changes the command name from `/repo-cleanup-audit:audit` to the bare
`/audit`.

### Step 1 (required) — install the directory

Copy or symlink the entire `repo-cleanup-audit/` directory into your
project's `.claude/commands/`:

```bash
# From the root of the project where you want to use the command:
mkdir -p .claude/commands
cp -r /path/to/this/repo-cleanup-audit .claude/commands/

# Or, if you want to track upstream updates, symlink instead:
ln -s /path/to/this/repo-cleanup-audit .claude/commands/repo-cleanup-audit
```

After this step the command is available as `/repo-cleanup-audit:audit`
(Claude Code namespaces commands placed in subdirectories).

### Step 2 (optional) — bare command name

If you prefer the bare name `/audit`, also symlink the wrapper file to the
top of `.claude/commands/`. **This requires step 1 to be done first** — the
wrapper hard-codes the install path under
`.claude/commands/repo-cleanup-audit/`, and a bare-symlinked wrapper without
the directory installed will fail to find its own scripts and references.

```bash
ln -s repo-cleanup-audit/audit.md .claude/commands/audit.md
```

## Usage

```
/repo-cleanup-audit:audit
/repo-cleanup-audit:audit /path/to/repo
/repo-cleanup-audit:audit /path/to/repo --quick
/repo-cleanup-audit:audit --quick
```

Arguments:

- Optional first non-flag token: path to the repository (defaults to the
  current working directory).
- `--quick`: sample large lists and cap expensive history scans. Useful
  for very large repositories.

The wrapper:

1. Pre-loads repo state (working directory, branch, HEAD, `git status`,
   `gh auth status`) inline.
2. Tells the agent to follow `PROCEDURE.md` from step 1 to step 6 and the
   Validation checklist.
3. The agent runs `scripts/audit.sh`, classifies findings, and writes
   `REPORT.md` plus `HANDOFF.md` into a temporary output directory it
   announces beforehand.

## Read-only guarantees

- No Git mutation: forbids `push`/`pull`/`fetch`/`checkout`/`switch`/
  `merge`/`rebase`/`commit`/`add`/`rm`/`mv`/`reset`/`gc`/`prune`/`repack`/
  `clean`/`init`/`clone`, branch/tag/remote/config/stash/worktree writes,
  `update-ref`, `filter-branch`/`filter-repo`.
- No GitHub mutation: forbids `gh issue|pr|label|release|repo|gist|secret|
  variable|workflow|run|cache` writes and `gh api` with non-`GET` methods.
- No installers and no file mutators outside the announced output dir.
- The `gh` codepath only runs if `gh auth status` succeeds; otherwise it
  records `unauthenticated` and skips cleanly.
- The bundled `audit.sh` snapshots HEAD and `git status` before and after
  the run and refuses to exit 0 if anything moved.

## Use from other agents

`PROCEDURE.md` is consumer-neutral. To run the workflow with a non-Claude
client:

1. Have the agent read `PROCEDURE.md` as context.
2. Have the agent run `bash scripts/audit.sh <repo-path> <out-dir>` (or
   add `--quick`) to collect facts.
3. Have the agent classify the facts and write `REPORT.md` and
   `HANDOFF.md` per the example skeletons in `PROCEDURE.md`.

## Requirements

- `bash` (3.2+ — works on stock macOS bash)
- `git`
- `gh` (GitHub CLI), authenticated — only required for GitHub-side checks;
  the audit still runs without it
- `jq` — optional; recorded if present
- POSIX read tools: `find`, `grep`, `awk`, `sed`, `sort`, `uniq`, `wc`,
  `du`, `stat`

## License

Apache-2.0 (matches the parent repository).
