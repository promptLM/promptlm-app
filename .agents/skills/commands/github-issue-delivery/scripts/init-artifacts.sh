#!/usr/bin/env bash
# init-artifacts.sh — create the six issue-delivery artifact files from
# templates if they don't already exist. Idempotent: existing files are
# never overwritten.
#
# Usage: init-artifacts.sh [<artifact-dir>]
#
# Default artifact-dir: .claude/issue-delivery
#
# Templates are read from the directory containing this script's parent
# (commands/github-issue-delivery/log-templates/), so the script works
# whether installed at .claude/commands/github-issue-delivery/ or run
# from the source repo.

set -euo pipefail

ARTIFACT_DIR="${1:-.claude/issue-delivery}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/log-templates"

if [[ ! -d "$TEMPLATES_DIR" ]]; then
  echo "init-artifacts: template directory not found: $TEMPLATES_DIR" >&2
  exit 1
fi

mkdir -p "$ARTIFACT_DIR"

declare -a FILES=(
  progress-log.md
  decision-log.md
  implementation-plan.md
  review-report.md
  security-report.md
  sprint-review-demo.md
)

created=0
skipped=0
for f in "${FILES[@]}"; do
  src="$TEMPLATES_DIR/$f"
  dst="$ARTIFACT_DIR/$f"
  if [[ ! -f "$src" ]]; then
    echo "init-artifacts: missing template: $src" >&2
    exit 1
  fi
  if [[ -e "$dst" ]]; then
    skipped=$((skipped + 1))
  else
    cp "$src" "$dst"
    created=$((created + 1))
  fi
done

echo "init-artifacts: created $created, kept $skipped (in $ARTIFACT_DIR)"
