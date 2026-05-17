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
# package-prompts.sh — build the release artifact for the promptLM repository template.
#
# Usage: scripts/package-prompts.sh <version>
#
# Produces:
#   dist/${artifact-name}-${version}.zip
#     ├── prompts/                       (full prompt tree)
#     ├── .promptlm/metadata.json
#     ├── .promptlm/prompts-meta.json
#     ├── release-manifest.json          (artifacts + SHA-256 + prompt list)
#     └── checksums.sha256               (sha256 of every file in the ZIP)
#   dist/checksums.sha256                (copy alongside the ZIP for release upload)
#
# Conventions:
#   - ${artifact-name} comes from PROMPTLM_ARTIFACT_NAME, else [project] name in
#     .promptlm/artifacts.toml, else the basename of the repository directory.
#     Placeholder values like REPLACE_ME_* fall back to the basename.
#   - sha256sum is used when available; falls back to `shasum -a 256` (macOS).
#
# Pure bash. Requires: bash, coreutils, find, zip, jq, sha256sum or shasum.

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(pwd)}"

if [[ $# -lt 1 ]]; then
    echo "package-prompts: ERROR: version argument required" >&2
    echo "Usage: $0 <version>" >&2
    exit 2
fi

VERSION="$1"

# Sanitize version — refuse anything that isn't safe in a filename or tag.
if [[ ! "${VERSION}" =~ ^[A-Za-z0-9._+-]+$ ]]; then
    echo "package-prompts: ERROR: invalid version '${VERSION}' (allowed: alnum . _ + -)" >&2
    exit 2
fi

fail() {
    echo "package-prompts: ERROR: $*" >&2
    exit 1
}

info() {
    echo "package-prompts: $*"
}

# Resolve artifact name.
resolve_artifact_name() {
    if [[ -n "${PROMPTLM_ARTIFACT_NAME:-}" ]]; then
        printf '%s' "${PROMPTLM_ARTIFACT_NAME}"
        return
    fi
    local toml="${REPO_ROOT}/.promptlm/artifacts.toml"
    if [[ -f "${toml}" ]]; then
        # Grab `name = "..."` from the [project] section.
        local name
        name="$(awk '
            /^\[project\]/ { in_project = 1; next }
            /^\[/          { in_project = 0; next }
            in_project && /^[[:space:]]*name[[:space:]]*=/ {
                # strip key, =, surrounding quotes and whitespace
                sub(/^[^=]*=[[:space:]]*/, "")
                gsub(/^["'\'']|["'\'']$/, "")
                print
                exit
            }
        ' "${toml}")"
        if [[ -n "${name}" && "${name}" != REPLACE_ME_* ]]; then
            printf '%s' "${name}"
            return
        fi
    fi
    basename "${REPO_ROOT}"
}

ARTIFACT_NAME="$(resolve_artifact_name)"

# Resolve sha256 tool.
sha256_tool() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$@"
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$@"
    else
        fail "neither sha256sum nor shasum is available"
    fi
}

# Resolve jq (required for manifest assembly).
if ! command -v jq >/dev/null 2>&1; then
    fail "jq is required to assemble release-manifest.json"
fi

DIST_DIR="${REPO_ROOT}/dist"
STAGING_DIR="$(mktemp -d -t promptlm-package-XXXXXX)"
trap 'rm -rf "${STAGING_DIR}"' EXIT

mkdir -p "${DIST_DIR}"

# Stage the artifact contents.
PROMPTS_DIR="${REPO_ROOT}/prompts"
PROMPTLM_DIR="${REPO_ROOT}/.promptlm"
METADATA_JSON="${PROMPTLM_DIR}/metadata.json"
PROMPTS_META_JSON="${PROMPTLM_DIR}/prompts-meta.json"

[[ -d "${PROMPTS_DIR}" ]] || fail "prompts/ directory not found at ${PROMPTS_DIR}"
[[ -f "${METADATA_JSON}" ]] || fail ".promptlm/metadata.json not found at ${METADATA_JSON}"
[[ -f "${PROMPTS_META_JSON}" ]] || fail ".promptlm/prompts-meta.json not found at ${PROMPTS_META_JSON}"

cp -R "${PROMPTS_DIR}" "${STAGING_DIR}/prompts"
mkdir -p "${STAGING_DIR}/.promptlm"
cp "${METADATA_JSON}" "${STAGING_DIR}/.promptlm/metadata.json"
cp "${PROMPTS_META_JSON}" "${STAGING_DIR}/.promptlm/prompts-meta.json"

# Compute SHA-256 of every file we'll ZIP (manifest + checksums first; then add themselves last).
generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Build artifacts array (every file currently in staging, relative paths).
artifacts_json="$(
    cd "${STAGING_DIR}"
    find . -type f -print0 \
        | LC_ALL=C sort -z \
        | while IFS= read -r -d '' file; do
            rel="${file#./}"
            hash="$(sha256_tool "${file}" | awk '{print $1}')"
            jq -n --arg path "${rel}" --arg sha "${hash}" '{path:$path, sha256:$sha}'
          done \
        | jq -s '.'
)"

# Extract prompts array from metadata.json (default to empty array if missing).
prompts_json="$(jq '.prompts // []' "${METADATA_JSON}")"

# Assemble release-manifest.json.
jq -n \
    --arg name "${ARTIFACT_NAME}" \
    --arg version "${VERSION}" \
    --arg generatedAt "${generated_at}" \
    --arg generator "promptlm-repository-template" \
    --argjson artifacts "${artifacts_json}" \
    --argjson prompts "${prompts_json}" \
    '{name:$name, version:$version, generatedAt:$generatedAt, generator:$generator, artifacts:$artifacts, prompts:$prompts}' \
    > "${STAGING_DIR}/release-manifest.json"

# Compute checksums.sha256 for every file in the staging tree (including the just-written manifest).
# Excludes checksums.sha256 itself (it's being written) and is sorted for deterministic output.
(
    cd "${STAGING_DIR}"
    : > checksums.sha256
    while IFS= read -r -d '' file; do
        sha256_tool "${file}" >> checksums.sha256
    done < <(find . -type f ! -name 'checksums.sha256' -print0 | LC_ALL=C sort -z)
)

ZIP_NAME="${ARTIFACT_NAME}-${VERSION}.zip"
ZIP_PATH="${DIST_DIR}/${ZIP_NAME}"
rm -f "${ZIP_PATH}"

(
    cd "${STAGING_DIR}"
    # -r recurse, -X strip extra metadata for determinism, -q quiet.
    zip -rqX "${ZIP_PATH}" . -x '*.DS_Store'
)

# Standalone checksums file alongside the ZIP for release upload.
cp "${STAGING_DIR}/checksums.sha256" "${DIST_DIR}/checksums.sha256"

info "artifact     : ${ZIP_PATH}"
info "checksums    : ${DIST_DIR}/checksums.sha256"
info "manifest     : embedded as release-manifest.json"
info "version      : ${VERSION}"
info "artifact-name: ${ARTIFACT_NAME}"
