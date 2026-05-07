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

# ---------------------------------------------------------------------------
# update-skill-table.sh — regenerate the skills table in README.md
#
# Parses the YAML front matter (name, description) from every
# skills/*/SKILL.md and writes a Markdown table between the
# <!-- SKILL_TABLE_START --> and <!-- SKILL_TABLE_END --> markers
# in README.md.
#
# Usage:  bash scripts/update-skill-table.sh
# ---------------------------------------------------------------------------
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
README="$REPO_ROOT/README.md"
SKILLS_DIR="$REPO_ROOT/skills"

START_MARKER="<!-- SKILL_TABLE_START -->"
END_MARKER="<!-- SKILL_TABLE_END -->"

# --- Build the table -------------------------------------------------------

table="| Skill | Description |
|---|---|"

for skill_md in "$SKILLS_DIR"/*/SKILL.md; do
  [ -f "$skill_md" ] || continue

  dir_name="$(basename "$(dirname "$skill_md")")"

  # Extract YAML front matter between the first pair of ---
  front_matter="$(sed -n '/^---$/,/^---$/p' "$skill_md" | sed '1d;$d')"

  name="$(echo "$front_matter" | grep -E '^name:' | head -1 | sed 's/^name:[[:space:]]*//')"
  desc="$(echo "$front_matter" | grep -E '^description:' | head -1 | sed 's/^description:[[:space:]]*//')"

  # Fallback: use directory name if name is missing
  name="${name:-$dir_name}"

  table="$table
| [$name](skills/$dir_name/) | $desc |"
done

# --- Replace the marker block in README -----------------------------------

if ! grep -q "$START_MARKER" "$README"; then
  echo "Error: $START_MARKER not found in $README" >&2
  exit 1
fi

# Write replacement block to a temp file
tmpfile="$(mktemp)"
echo "$START_MARKER" > "$tmpfile"
echo "$table" >> "$tmpfile"
echo "$END_MARKER" >> "$tmpfile"

# Use awk with file-read to replace the marker block
awk -v start="$START_MARKER" -v end="$END_MARKER" -v replfile="$tmpfile" '
  $0 == start { while ((getline line < replfile) > 0) print line; skip=1; next }
  $0 == end   { skip=0; next }
  !skip       { print }
' "$README" > "$README.tmp"

mv "$README.tmp" "$README"
rm -f "$tmpfile"

echo "Skills table updated in README.md"
