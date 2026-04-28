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

if command -v vfox &>/dev/null; then
  eval "$(vfox activate bash)"
  vfox use java@25.0.1-graalce
fi

JAVA_VERSION_OUTPUT=$(java -version 2>&1)

if ! echo "$JAVA_VERSION_OUTPUT" | grep -qi "graalvm"; then
  echo "ERROR: GraalVM JDK required for a native build, but found:"
  echo "$JAVA_VERSION_OUTPUT"
  exit 1
fi

if ! echo "$JAVA_VERSION_OUTPUT" | grep -qE '"(21|25)\.'; then
  echo "ERROR: GraalVM JDK 21 or 25 required, but found:"
  echo "$JAVA_VERSION_OUTPUT"
  exit 1
fi

./build-jdk.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="$ROOT_DIR/.env.example"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

echo "acceptance test normal build"
PROMPTLM_TEST_GROUPS=integration PROMPTLM_TEST_EXCLUDED_GROUPS= ./test.sh

echo "Native build"
mvn -B -Pnative -pl apps/promptlm-cli,apps/promptlm-webapp -am -DskipTests package

echo "acceptance test native smoke"
mvn -B -f "$ROOT_DIR/acceptance-tests/pom.xml" \
  -DfailIfNoTests=true \
  -DfailIfNoSpecifiedTests=true \
  -Dpromptlm.test.groups=native-smoke \
  -Dpromptlm.test.excludedGroups= \
  -Dpromptlm.test.cli.native.path="$ROOT_DIR/apps/promptlm-cli/target/promptlm-cli" \
  -Dpromptlm.test.webapp.native.path="$ROOT_DIR/apps/promptlm-webapp/target/promptlm-webapp" \
  test
