/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.webapp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(
        classes = PromptLmWebAppApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.ai.openai.api-key=test-mock-api-key-for-testing",
                "spring.ai.anthropic.api-key=test-mock-anthropic-api-key-for-testing",
                "promptlm.store.remote.username=testuser",
                "promptlm.store.remote.token=",
                "promptlm.store.remote.base-url=http://localhost:3003/api/v1"
        }
)
@AutoConfigureTestRestTemplate
class PromptLmWebAppSmokeTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void hostServesSpaApiDocsAndActuatorHealth() {
        ResponseEntity<String> root = restTemplate.getForEntity("http://localhost:" + port + "/", String.class);
        assertThat(root.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(root.getBody()).contains("<div id=\"root\"");

        ResponseEntity<String> deepRoute = restTemplate.getForEntity("http://localhost:" + port + "/projects/example", String.class);
        assertThat(deepRoute.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(deepRoute.getBody()).contains("<div id=\"root\"");

        ResponseEntity<String> health = restTemplate.getForEntity("http://localhost:" + port + "/api/monitor/health", String.class);
        assertThat(health.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(health.getBody()).contains("\"status\":\"UP\"");

        await()
                .atMost(Duration.ofSeconds(60))
                .ignoreExceptions()
                .untilAsserted(() -> {
                    ResponseEntity<String> apiDocs = restTemplate.getForEntity("http://localhost:" + port + "/v3/api-docs", String.class);
                    assertThat(apiDocs.getStatusCode().is2xxSuccessful()).isTrue();
                    assertThat(apiDocs.getBody()).contains("\"openapi\"");
                });

        ResponseEntity<String> swaggerUi = restTemplate.getForEntity("http://localhost:" + port + "/swagger-ui/index.html", String.class);
        assertThat(swaggerUi.getStatusCode().is2xxSuccessful()).isTrue();
    }
}
