#!/usr/bin/env bash
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
  verify-test.sh --build-tool <maven|gradle> --scope <module|class> --selector <value> [--lint-path <path>] [--install-missing]

Examples:
  verify-test.sh --build-tool maven --scope module --selector path/to/module
  verify-test.sh --build-tool maven --scope class --selector UserControllerWebMvcTest
  verify-test.sh --build-tool gradle --scope class --selector com.example.UserControllerTest
EOF
}

BUILD_TOOL=""
SCOPE=""
SELECTOR=""
LINT_PATH=""
INSTALL_MISSING="false"

while (( $# > 0 )); do
  case "$1" in
    --build-tool)
      BUILD_TOOL="${2:-}"
      shift 2
      ;;
    --scope)
      SCOPE="${2:-}"
      shift 2
      ;;
    --selector)
      SELECTOR="${2:-}"
      shift 2
      ;;
    --lint-path)
      LINT_PATH="${2:-}"
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

if [[ -z "${BUILD_TOOL}" ]]; then
  BUILD_TOOL="$(detect_build_tool)"
fi
set_auto_install_from_flag "${INSTALL_MISSING}"

require_arg "${SCOPE}" "--scope"
require_arg "${SELECTOR}" "--selector"

in_list "${BUILD_TOOL}" maven gradle || die "Invalid --build-tool value '${BUILD_TOOL}'."
in_list "${SCOPE}" module class || die "Invalid --scope value '${SCOPE}'."

if [[ -n "${LINT_PATH}" ]]; then
  if [[ "$(normalize_bool "${INSTALL_MISSING}")" == "true" ]]; then
    bash "${SCRIPT_DIR}/lint-test-style.sh" --path "${LINT_PATH}" --install-missing
  else
    bash "${SCRIPT_DIR}/lint-test-style.sh" --path "${LINT_PATH}"
  fi
fi

if [[ "${BUILD_TOOL}" == "maven" ]]; then
  ensure_cmd mvn "executing Maven tests"
  if [[ "${SCOPE}" == "module" ]]; then
    mvn -B -ntp -pl "${SELECTOR}" test
  else
    mvn -B -ntp -Dtest="${SELECTOR}" test
  fi
  exit 0
fi

if [[ -f "./gradlew" ]]; then
  GRADLE_CMD=(bash "./gradlew")
else
  ensure_cmd gradle "executing Gradle tests"
  GRADLE_CMD=(gradle)
fi

if [[ "${SCOPE}" == "module" ]]; then
  if [[ "${SELECTOR}" != :* ]]; then
    SELECTOR=":${SELECTOR}"
  fi
  "${GRADLE_CMD[@]}" "${SELECTOR}:test"
else
  "${GRADLE_CMD[@]}" test --tests "${SELECTOR}"
fi
