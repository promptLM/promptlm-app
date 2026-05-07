#!/usr/bin/env bash
# append-progress.sh — append a timestamped milestone entry skeleton
# to the progress log. The entry uses the format defined in
# commands/github-issue-delivery/log-formats.md.
#
# Usage:
#   append-progress.sh <artifact-dir> "<milestone heading>"
#
# Optional: pipe additional Markdown into stdin to fill the body fields.
#
# Example:
#   append-progress.sh .claude/issue-delivery "Plan complete" <<'EOF'
#   Status: ready for implementation
#   Issues: #42
#   Agents involved: orchestrator, architect, test-engineer
#   Actions taken: wrote .claude/issue-delivery/implementation-plan.md
#   Files touched: (planning only — no source files yet)
#   Commands run: rg --files src/
#   Findings: 3 acceptance criteria, 1 architectural risk
#   Next step: begin XP pair implementation, slice 1
#   EOF

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: append-progress.sh <artifact-dir> \"<milestone heading>\"" >&2
  exit 2
fi

ARTIFACT_DIR="$1"
HEADING="$2"
LOG="$ARTIFACT_DIR/progress-log.md"
TS="$(date "+%Y-%m-%d %H:%M %Z")"

if [[ ! -f "$LOG" ]]; then
  echo "append-progress: $LOG does not exist; run init-artifacts.sh first" >&2
  exit 1
fi

{
  printf '\n## [%s] %s\n' "$TS" "$HEADING"
  if [[ ! -t 0 ]]; then
    cat
  else
    cat <<'EOF'
Status:
Issues:
Agents involved:
Actions taken:
Files touched:
Commands run:
Findings:
Next step:
EOF
  fi
} >> "$LOG"

echo "append-progress: appended \"$HEADING\" to $LOG"
