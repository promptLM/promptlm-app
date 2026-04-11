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

package dev.promptlm.test;

import dev.promptlm.test.support.NativeBinaryLauncher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@NativeSmokeTest
class NativeWebappSmokeTest {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @TempDir
    private Path tempDir;

    private Process webappProcess;

    /**
     * Verifies the native webapp binary can start and serve readiness endpoints.
     */
    @Test
    @DisplayName("starts native webapp binary and exposes readiness endpoints")
    void shouldStartNativeWebappAndExposeReadinessEndpoints() throws IOException {
        Path userHome = tempDir.resolve("home");
        Files.createDirectories(userHome);

        int serverPort = findFreePort();
        Map<String, String> systemProperties = new LinkedHashMap<>();
        systemProperties.put("REPO_REMOTE_URL", "http://localhost.localtest.me:3003/api/v1");
        systemProperties.put("REPO_REMOTE_ALLOW_LOOPBACK_HOST_ALIASES", "true");

        NativeBinaryLauncher.RunningProcess runningProcess = NativeBinaryLauncher
                .startWebApplication(userHome, serverPort, systemProperties);
        webappProcess = runningProcess.process();

        URI healthUri = URI.create("http://127.0.0.1:" + serverPort + "/api/monitor/health");
        await()
                .atMost(Duration.ofMinutes(3))
                .pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    assertProcessAlive();
                    HttpResponse<String> response = get(healthUri);
                    assertThat(response.statusCode()).isBetween(200, 299);
                    assertThat(response.body()).contains("\"status\":\"UP\"");
                });

        URI capabilitiesUri = URI.create("http://127.0.0.1:" + serverPort + "/api/capabilities");
        await()
                .atMost(Duration.ofMinutes(1))
                .pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    assertProcessAlive();
                    HttpResponse<String> response = get(capabilitiesUri);
                    assertThat(response.statusCode()).isBetween(200, 299);
                    assertThat(response.body()).contains("\"features\"");
                });
    }

    @AfterEach
    void tearDown() {
        if (webappProcess == null) {
            return;
        }
        webappProcess.destroy();
        try {
            if (!webappProcess.waitFor(10, TimeUnit.SECONDS)) {
                webappProcess.destroyForcibly();
                webappProcess.waitFor(10, TimeUnit.SECONDS);
            }
        }
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            webappProcess.destroyForcibly();
        }
        finally {
            webappProcess = null;
        }
    }

    private static HttpResponse<String> get(URI uri) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .header("Accept", "application/json")
                .GET()
                .build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private void assertProcessAlive() {
        assertThat(webappProcess).isNotNull();
        assertThat(webappProcess.isAlive())
                .as("Native webapp process exited early with code %s", earlyExitCode(webappProcess))
                .isTrue();
    }

    private static String earlyExitCode(Process process) {
        if (process == null) {
            return "<unknown>";
        }
        try {
            return String.valueOf(process.exitValue());
        }
        catch (IllegalThreadStateException ignored) {
            return "<still-running>";
        }
    }

    private static int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            socket.setReuseAddress(true);
            return socket.getLocalPort();
        }
    }
}
