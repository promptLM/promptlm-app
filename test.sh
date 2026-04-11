#!/bin/bash
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

set -e
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env.example"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  source "./$ENV_FILE"
  set +a
fi

cd "$ROOT_DIR/acceptance-tests"
PROMPTLM_TEST_GROUPS="${PROMPTLM_TEST_GROUPS:-integration}"
PROMPTLM_TEST_EXCLUDED_GROUPS="${PROMPTLM_TEST_EXCLUDED_GROUPS:-}"

mvn clean test \
  -DfailIfNoTests=true \
  -DfailIfNoSpecifiedTests=true \
  -Dpromptlm.test.groups="${PROMPTLM_TEST_GROUPS}" \
  -Dpromptlm.test.excludedGroups="${PROMPTLM_TEST_EXCLUDED_GROUPS}"

report_dir="target/surefire-reports"
if [ ! -d "$report_dir" ]; then
  echo "Acceptance tests did not run: surefire report directory is missing: $report_dir" >&2
  exit 1
fi

report_count=$(find "$report_dir" -maxdepth 1 -type f -name 'TEST-*.xml' | wc -l | tr -d ' ')
if [ "$report_count" -eq 0 ]; then
  echo "Acceptance tests did not run: no TEST-*.xml reports found in $report_dir" >&2
  exit 1
fi

executed_tests=$(
  (grep -hEo 'tests="[0-9]+"' "$report_dir"/TEST-*.xml || true) \
    | cut -d'"' -f2 \
    | awk '{sum+=$1} END {print sum+0}'
)

if [ "${executed_tests}" -eq 0 ]; then
  echo "Acceptance tests did not run: surefire reports show zero executed tests" >&2
  exit 1
fi
