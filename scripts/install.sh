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

set -euo pipefail

REPOSITORY="promptLM/promptlm-app"
VERSION=""
INSTALL_DIR="${PROMPTLM_INSTALL_DIR:-$HOME/.local/bin}"

usage() {
  cat <<'USAGE'
Install promptlm-cli from GitHub Releases.

Usage:
  install.sh [--version <version>] [--install-dir <dir>] [--repo <owner/name>]

Options:
  --version <version>      Release version to install (with or without "v" prefix).
                           Defaults to latest published release.
  --install-dir <dir>      Destination directory for promptlm-cli.
                           Default: $PROMPTLM_INSTALL_DIR or ~/.local/bin
  --repo <owner/name>      GitHub repository containing release assets.
                           Default: promptLM/promptlm-app
  -h, --help               Show this help message.
USAGE
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

normalize_version() {
  local raw="$1"
  echo "${raw#v}"
}

detect_os() {
  case "$(uname -s)" in
    Linux)
      echo "linux"
      ;;
    Darwin)
      echo "macos"
      ;;
    *)
      fail "Unsupported operating system: $(uname -s). Supported: Linux, macOS."
      ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64)
      echo "x64"
      ;;
    arm64 | aarch64)
      echo "arm64"
      ;;
    *)
      fail "Unsupported architecture: $(uname -m). Supported: x64, arm64."
      ;;
  esac
}

resolve_latest_version() {
  local api_url="https://api.github.com/repos/${REPOSITORY}/releases/latest"
  local tag
  tag="$(curl -fsSL "${api_url}" | sed -nE 's/.*"tag_name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -n1)"
  [[ -n "${tag}" ]] || fail "Unable to resolve latest release version from ${api_url}."
  normalize_version "${tag}"
}

sha256_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${file}" | awk '{print $1}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${file}" | awk '{print $1}'
    return
  fi
  fail "No SHA-256 checksum command found. Install sha256sum or shasum."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      [[ $# -gt 1 ]] || fail "Missing value for --version"
      VERSION="$2"
      shift 2
      ;;
    --install-dir)
      [[ $# -gt 1 ]] || fail "Missing value for --install-dir"
      INSTALL_DIR="$2"
      shift 2
      ;;
    --repo)
      [[ $# -gt 1 ]] || fail "Missing value for --repo"
      REPOSITORY="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

require_cmd curl
require_cmd tar
require_cmd awk
require_cmd sed
require_cmd install

OS="$(detect_os)"
ARCH="$(detect_arch)"

if [[ -z "${VERSION}" ]]; then
  VERSION="$(resolve_latest_version)"
else
  VERSION="$(normalize_version "${VERSION}")"
fi
[[ -n "${VERSION}" ]] || fail "Resolved release version is empty."

TAG="v${VERSION}"
ASSET_NAME="promptlm-cli-${OS}-${ARCH}.tar.gz"
CHECKSUMS_NAME="SHA256SUMS"
BASE_URL="https://github.com/${REPOSITORY}/releases/download/${TAG}"

TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="${TMP_DIR}/${ASSET_NAME}"
CHECKSUMS_PATH="${TMP_DIR}/${CHECKSUMS_NAME}"
EXTRACT_DIR="${TMP_DIR}/extract"
trap 'rm -rf "${TMP_DIR}"' EXIT

curl -fsSL --retry 3 --retry-delay 1 "${BASE_URL}/${ASSET_NAME}" -o "${ARCHIVE_PATH}" \
  || fail "Unable to download ${ASSET_NAME} from ${BASE_URL}."
curl -fsSL --retry 3 --retry-delay 1 "${BASE_URL}/${CHECKSUMS_NAME}" -o "${CHECKSUMS_PATH}" \
  || fail "Unable to download ${CHECKSUMS_NAME} from ${BASE_URL}."

EXPECTED_HASH="$(awk -v f="${ASSET_NAME}" '$2 == f {print $1}' "${CHECKSUMS_PATH}" | head -n1)"
[[ -n "${EXPECTED_HASH}" ]] || fail "No checksum entry found for ${ASSET_NAME} in ${CHECKSUMS_NAME}."

ACTUAL_HASH="$(sha256_file "${ARCHIVE_PATH}")"
[[ "${EXPECTED_HASH}" == "${ACTUAL_HASH}" ]] \
  || fail "Checksum mismatch for ${ASSET_NAME}. Expected ${EXPECTED_HASH}, got ${ACTUAL_HASH}."

mkdir -p "${EXTRACT_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"

SOURCE_BINARY="${EXTRACT_DIR}/promptlm-cli/promptlm-cli"
[[ -f "${SOURCE_BINARY}" ]] || fail "Expected binary not found in archive: ${SOURCE_BINARY}"
chmod +x "${SOURCE_BINARY}"

mkdir -p "${INSTALL_DIR}"
install -m 0755 "${SOURCE_BINARY}" "${INSTALL_DIR}/promptlm-cli"

"${INSTALL_DIR}/promptlm-cli" --version >/dev/null \
  || fail "Installed binary failed to execute: ${INSTALL_DIR}/promptlm-cli --version"

echo "Installed promptlm-cli ${VERSION} to ${INSTALL_DIR}/promptlm-cli"
case ":$PATH:" in
  *":${INSTALL_DIR}:"*) ;;
  *)
    echo "Add ${INSTALL_DIR} to your PATH to run promptlm-cli globally."
    ;;
esac
