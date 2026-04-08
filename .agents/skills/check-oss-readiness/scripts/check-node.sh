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
# ---------------------------------------------------------------------------
set -euo pipefail

TARGET="${1:-.}"
TARGET="$(cd "$TARGET" && pwd)"

EXCLUDE="--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage --exclude-dir=.git"

result() { echo "$1|$2|$3"; }

# Find all package.json directories (excluding node_modules)
pkg_dirs=$(find "$TARGET" -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \; 2>/dev/null)

# ── 1.2 Copyright / license headers ──────────────────────────────────────────

src_dirs=$(find "$TARGET" -type d -name "src" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)
missing_header_files=""
for src in $src_dirs; do
  hits=$(grep -rL "Copyright\|license\|Licensed\|SPDX-License-Identifier" \
    "$src" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $EXCLUDE 2>/dev/null || true)
  if [ -n "$hits" ]; then
    missing_header_files="$missing_header_files
$hits"
  fi
done
missing_header_files=$(echo "$missing_header_files" | sed '/^$/d')

if [ -z "$missing_header_files" ]; then
  result "1.2" "PASS" "All JS/TS source files contain a copyright or license header"
else
  count=$(echo "$missing_header_files" | wc -l | tr -d ' ')
  result "1.2" "WARN" "$count JS/TS file(s) missing copyright/license header — first: $(echo "$missing_header_files" | head -1 | sed "s|$TARGET/||")"
fi

# ── 1.3 Dependency license compatibility ─────────────────────────────────────

license_fail=""
for dir in $pkg_dirs; do
  if command -v npx &>/dev/null; then
    checker_output=$(cd "$dir" && npx --yes license-checker --summary 2>/dev/null || echo "CHECKER_FAILED")
    if echo "$checker_output" | grep -qi "CHECKER_FAILED"; then
      result "1.3" "WARN" "Could not run license-checker in $(basename "$dir") — verify manually"
      license_fail="skip"
      break
    else
      gpl_hits=$(echo "$checker_output" | grep -i "GPL\|AGPL\|CDDL" | grep -vi "LGPL" || true)
      if [ -n "$gpl_hits" ]; then
        result "1.3" "FAIL" "Copyleft dependency in $(basename "$dir"): $(echo "$gpl_hits" | head -1 | xargs)"
        license_fail="yes"
        break
      fi
    fi
  else
    result "1.3" "WARN" "npx not available — skipped dependency license check"
    license_fail="skip"
    break
  fi
done
if [ -z "$license_fail" ]; then
  result "1.3" "PASS" "No copyleft dependencies detected"
fi

# ── 1.5 SPDX-License-Identifier in headers ──────────────────────────────────

missing_spdx=""
for src in $src_dirs; do
  hits=$(grep -rL "SPDX-License-Identifier" \
    "$src" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $EXCLUDE 2>/dev/null || true)
  if [ -n "$hits" ]; then
    missing_spdx="$missing_spdx
$hits"
  fi
done
missing_spdx=$(echo "$missing_spdx" | sed '/^$/d')

if [ -z "$missing_spdx" ]; then
  result "1.5" "PASS" "All JS/TS source files contain an SPDX-License-Identifier"
else
  count=$(echo "$missing_spdx" | wc -l | tr -d ' ')
  result "1.5" "WARN" "$count JS/TS file(s) missing SPDX-License-Identifier — first: $(echo "$missing_spdx" | head -1 | sed "s|$TARGET/||")"
fi

# ── 2.2 Secrets in configuration files ───────────────────────────────────────

config_secrets=""
for f in $(find "$TARGET" \( -name ".env" -o -name ".env.*" -o -name "config.json" -o -name "config.js" \) \
  -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null); do
  hits=$(grep -ni "password\|token\|api.key\|secret\|private.key" "$f" \
    | grep -v '^\s*#\|^\s*//' \
    | grep -vi '\${.*}\|process\.env\|placeholder\|TODO\|CHANGE_ME\|your-' || true)
  if [ -n "$hits" ]; then
    config_secrets="$config_secrets\n$(echo "$hits" | head -1)"
  fi
done

if [ -z "$config_secrets" ]; then
  result "2.2" "PASS" "No literal secrets found in Node config files"
else
  result "2.2" "FAIL" "Possible literal secret in config — $(echo -e "$config_secrets" | head -1 | xargs)"
fi

# ── 2.6 Known vulnerability scanning ────────────────────────────────────────

for dir in $pkg_dirs; do
  if [ -f "$dir/package-lock.json" ] && command -v npm &>/dev/null; then
    audit_output=$(cd "$dir" && npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    vuln_count=$(echo "$audit_output" | grep -c '"severity"' 2>/dev/null || echo "0")
    if [ "$vuln_count" -gt 0 ]; then
      result "2.6" "WARN" "$vuln_count known vulnerability(ies) in $(basename "$dir") — run npm audit for details"
    else
      result "2.6" "PASS" "No known vulnerabilities in $(basename "$dir")"
    fi
  else
    result "2.6" "WARN" "No package-lock.json or npm not available in $(basename "$dir") — skipped audit"
  fi
done

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
