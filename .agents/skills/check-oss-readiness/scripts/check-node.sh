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
# check-node.sh — Node / npm / TypeScript specific OSS-readiness checks
#
# Usage:  bash check-node.sh TARGET
#
# TARGET is the directory to check (a package root or project root).
# Output: one line per check in the format  CHECK_ID|STATUS|message
#
# Cross-cutting checks (license headers, secrets, CVEs, dependency licenses)
# are handled by external tools invoked from SKILL.md:
#   - license-eye header check     (license / SPDX headers)
#   - gitleaks detect --no-git     (hardcoded secrets)
#   - trivy fs --scanners vuln     (known vulnerabilities)
#   - trivy fs --scanners license  (dependency license compatibility)
# ---------------------------------------------------------------------------
set -euo pipefail

TARGET="${1:-.}"
TARGET="$(cd "$TARGET" && pwd)"

EXCLUDE="--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage --exclude-dir=.git"

result() { echo "$1|$2|$3"; }

# Find all package.json directories (excluding node_modules)
pkg_dirs=$(find "$TARGET" -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \; 2>/dev/null)
src_dirs=$(find "$TARGET" -type d -name "src" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)

# ── 3.4 Public API documentation (JSDoc) ────────────────────────────────────

for src in $src_dirs; do
  exported_files=$(grep -rl "^export " "$src" --include="*.ts" --include="*.tsx" --include="*.js" $EXCLUDE 2>/dev/null || true)
  if [ -n "$exported_files" ]; then
    missing_jsdoc=$(echo "$exported_files" | xargs grep -L "/\*\*" 2>/dev/null || true)
    if [ -z "$missing_jsdoc" ]; then
      result "3.4" "PASS" "All exported JS/TS modules have JSDoc"
    else
      count=$(echo "$missing_jsdoc" | wc -l | tr -d ' ')
      result "3.4" "WARN" "$count exported module(s) without JSDoc — first: $(echo "$missing_jsdoc" | head -1 | sed "s|$TARGET/||")"
    fi
  fi
done

# ── 4.1 No private package registries ────────────────────────────────────────

npmrc_files=$(find "$TARGET" -name ".npmrc" -not -path "*/node_modules/*" 2>/dev/null)
private_reg=""
for rc in $npmrc_files; do
  hits=$(grep -i "registry=" "$rc" | grep -vi "registry.npmjs.org" || true)
  if [ -n "$hits" ]; then
    private_reg="$private_reg $(echo "$hits" | head -1 | xargs)"
  fi
done

if [ -z "$private_reg" ]; then
  result "4.1" "PASS" "No private npm registries detected"
else
  result "4.1" "FAIL" "Private npm registry detected:$private_reg"
fi

# ── 4.2 Unstable / private pre-release deps ─────────────────────────────────

for dir in $pkg_dirs; do
  pkg="$dir/package.json"
  if [ -f "$pkg" ]; then
    git_deps=$(grep -E '"(git\+|github:|file:|link:)' "$pkg" || true)
    if [ -n "$git_deps" ]; then
      result "4.2" "WARN" "Non-registry dependency in $(basename "$dir"): $(echo "$git_deps" | head -1 | xargs)"
    else
      result "4.2" "PASS" "No git+/file:/link: dependencies in $(basename "$dir")"
    fi
  fi
done

# ── 4.4 Standalone build ─────────────────────────────────────────────────────

for dir in $pkg_dirs; do
  if [ -f "$dir/package.json" ] && command -v npm &>/dev/null; then
    build_script=$(cd "$dir" && node -e "const p=require('./package.json'); process.stdout.write(p.scripts && p.scripts.build ? 'yes' : 'no')" 2>/dev/null || echo "no")
    if [ "$build_script" = "yes" ]; then
      if (cd "$dir" && npm ci --ignore-scripts 2>/dev/null && npm run build 2>/dev/null); then
        result "4.4" "PASS" "npm build succeeded in $(basename "$dir")"
      else
        result "4.4" "FAIL" "npm build failed in $(basename "$dir") — run npm ci && npm run build for details"
      fi
    else
      result "4.4" "PASS" "No build script in $(basename "$dir") — nothing to verify"
    fi
  fi
done

# ── 4.5 Pinned dependency versions ──────────────────────────────────────────

for dir in $pkg_dirs; do
  pkg="$dir/package.json"
  if [ -f "$pkg" ]; then
    unpinned=$(grep -E '"\*"|"latest"|">=|">|"~|"\^' "$pkg" | grep -vi '"devDependencies\|"scripts\|"engines' || true)
    if [ -z "$unpinned" ]; then
      result "4.5" "PASS" "All dependencies pinned in $(basename "$dir")"
    else
      count=$(echo "$unpinned" | wc -l | tr -d ' ')
      result "4.5" "WARN" "$count unpinned dependency version(s) in $(basename "$dir") — consider pinning for reproducibility"
    fi
  fi
done

# ── 5.3 Commented-out code ──────────────────────────────────────────────────

for src in $src_dirs; do
  total_lines=$(find "$src" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')
  comment_lines=$(grep -rc "^\s*//" "$src" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $EXCLUDE 2>/dev/null \
    | awk -F: '{s+=$2} END {print s+0}')

  if [ "$total_lines" -gt 0 ]; then
    ratio=$((comment_lines * 100 / total_lines))
    if [ "$ratio" -gt 20 ]; then
      result "5.3" "WARN" "Commented-out code ratio is ${ratio}% (${comment_lines}/${total_lines} lines) — exceeds 20% threshold"
    else
      result "5.3" "PASS" "Commented-out code ratio is ${ratio}% — within threshold"
    fi
  fi
done

# ── 5.4 Tests present ───────────────────────────────────────────────────────

test_count=$(find "$TARGET" \( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" -o -name "*.spec.js" \
  -o -name "*.test.tsx" -o -name "*.spec.tsx" \) -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$test_count" -eq 0 ]; then
  result "5.4" "FAIL" "No JS/TS test files found"
else
  result "5.4" "PASS" "$test_count JS/TS test file(s) found"
fi

# ── 5.5 Tests pass ──────────────────────────────────────────────────────────

for dir in $pkg_dirs; do
  test_script=$(cd "$dir" && node -e "const p=require('./package.json'); process.stdout.write(p.scripts && p.scripts.test ? 'yes' : 'no')" 2>/dev/null || echo "no")
  if [ "$test_script" = "yes" ]; then
    if (cd "$dir" && npm test 2>/dev/null); then
      result "5.5" "PASS" "Tests passed in $(basename "$dir")"
    else
      result "5.5" "FAIL" "Tests failed in $(basename "$dir") — run npm test for details"
    fi
  fi
done

# ── 5.6 Static analysis configured ──────────────────────────────────────────

static_tools=""
for dir in $pkg_dirs; do
  for cfg in ".eslintrc" ".eslintrc.js" ".eslintrc.json" ".eslintrc.yml" "eslint.config.js" "eslint.config.mjs" \
             ".prettierrc" ".prettierrc.js" "prettier.config.js" "biome.json"; do
    if [ -f "$dir/$cfg" ]; then
      static_tools="$static_tools $cfg"
    fi
  done
  # Also check package.json for eslintConfig
  if [ -f "$dir/package.json" ] && grep -q '"eslintConfig"' "$dir/package.json" 2>/dev/null; then
    static_tools="$static_tools eslintConfig-in-package.json"
  fi
done

if [ -n "$static_tools" ]; then
  result "5.6" "PASS" "Static analysis configured:$static_tools"
else
  result "5.6" "WARN" "No linter/formatter config found — consider eslint, prettier, or biome"
fi

# ── 6.1 .gitignore coverage ─────────────────────────────────────────────────

gitignore_file="$TARGET/.gitignore"
if [ ! -f "$gitignore_file" ]; then
  gitignore_file="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)/.gitignore" || true
fi

if [ -f "$gitignore_file" ]; then
  missing_entries=""
  for entry in "node_modules/" "dist/" "coverage/"; do
    if ! grep -q "$entry" "$gitignore_file" 2>/dev/null; then
      missing_entries="$missing_entries $entry"
    fi
  done

  if [ -z "$missing_entries" ]; then
    result "6.1" "PASS" "Node-related .gitignore entries present"
  else
    result "6.1" "WARN" "Missing .gitignore entries:$missing_entries"
  fi
else
  result "6.1" "WARN" "No .gitignore found"
fi
