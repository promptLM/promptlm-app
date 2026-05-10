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

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

usage() {
  cat <<'EOF'
Usage:
  ensure-tools.sh [--profile <lint|scaffold|verify-maven|verify-gradle|full>] [--tool <command>] [--install-missing]

Description:
  Check required commands and optionally install missing ones.

Examples:
  bash scripts/ensure-tools.sh --profile lint
  bash scripts/ensure-tools.sh --profile verify-maven --install-missing
  bash scripts/ensure-tools.sh --tool rg --tool mvn --install-missing
EOF
}

PROFILE="full"
INSTALL_MISSING="false"
declare -a TOOLS=()

while (( $# > 0 )); do
  case "$1" in
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --tool)
      TOOLS+=("${2:-}")
      shift 2
      ;;
    --install-missing)
      INSTALL_MISSING="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

set_auto_install_from_flag "${INSTALL_MISSING}"

if (( ${#TOOLS[@]} == 0 )); then
  case "${PROFILE}" in
    lint)
      TOOLS=(bash rg awk)
      ;;
    scaffold)
      TOOLS=(bash)
      ;;
    verify-maven)
      TOOLS=(bash mvn)
      ;;
    verify-gradle)
      if [[ -f "./gradlew" ]]; then
        TOOLS=(bash)
      else
        TOOLS=(bash gradle)
      fi
      ;;
    full)
      TOOLS=(bash rg awk)
      [[ -f "pom.xml" ]] && TOOLS+=(mvn)
      if [[ -f "build.gradle" || -f "build.gradle.kts" ]]; then
        if [[ ! -f "./gradlew" ]]; then
          TOOLS+=(gradle)
        fi
      fi
      ;;
    *)
      die "Unknown --profile value '${PROFILE}'."
      ;;
  esac
fi

for tool in "${TOOLS[@]}"; do
  [[ -n "${tool}" ]] || die "Tool name cannot be empty."
  ensure_cmd "${tool}" "tool bootstrap"
done

info "All required tools are available."
