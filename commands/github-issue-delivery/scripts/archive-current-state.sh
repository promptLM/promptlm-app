#!/usr/bin/env bash
# Copyright 2025 promptLM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# archive-current-state.sh — move the four current-state documents into
# an archive subdirectory before they are rewritten. The two append-only
# logs (progress-log, decision-log) are NOT archived.
#
# Usage: archive-current-state.sh [<artifact-dir>]
#
# Default artifact-dir: .claude/issue-delivery
#
# Archive location: <artifact-dir>/archive/<YYYY-MM-DD-HHMM>/
#
# Files that don't exist are silently skipped — useful on the first run
# of a phase where the file hasn't been written yet.

set -euo pipefail

ARTIFACT_DIR="${1:-.claude/issue-delivery}"
TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
ARCHIVE_DIR="$ARTIFACT_DIR/archive/$TIMESTAMP"

# In the unlikely case of a same-second collision (e.g. concurrent runs),
# pick a numeric suffix rather than co-mingling files.
suffix=1
while [[ -e "$ARCHIVE_DIR" ]]; do
  ARCHIVE_DIR="$ARTIFACT_DIR/archive/${TIMESTAMP}-${suffix}"
  suffix=$((suffix + 1))
done

if [[ ! -d "$ARTIFACT_DIR" ]]; then
  echo "archive-current-state: $ARTIFACT_DIR does not exist; nothing to archive"
  exit 0
fi

declare -a CURRENT_STATE=(
  implementation-plan.md
  review-report.md
  security-report.md
  sprint-review-demo.md
)

moved=0
for f in "${CURRENT_STATE[@]}"; do
  src="$ARTIFACT_DIR/$f"
  if [[ -f "$src" ]]; then
    if [[ $moved -eq 0 ]]; then
      mkdir -p "$ARCHIVE_DIR"
    fi
    mv "$src" "$ARCHIVE_DIR/$f"
    moved=$((moved + 1))
  fi
done

if [[ $moved -gt 0 ]]; then
  echo "archive-current-state: moved $moved file(s) to $ARCHIVE_DIR"
else
  echo "archive-current-state: nothing to archive in $ARTIFACT_DIR"
fi
