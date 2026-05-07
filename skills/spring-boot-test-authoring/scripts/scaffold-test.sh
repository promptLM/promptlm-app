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
  scaffold-test.sh --intent <controller|json|rest-client|data-jpa|full-integration|modulith> --class <fully.qualified.ClassName> --target <directory> [--io <sync|async>] [--db <none|container|embedded>]

Description:
  Generate a strict Spring Boot test skeleton using shouldXWhenY naming and AAA layout.
EOF
}

INTENT=""
CLASS_FQCN=""
TARGET_DIR=""
IO_MODE="sync"
DB_MODE="none"

while (( $# > 0 )); do
  case "$1" in
    --intent)
      INTENT="${2:-}"
      shift 2
      ;;
    --class)
      CLASS_FQCN="${2:-}"
      shift 2
      ;;
    --target)
      TARGET_DIR="${2:-}"
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
require_arg "${CLASS_FQCN}" "--class"
require_arg "${TARGET_DIR}" "--target"

[[ "${CLASS_FQCN}" == *.* ]] || die "--class must be fully qualified (package + class)."

PACKAGE_NAME="${CLASS_FQCN%.*}"
CLASS_NAME="${CLASS_FQCN##*.}"

VALID_INTENTS=(controller json rest-client data-jpa full-integration modulith)
VALID_IO=(sync async)
VALID_DB=(none container embedded)

in_list "${INTENT}" "${VALID_INTENTS[@]}" || die "Invalid --intent value '${INTENT}'."
in_list "${IO_MODE}" "${VALID_IO[@]}" || die "Invalid --io value '${IO_MODE}'."
in_list "${DB_MODE}" "${VALID_DB[@]}" || die "Invalid --db value '${DB_MODE}'."

bash "${SCRIPT_DIR}/select-test-module.sh" --intent "${INTENT}" --io "${IO_MODE}" --db "${DB_MODE}" >/dev/null

PACKAGE_PATH="$(echo "${PACKAGE_NAME}" | tr '.' '/')"
OUTPUT_DIR="${TARGET_DIR%/}/${PACKAGE_PATH}"
mkdir -p "${OUTPUT_DIR}"

case "${INTENT}" in
  controller) TEST_CLASS="${CLASS_NAME}WebMvcTest" ;;
  json) TEST_CLASS="${CLASS_NAME}JsonTest" ;;
  rest-client) TEST_CLASS="${CLASS_NAME}RestClientTest" ;;
  data-jpa) TEST_CLASS="${CLASS_NAME}DataJpaTest" ;;
  full-integration) TEST_CLASS="${CLASS_NAME}IntegrationTest" ;;
  modulith) TEST_CLASS="${CLASS_NAME}ModuleTest" ;;
  *) die "Unhandled intent '${INTENT}'." ;;
esac

OUTPUT_FILE="${OUTPUT_DIR}/${TEST_CLASS}.java"
[[ ! -f "${OUTPUT_FILE}" ]] || die "Refusing to overwrite existing file: ${OUTPUT_FILE}"

case "${INTENT}" in
  controller)
    cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ${CLASS_NAME}.class)
class ${TEST_CLASS} {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnOkWhenRequestIsValid() throws Exception {
        // Arrange

        // Act + Assert
        mockMvc.perform(get("/todo"))
                .andExpect(status().isOk());
    }
}
EOF
    ;;
  json)
    cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.json.test.autoconfigure.JsonTest;
import org.springframework.boot.json.test.JacksonTester;

import static org.assertj.core.api.Assertions.assertThat;

@JsonTest
class ${TEST_CLASS} {

    @Autowired
    private JacksonTester<${CLASS_NAME}> json;

    @Test
    void shouldRoundTripJsonWhenContractIsStable() throws Exception {
        // Arrange + Act

        // Assert
        assertThat(json).isNotNull();
    }
}
EOF
    ;;
  rest-client)
    cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.test.web.client.MockRestServiceServer;

import static org.assertj.core.api.Assertions.assertThat;

@RestClientTest(${CLASS_NAME}.class)
class ${TEST_CLASS} {

    @Autowired
    private ${CLASS_NAME} client;

    @Autowired
    private MockRestServiceServer server;

    @Test
    void shouldReturnResponseWhenRemoteCallSucceeds() {
        // Arrange

        // Act
        Object result = client;

        // Assert
        assertThat(result).isNotNull();
    }
}
EOF
    ;;
  data-jpa)
    cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ${TEST_CLASS} {

    @Autowired
    private ${CLASS_NAME} repository;

    @Test
    void shouldPersistEntityWhenRepositorySavesAggregate() {
        // Arrange

        // Act
        Object saved = repository;

        // Assert
        assertThat(saved).isNotNull();
    }
}
EOF
    ;;
  full-integration)
    if [[ "${DB_MODE}" == "container" ]]; then
      cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class ${TEST_CLASS} {

    @Autowired
    private TestRestTemplate restTemplate;

    @TestConfiguration(proxyBeanMethods = false)
    static class ContainersConfig {
        @Bean
        @ServiceConnection
        PostgreSQLContainer<?> postgres() {
            return new PostgreSQLContainer<>("postgres:16-alpine");
        }
    }

    @Test
    void shouldExposeHealthyResponseWhenApplicationStarts() {
        // Arrange

        // Act
        String body = restTemplate.getForObject("/actuator/health", String.class);

        // Assert
        assertThat(body).contains("UP");
    }
}
EOF
    else
      cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class ${TEST_CLASS} {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldExposeHealthyResponseWhenApplicationStarts() {
        // Arrange

        // Act
        String body = restTemplate.getForObject("/actuator/health", String.class);

        // Assert
        assertThat(body).contains("UP");
    }
}
EOF
    fi
    ;;
  modulith)
    cat > "${OUTPUT_FILE}" <<EOF
package ${PACKAGE_NAME};

import ${CLASS_FQCN};
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.modulith.test.Scenario;

import static org.assertj.core.api.Assertions.assertThat;

@ApplicationModuleTest
class ${TEST_CLASS} {

    @Autowired
    private Scenario scenario;

    @Test
    void shouldHandlePublishedEventWhenModuleFlowRuns() {
        // Arrange

        // Act
        Object result = scenario;

        // Assert
        assertThat(result).isNotNull();
    }
}
EOF
    ;;
  *)
    die "Unhandled intent '${INTENT}'."
    ;;
esac

echo "Created ${OUTPUT_FILE}"
