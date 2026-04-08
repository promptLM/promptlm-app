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

package dev.promptlm.web;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.awaitility.Awaitility;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.util.StreamUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.ai.openai.api-key=test-mock-api-key-for-testing",
    "spring.ai.anthropic.api-key=test-mock-anthropic-api-key-for-testing",
    "promptlm.store.remote.username=testuser",
    "promptlm.store.remote.token=",
    "promptlm.store.remote.base-url=http://localhost:3003/api/v1"
})
@AutoConfigureTestRestTemplate
class PromptStoreControllerTest {

    private static final String ORIGINAL_USERDIR = System.getProperty("user.home");

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @Autowired
    private SseEmitterRegistry emitterRegistry;

    @Autowired
    private SseStatusPublisher sseStatusPublisher;

    @BeforeAll
    static void beforeAll(@TempDir Path tempDir) throws IOException {
        System.setProperty("user.home",  tempDir.toAbsolutePath().toString());
    }

    @AfterAll
    static void afterAll() throws IOException {
        System.setProperty("user.home",  ORIGINAL_USERDIR);
    }

    @Test
    void shouldReceiveStoreStatusEvents() throws Exception {
        String operationId = "store-op-1";
        String key = "store:" + operationId;
        String url = "http://localhost:" + port + "/api/store/events/" + operationId;

        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "text/event-stream");

        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<String> result = executor.submit(() -> {
            RequestEntity<Void> request = new RequestEntity<>(headers, HttpMethod.GET, URI.create(url));

            String execute = restTemplate.execute(
                    request.getUrl(), request.getMethod(), null,
                    (ClientHttpResponse response) -> {
                        return StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
                    });
            return execute;
        });

        Awaitility.await().atMost(3, TimeUnit.SECONDS)
                .until(() -> emitterRegistry.findEmitter(key).isPresent());

        sseStatusPublisher.progress(key, "store", "Clone in progress", java.util.Map.of(
                "operationId", operationId,
                "phase", "clone"
        ));

        emitterRegistry.findEmitter(key).ifPresent(emitter -> {
            emitter.complete();
        });

        String received = result.get(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        assertThat(received).contains("event:status");
        assertThat(received).contains("\"status\":\"connected\"");
        assertThat(received).contains("\"status\":\"progress\"");
        assertThat(received).contains("\"operation\":\"store\"");
        assertThat(received).contains("\"operationId\":\"store-op-1\"");
        assertThat(received).contains("\"phase\":\"clone\"");
    }
}
