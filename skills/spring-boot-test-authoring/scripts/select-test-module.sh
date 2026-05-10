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
  select-test-module.sh --intent <controller|json|rest-client|data-jpa|full-integration|modulith> --io <sync|async> --db <none|container|embedded>

Description:
  Select the strict Spring test annotation/module set for the desired behavior.
EOF
}

INTENT=""
IO_MODE=""
DB_MODE=""

while (( $# > 0 )); do
  case "$1" in
    --intent)
      INTENT="${2:-}"
      shift 2
      ;;
    --io)
      IO_MODE="${2:-}"
      shift 2
      ;;
    --db)
      DB_MODE="${2:-}"
      shift 2
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

require_arg "${INTENT}" "--intent"
require_arg "${IO_MODE}" "--io"
require_arg "${DB_MODE}" "--db"

VALID_INTENTS=(controller json rest-client data-jpa full-integration modulith)
VALID_IO=(sync async)
VALID_DB=(none container embedded)

in_list "${INTENT}" "${VALID_INTENTS[@]}" || die "Invalid --intent value '${INTENT}'."
in_list "${IO_MODE}" "${VALID_IO[@]}" || die "Invalid --io value '${IO_MODE}'."
in_list "${DB_MODE}" "${VALID_DB[@]}" || die "Invalid --db value '${DB_MODE}'."

if in_list "${INTENT}" controller json rest-client && [[ "${DB_MODE}" != "none" ]]; then
  die "Intent '${INTENT}' must use '--db none'. Database mode '${DB_MODE}' is invalid for this slice."
fi

if [[ "${INTENT}" == "data-jpa" && "${IO_MODE}" == "async" ]]; then
  warn "Async IO mode usually implies cross-boundary behavior. Consider full-integration or modulith intent."
fi

if [[ "${INTENT}" == "modulith" && "${DB_MODE}" == "embedded" ]]; then
  warn "Embedded DB can hide production integration behavior in modulith flows; use container DB when fidelity matters."
fi

case "${INTENT}" in
  controller)
    cat <<EOF
intent=${INTENT}
annotation=@WebMvcTest
support=MockMvc
bean_override=@MockitoBean
db_strategy=none
test_dependencies=spring-boot-starter-test
notes=Use MVC slice and mock collaborators explicitly.
EOF
    ;;
  json)
    cat <<EOF
intent=${INTENT}
annotation=@JsonTest
support=JacksonTester
bean_override=not-applicable
db_strategy=none
test_dependencies=spring-boot-starter-test
notes=Test serialization/deserialization contracts only.
EOF
    ;;
  rest-client)
    cat <<EOF
intent=${INTENT}
annotation=@RestClientTest
support=MockRestServiceServer
bean_override=@MockitoBean (if needed)
db_strategy=none
test_dependencies=spring-boot-starter-test
notes=Isolate outbound HTTP client behavior and error handling.
EOF
    ;;
  data-jpa)
    if [[ "${DB_MODE}" == "container" ]]; then
      cat <<EOF
intent=${INTENT}
annotation=@DataJpaTest
support=Repository + transaction rollback
bean_override=rare
db_strategy=container + @ServiceConnection
test_dependencies=spring-boot-starter-test,spring-boot-testcontainers,org.testcontainers:<db-module>
notes=Prefer container DB for dialect fidelity and schema realism.
EOF
    else
      cat <<EOF
intent=${INTENT}
annotation=@DataJpaTest
support=Repository + transaction rollback
bean_override=rare
db_strategy=${DB_MODE}
test_dependencies=spring-boot-starter-test
notes=Use for repository behavior that does not require full app wiring.
EOF
    fi
    ;;
  full-integration)
    if [[ "${DB_MODE}" == "container" ]]; then
      cat <<EOF
intent=${INTENT}
annotation=@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
support=TestRestTemplate or HTTP client
bean_override=avoid unless absolutely necessary
db_strategy=container + @ServiceConnection
test_dependencies=spring-boot-starter-test,spring-boot-testcontainers,org.testcontainers:<db-module>
notes=Use for cross-layer behavior and real infrastructure integration.
EOF
    else
      cat <<EOF
intent=${INTENT}
annotation=@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
support=TestRestTemplate or HTTP client
bean_override=avoid unless absolutely necessary
db_strategy=${DB_MODE}
test_dependencies=spring-boot-starter-test
notes=Use only when behavior crosses multiple slice boundaries.
EOF
    fi
    ;;
  modulith)
    cat <<EOF
intent=${INTENT}
annotation=@ApplicationModuleTest
support=Scenario-based module/event verification
bean_override=rare
db_strategy=${DB_MODE}
test_dependencies=spring-modulith-starter-test,spring-boot-starter-test
notes=Focus on module boundaries and domain events.
EOF
    ;;
  *)
    die "Unhandled intent '${INTENT}'."
    ;;
esac
