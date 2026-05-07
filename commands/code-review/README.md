# code-review

A read-only code review slash command. Reviews a GitHub Pull Request, a branch vs. the default branch, or the latest local Git changes, and produces a structured report with severity-tagged findings, security concerns, test-coverage notes, and a final recommendation.

## Layout

```
code-review/
├── README.md             ← you are here
├── PROCEDURE.md          ← canonical, consumer-neutral workflow
├── review-criteria.md    ← criteria checklist (correctness, security, tests, …)
├── output-format.md      ← required report template
├── review.md             ← Claude Code slash command wrapper
└── scripts/
    └── load-reference.sh ← pre-loads PR / branch / local context based on $ARGUMENTS
```

`PROCEDURE.md` is consumer-neutral. Other agents can ingest it directly without going through the Claude Code wrapper.

## Install for Claude Code

Copy or symlink the entire `code-review/` directory into your project's `.claude/commands/`:

```bash
# From the root of the project where you want to use the command:
mkdir -p .claude/commands
cp -r /path/to/this/code-review .claude/commands/

# Or, to track upstream updates, symlink instead:
ln -s /path/to/this/code-review .claude/commands/code-review
```

The command will be available as `/code-review:review` (Claude Code namespaces commands placed in subdirectories).

If you prefer the bare name `/review`, also symlink the wrapper file to the top of `.claude/commands/`:

```bash
ln -s code-review/review.md .claude/commands/review.md
```

The wrapper resolves all paths against `.claude/commands/code-review/...`, so this works regardless of which symlink you invoke.

### Verify install

From your project root:

```bash
.claude/commands/code-review/scripts/load-reference.sh
# Should print "## Mode: local" followed by working-tree status and branch summary.
```

## Usage

```
/review                              # review latest local changes
/review 123                          # review GitHub PR #123
/review https://github.com/o/r/pull/123
/review feature/my-branch            # review branch vs. default branch
```

The wrapper:

1. Pre-loads repo state (current branch + working tree + default-branch hint) inline.
2. Calls `scripts/load-reference.sh $ARGUMENTS` to pre-load a bounded summary of PR / branch / local context.
3. `@`-references `PROCEDURE.md` and the supporting docs.
4. Tells the agent to begin at Phase 1.

The agent fetches full diffs on demand (`gh pr diff <ref>` or `git diff <default>...<ref>`) — those are not pre-loaded to avoid context blowup.

## Use from other agents

`PROCEDURE.md` is consumer-neutral. To run this with a non-Claude-Code client:

1. Have the agent read `PROCEDURE.md`, `review-criteria.md`, and `output-format.md` as context.
2. Have the agent run `scripts/load-reference.sh [<reference>]` to pre-load PR / branch / local context.
3. Have the agent execute the seven-phase procedure and emit the final report in the required format.

The procedure does not depend on any Claude-Code-specific feature beyond what the wrapper provides.

## Default posture

Read-only. The wrapper's `allowed-tools` declaration restricts execution to `git`, `gh`, `jq`, `rg`, the bundled scripts, and `Read`. The procedure forbids commits, pushes, merges, PR mutations, file edits, and destructive Git operations.

Optional fix mode is disabled by default and requires explicit user opt-in; see "Optional fix mode" in `PROCEDURE.md`.

## Requirements

- `bash`
- `git`
- `gh` (GitHub CLI), authenticated — required for PR review mode
- `jq` — used by `gh --json` filtering; not strictly required if you skip JSON queries

## License

Apache-2.0 (matches the parent repository).
