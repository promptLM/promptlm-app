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

#
# validate-prompts.sh — pre-release prompt validation for the promptLM repository template.
#
# Exits non-zero with a clear message if:
#   - prompts/ is missing or contains no files
#   - any file under prompts/ is empty (zero-byte or whitespace-only)
#   - any per-prompt promptlm.yml / promptlm.yaml manifest under prompts/ is
#     missing one of the required fields: id, name, group, version, request
#
# The repository-level configuration file at <repo>/promptlm.yml (release
# toggle, provider, …) is intentionally NOT validated by this script — it has
# a different schema and lives outside `prompts/`.
#
# Exits 0 on success with a summary of what was validated.
#
# Pure bash. No external tooling beyond coreutils/findutils.

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(pwd)}"
PROMPTS_DIR="${REPO_ROOT}/prompts"

REQUIRED_PROMPTLM_FIELDS=(id name group version request)

fail() {
    echo "validate-prompts: ERROR: $*" >&2
    exit 1
}

info() {
    echo "validate-prompts: $*"
}

# 1. prompts/ must exist and contain at least one file.
if [[ ! -d "${PROMPTS_DIR}" ]]; then
    fail "prompts/ directory not found at ${PROMPTS_DIR}"
fi

# Collect prompt files (regular files, excluding dotfiles like .gitignore).
prompt_count=0
empty_files=""
while IFS= read -r -d '' f; do
    prompt_count=$((prompt_count + 1))
    if [[ ! -s "$f" ]]; then
        empty_files+="${f}"$'\n'
        continue
    fi
    if ! grep -q '[^[:space:]]' "$f"; then
        empty_files+="${f}"$'\n'
    fi
done < <(find "${PROMPTS_DIR}" -type f ! -name '.*' -print0)

if [[ ${prompt_count} -eq 0 ]]; then
    fail "prompts/ contains no prompt files"
fi

# 2. Every prompt file must contain non-whitespace content.
if [[ -n "${empty_files}" ]]; then
    {
        echo "validate-prompts: ERROR: empty or whitespace-only prompt file(s):"
        printf '%s' "${empty_files}" | sed 's/^/  - /'
    } >&2
    exit 1
fi

# 3. Every per-prompt promptlm.yml / promptlm.yaml manifest must declare the
#    required fields. The repository-level `<repo>/promptlm.yml` is a
#    configuration file (release toggle, provider, …) and is intentionally
#    excluded — it has a different schema and lives at the repo root, not
#    under `prompts/`.
promptlm_count=0
missing_fields_report=""
while IFS= read -r -d '' f; do
    promptlm_count=$((promptlm_count + 1))
    missing=""
    for field in "${REQUIRED_PROMPTLM_FIELDS[@]}"; do
        # Match a top-level YAML key: "<field>:" at the start of a line (optional leading spaces).
        if ! grep -Eq "^[[:space:]]*${field}:" "$f"; then
            if [[ -z "${missing}" ]]; then
                missing="${field}"
            else
                missing="${missing} ${field}"
            fi
        fi
    done
    if [[ -n "${missing}" ]]; then
        missing_fields_report+="${f}: missing ${missing}"$'\n'
    fi
done < <(find "${PROMPTS_DIR}" -type f \( -name 'promptlm.yml' -o -name 'promptlm.yaml' \) -print0)

if [[ -n "${missing_fields_report}" ]]; then
    {
        echo "validate-prompts: ERROR: promptlm.y(a)ml files missing required fields:"
        printf '%s' "${missing_fields_report}" | sed 's/^/  - /'
    } >&2
    exit 1
fi

# Summary.
info "validated ${prompt_count} prompt file(s) under prompts/"
if [[ ${promptlm_count} -gt 0 ]]; then
    info "validated ${promptlm_count} promptlm.y(a)ml file(s)"
else
    info "no promptlm.y(a)ml files found (skipping field check)"
fi
info "OK"
