#!/usr/bin/env bash
# load-issues.sh — print structured context for one or more GitHub issues.
#
# Usage: load-issues.sh <issue-number> [<issue-number> ...]
#
# Output: For each issue, a Markdown block with title, state, labels,
# assignees, body, and recent comments. If `gh` is not installed or the
# user is not authenticated, prints a clear fallback message and exits 0
# (so the orchestrator agent can take over via the GitHub MCP tools).

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "(no issue numbers passed; orchestrator should ask the user)"
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "(\`gh\` not installed; orchestrator should load issues via the GitHub MCP tools or ask the user)"
  exit 0
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "(\`gh\` is not authenticated; orchestrator should load issues via the GitHub MCP tools or ask the user)"
  exit 0
fi

for n in "$@"; do
  # Skip non-numeric arguments (e.g. if $ARGUMENTS is empty or contains stray tokens).
  if ! [[ "$n" =~ ^[0-9]+$ ]]; then
    continue
  fi

  printf '\n### Issue #%s\n' "$n"
  if ! gh issue view "$n" --json number,title,state,labels,assignees,milestone,body,comments,author \
      --template '
**Title:** {{.title}}
**State:** {{.state}}
**Author:** {{if .author}}@{{.author.login}}{{else}}(deleted user){{end}}
**Labels:** {{range .labels}}{{.name}} {{end}}
**Assignees:** {{range .assignees}}@{{.login}} {{end}}
**Milestone:** {{if .milestone}}{{.milestone.title}}{{else}}(none){{end}}

**Body:**
{{.body}}

**Comments ({{len .comments}}):**
{{range .comments}}
- {{if .author}}@{{.author.login}}{{else}}(deleted user){{end}} ({{.createdAt}}): {{.body}}
{{end}}
' 2>/dev/null; then
    printf '(could not load issue #%s — does it exist in this repo?)\n' "$n"
  fi
done
