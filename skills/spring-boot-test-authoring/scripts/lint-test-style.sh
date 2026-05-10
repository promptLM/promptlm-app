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
  lint-test-style.sh --path <test-file-or-directory> [--install-missing]

Description:
  Enforce strict Spring Boot test style and anti-pattern rules.
EOF
}

TARGET_PATH=""
INSTALL_MISSING="false"

while (( $# > 0 )); do
  case "$1" in
    --path)
      TARGET_PATH="${2:-}"
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

require_arg "${TARGET_PATH}" "--path"
[[ -e "${TARGET_PATH}" ]] || die "Path does not exist: ${TARGET_PATH}"
set_auto_install_from_flag "${INSTALL_MISSING}"
ensure_cmd rg "linting Java tests"
ensure_cmd awk "extracting test method names"

declare -a files=()
if [[ -d "${TARGET_PATH}" ]]; then
  while IFS= read -r line; do
    files+=("${line}")
  done < <(rg --files "${TARGET_PATH}" -g '*Test.java' -g '*Tests.java')
else
  files=("${TARGET_PATH}")
fi

(( ${#files[@]} > 0 )) || die "No Java test files found under: ${TARGET_PATH}"

violations=0

report_violation() {
  local file="$1"
  local reason="$2"
  echo "VIOLATION: ${file}: ${reason}" >&2
  violations=$((violations + 1))
}

for file in "${files[@]}"; do
  [[ -f "${file}" ]] || continue

  if rg -q '@MockBean' "${file}"; then
    report_violation "${file}" "Use @MockitoBean instead of @MockBean."
  fi

  if rg -q '@SpringBootTest' "${file}" && rg -q '@(WebMvcTest|DataJpaTest|JsonTest|RestClientTest|GraphQlTest|JdbcTest|JooqTest)' "${file}"; then
    report_violation "${file}" "Do not combine @SpringBootTest with slice annotations in the same class."
  fi

  if rg -q '@SpringBootTest' "${file}" && ! rg -q 'webEnvironment[[:space:]]*=' "${file}"; then
    report_violation "${file}" "@SpringBootTest must declare webEnvironment explicitly."
  fi

  if rg -q '@DirtiesContext' "${file}" && ! rg -q 'dirties-context-justification:' "${file}"; then
    report_violation "${file}" "@DirtiesContext requires an inline 'dirties-context-justification:' comment."
  fi

  if rg -q '@Testcontainers' "${file}" && ! rg -q '@ServiceConnection' "${file}"; then
    report_violation "${file}" "Prefer @ServiceConnection for container wiring."
  fi

  if ! rg -q 'assertThat\(|\.andExpect\(|Assertions\.|assertEquals\(|assertTrue\(|assertFalse\(|assertThrows\(' "${file}"; then
    report_violation "${file}" "No assertion found. Add strong assertions."
  fi

  declare -a test_methods=()
  while IFS= read -r method_name; do
    test_methods+=("${method_name}")
  done < <(awk '
    /@Test/ { expect_method=1; next }
    expect_method && $0 ~ /void[[:space:]]+[A-Za-z0-9_]+[[:space:]]*\(/ {
      line = $0
      sub(/.*void[[:space:]]+/, "", line)
      sub(/[[:space:]]*\(.*/, "", line)
      print line
      expect_method=0
      next
    }
    expect_method && $0 !~ /^[[:space:]]*$/ && $0 !~ /^[[:space:]]*@/ {
      expect_method=0
    }
  ' "${file}")

  local_method=""
  for local_method in "${test_methods[@]:-}"; do
    [[ -n "${local_method}" ]] || continue
    if [[ ! "${local_method}" =~ ^should[A-Za-z0-9]+When[A-Za-z0-9]+$ ]]; then
      report_violation "${file}" "Test method '${local_method}' must match shouldXWhenY pattern."
    fi
  done
done

if (( violations > 0 )); then
  die "lint-test-style failed with ${violations} violation(s)."
fi

info "lint-test-style passed for ${#files[@]} file(s)."
