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

# Copyright $COPYRIGHT_YEAR $COPYRIGHT_HOLDER
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
# check-python.sh — Python specific OSS-readiness checks
#
# Usage:  bash check-python.sh TARGET
#
# TARGET is the directory to check (a Python package root or project root).
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

EXCLUDE="--exclude-dir=venv --exclude-dir=.venv --exclude-dir=__pycache__ --exclude-dir=.git --exclude-dir=dist --exclude-dir=.eggs --exclude-dir=*.egg-info"

result() { echo "$1|$2|$3"; }

# Find Python package directories (containing .py files, excluding venv etc.)
py_files=$(find "$TARGET" -name "*.py" \
  -not -path "*/venv/*" -not -path "*/.venv/*" -not -path "*/__pycache__/*" \
  -not -path "*/dist/*" -not -path "*/.eggs/*" -not -path "*/*.egg-info/*" \
  2>/dev/null)

# ── 3.4 Public API documentation (docstrings) ───────────────────────────────

if [ -n "$py_files" ]; then
  # Find public functions/classes without docstrings
  # A public def/class not preceded by a docstring line
  missing_docs=""
  for f in $py_files; do
    # Find lines with def or class, not starting with underscore (private)
    public_defs=$(grep -n "^def \|^class " "$f" 2>/dev/null | grep -v "^[0-9]*:def _\|^[0-9]*:class _" || true)
    if [ -n "$public_defs" ]; then
      has_docstring=$(grep -c '"""' "$f" 2>/dev/null || echo "0")
      if [ "$has_docstring" -eq 0 ]; then
        missing_docs="$missing_docs $(echo "$f" | sed "s|$TARGET/||")"
      fi
    fi
  done

  if [ -z "$missing_docs" ]; then
    result "3.4" "PASS" "All Python public definitions have docstrings"
  else
    count=$(echo "$missing_docs" | wc -w | tr -d ' ')
    first=$(echo "$missing_docs" | tr ' ' '\n' | head -1)
    result "3.4" "WARN" "$count Python file(s) with public defs lacking docstrings — first: $first"
  fi
else
  result "3.4" "PASS" "No Python source files found (nothing to document)"
fi

# ── 4.1 No private package registries ────────────────────────────────────────

private_index=""

# Check pip.conf
for conf in "$TARGET/pip.conf" "$HOME/.pip/pip.conf" "$HOME/.config/pip/pip.conf"; do
  if [ -f "$conf" ]; then
    hit=$(grep -i "index-url\|extra-index-url" "$conf" | grep -vi "pypi.org\|pypi.python.org" || true)
    if [ -n "$hit" ]; then
      private_index="$private_index $(echo "$hit" | head -1 | xargs)"
    fi
  fi
done

# Check pyproject.toml for poetry sources
if [ -f "$TARGET/pyproject.toml" ]; then
  hit=$(grep -A2 "\[tool.poetry.source\]" "$TARGET/pyproject.toml" 2>/dev/null | grep "url" | grep -vi "pypi.org" || true)
  if [ -n "$hit" ]; then
    private_index="$private_index $(echo "$hit" | head -1 | xargs)"
  fi
fi

if [ -z "$private_index" ]; then
  result "4.1" "PASS" "No private Python package registries detected"
else
  result "4.1" "FAIL" "Private Python registry detected:$private_index"
fi

# ── 4.2 Unstable / VCS dependencies ─────────────────────────────────────────

vcs_deps=""
for req in $(find "$TARGET" -name "requirements*.txt" -not -path "*/venv/*" -not -path "*/.venv/*" 2>/dev/null); do
  hits=$(grep -E "^(git\+|svn\+|hg\+|bzr\+|file://)" "$req" || true)
  if [ -n "$hits" ]; then
    vcs_deps="$vcs_deps $(echo "$hits" | head -1 | xargs)"
  fi
done

if [ -f "$TARGET/pyproject.toml" ]; then
  hits=$(grep -E "(git\+|url\s*=)" "$TARGET/pyproject.toml" | grep -vi "pypi.org" || true)
  if [ -n "$hits" ]; then
    vcs_deps="$vcs_deps $(echo "$hits" | head -1 | xargs)"
  fi
fi

if [ -z "$vcs_deps" ]; then
  result "4.2" "PASS" "No VCS/file dependencies"
else
  result "4.2" "WARN" "VCS or file dependency detected:$vcs_deps"
fi

# ── 4.4 Standalone install ───────────────────────────────────────────────────

if [ -f "$TARGET/pyproject.toml" ] || [ -f "$TARGET/setup.py" ] || [ -f "$TARGET/setup.cfg" ]; then
  if command -v pip &>/dev/null; then
    if pip install --dry-run -e "$TARGET" 2>/dev/null; then
      result "4.4" "PASS" "pip install --dry-run succeeded"
    else
      result "4.4" "FAIL" "pip install failed — run pip install -e $TARGET for details"
    fi
  else
    result "4.4" "WARN" "pip not available — skipped install check"
  fi
elif [ -f "$TARGET/requirements.txt" ]; then
  if command -v pip &>/dev/null; then
    if pip install --dry-run -r "$TARGET/requirements.txt" 2>/dev/null; then
      result "4.4" "PASS" "pip install --dry-run -r requirements.txt succeeded"
    else
      result "4.4" "FAIL" "pip install failed — check requirements.txt"
    fi
  else
    result "4.4" "WARN" "pip not available — skipped install check"
  fi
fi

# ── 4.5 Pinned dependency versions ──────────────────────────────────────────

for req in $(find "$TARGET" -name "requirements*.txt" -not -path "*/venv/*" -not -path "*/.venv/*" 2>/dev/null); do
  unpinned=$(grep -v "^#\|^$\|^-" "$req" | grep -v "==" | grep -v "^git+" || true)
  if [ -n "$unpinned" ]; then
    count=$(echo "$unpinned" | wc -l | tr -d ' ')
    result "4.5" "WARN" "$count unpinned dependency(ies) in $(basename "$req") — first: $(echo "$unpinned" | head -1 | xargs)"
  else
    result "4.5" "PASS" "All dependencies pinned in $(basename "$req")"
  fi
done

# ── 5.3 Commented-out code ──────────────────────────────────────────────────

if [ -n "$py_files" ]; then
  total_lines=$(echo "$py_files" | xargs cat 2>/dev/null | wc -l | tr -d ' ')
  comment_lines=$(grep -rc "^\s*#" $EXCLUDE --include="*.py" "$TARGET" 2>/dev/null \
    | awk -F: '{s+=$2} END {print s+0}')

  if [ "$total_lines" -gt 0 ]; then
    ratio=$((comment_lines * 100 / total_lines))
    if [ "$ratio" -gt 20 ]; then
      result "5.3" "WARN" "Commented-out code ratio is ${ratio}% (${comment_lines}/${total_lines} lines) — exceeds 20% threshold"
    else
      result "5.3" "PASS" "Commented-out code ratio is ${ratio}% — within threshold"
    fi
  fi
fi

# ── 5.4 Tests present ───────────────────────────────────────────────────────

test_count=$(find "$TARGET" \( -name "test_*.py" -o -name "*_test.py" \) \
  -not -path "*/venv/*" -not -path "*/.venv/*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$test_count" -eq 0 ]; then
  result "5.4" "FAIL" "No Python test files found"
else
  result "5.4" "PASS" "$test_count Python test file(s) found"
fi

# ── 5.5 Tests pass ──────────────────────────────────────────────────────────

if command -v pytest &>/dev/null; then
  if pytest "$TARGET" --co -q 2>/dev/null | grep -q "test"; then
    if pytest "$TARGET" -q 2>/dev/null; then
      result "5.5" "PASS" "All pytest tests passed"
    else
      result "5.5" "FAIL" "pytest tests failed — run pytest for details"
    fi
  else
    result "5.5" "PASS" "No pytest tests collected"
  fi
elif command -v python &>/dev/null; then
  if python -m pytest "$TARGET" -q 2>/dev/null; then
    result "5.5" "PASS" "All pytest tests passed (via python -m pytest)"
  else
    result "5.5" "FAIL" "pytest tests failed — run python -m pytest for details"
  fi
else
  result "5.5" "WARN" "pytest not available — skipped test execution"
fi

# ── 5.6 Static analysis configured ──────────────────────────────────────────

static_tools=""
for cfg in "pyproject.toml" "setup.cfg" ".flake8" ".pylintrc" "pylintrc" \
           ".ruff.toml" "ruff.toml" "mypy.ini" ".mypy.ini" ".bandit"; do
  if [ -f "$TARGET/$cfg" ]; then
    # Check if pyproject.toml actually has tool config
    if [ "$cfg" = "pyproject.toml" ]; then
      if grep -qE "\[tool\.(ruff|pylint|flake8|mypy|black|isort|bandit)\]" "$TARGET/$cfg" 2>/dev/null; then
        tools_in_pyproject=$(grep -oE "\[tool\.(ruff|pylint|flake8|mypy|black|isort|bandit)\]" "$TARGET/$cfg" | sed 's/\[tool\.//;s/\]//' | tr '\n' ' ')
        static_tools="$static_tools $tools_in_pyproject"
      fi
    else
      static_tools="$static_tools $cfg"
    fi
  fi
done

if [ -n "$static_tools" ]; then
  result "5.6" "PASS" "Static analysis configured:$static_tools"
else
  result "5.6" "WARN" "No linter/type-checker config found — consider ruff, pylint, mypy, or flake8"
fi

# ── 6.1 .gitignore coverage ─────────────────────────────────────────────────

gitignore_file="$TARGET/.gitignore"
if [ ! -f "$gitignore_file" ]; then
  gitignore_file="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)/.gitignore" || true
fi

if [ -f "$gitignore_file" ]; then
  missing_entries=""
  for entry in "__pycache__/" "*.pyc" "venv/" ".venv/" "*.egg-info/" "dist/"; do
    if ! grep -q "$entry" "$gitignore_file" 2>/dev/null; then
      missing_entries="$missing_entries $entry"
    fi
  done

  if [ -z "$missing_entries" ]; then
    result "6.1" "PASS" "Python-related .gitignore entries present"
  else
    result "6.1" "WARN" "Missing .gitignore entries:$missing_entries"
  fi
else
  result "6.1" "WARN" "No .gitignore found"
fi
