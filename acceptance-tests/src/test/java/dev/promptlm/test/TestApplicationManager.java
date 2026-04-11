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

import java.io.IOException;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

import dev.promptlm.test.support.JarApplicationLauncher;
import org.junit.jupiter.api.AfterAll;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Base class for end-to-end tests that launch the web host application JAR
 * and initialize Playwright to interact with the frontend.
 */
public abstract class TestApplicationManager {

    private static final Logger log = LoggerFactory.getLogger(TestApplicationManager.class);

    private static final String UI_PLACEHOLDER_MARKER = "PromptLM UI bundle placeholder";

    private static final int DEFAULT_SERVER_PORT = 8080;

    protected static int serverPort;

    protected static Process applicationProcess;

    @Deprecated
    static String startApplication(java.nio.file.Path userHome) throws IOException {
        // Only start the application if it's not already running
        if (applicationProcess == null) {
            serverPort = findPort();
            applicationProcess = JarApplicationLauncher
                    .startWebApplication(userHome, serverPort, Map.of())
                    .process();
            try {
                waitForApplicationToStart(serverPort);
            }
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Interrupted while waiting for web application startup", e);
            }
        }
        return getBaseUrl();
    }

    static String startApplicationWithGitea(java.nio.file.Path userHome, String giteaUrl, String username, String password) throws IOException {
        // Only start the application if it's not already running
        if (applicationProcess == null) {
            serverPort = findPort();
            Map<String, String> systemProperties = new LinkedHashMap<>();
            if (giteaUrl != null) {
                systemProperties.put("gitea.url", giteaUrl);
                systemProperties.put("REPO_REMOTE_URL", giteaUrl + "/api/v1");
                systemProperties.put("promptlm.store.remote.endpoint", giteaUrl + "/api/v1");
                if (username != null && password != null) {
                    systemProperties.put("REPO_REMOTE_USERNAME", username);
                    systemProperties.put("REPO_REMOTE_TOKEN", password);
                }
            }
            applicationProcess = JarApplicationLauncher
                    .startWebApplication(userHome, serverPort, systemProperties)
                    .process();
            try {
                waitForApplicationToStart(serverPort);
            }
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Interrupted while waiting for web application startup", e);
            }
        }
        return getBaseUrl();
    }

    private static int findPort() {

        try (ServerSocket socket = new ServerSocket(DEFAULT_SERVER_PORT)) {
            socket.setReuseAddress(true);
            return DEFAULT_SERVER_PORT;
        }
        catch (IOException e) {
            return findAvailablePort();
        }
    }

    private static int findAvailablePort() {

        try (ServerSocket socket = new ServerSocket(0)) {
            socket.setReuseAddress(true);
            return socket.getLocalPort();
        }
        catch (IOException e) {
            throw new RuntimeException("No available port found", e);
        }
    }

    @AfterAll
    @Deprecated
    static void stopApplication() {


        try {
            // Stop the application process
            if (applicationProcess != null) {
                try {
                    applicationProcess.destroy();
                    // Wait for the process to terminate
                    if (!applicationProcess.waitFor(10, TimeUnit.SECONDS)) {
                        // Force terminate if it doesn't exit gracefully
                        applicationProcess.destroyForcibly();
                    }
                }
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                applicationProcess = null;
            }
        }
        catch (Exception e) {
            System.err.println("Error during cleanup: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Wait for the application to start
     */
    private static void waitForApplicationToStart(int port) throws InterruptedException {

        log.debug("Waiting for application to start on port {}...", port);

        // Maximum wait time in seconds
        int maxWaitTimeSeconds = 600;
        boolean isStarted = false;

        HttpClient client = HttpClient.newHttpClient();
        URI uri = URI.create("http://localhost:" + port + "/api/monitor/health");

        long startTime = System.currentTimeMillis();
        long endTime = startTime + (maxWaitTimeSeconds * 1000);

        while (System.currentTimeMillis() < endTime && !isStarted) {
            if (applicationProcess != null && !applicationProcess.isAlive()) {
                int exitCode = applicationProcess.exitValue();
                throw new IllegalStateException("Application process exited early with code " + exitCode);
            }
            try {
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .version(HttpClient.Version.HTTP_1_1)
                        .header("Accept", "application/json")
                        .GET()
                        .build();
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                int status = response.statusCode();
                String body = response.body();
                isStarted = status >= 200 && status < 300 && body != null && body.contains("\"status\":\"UP\"");
                if (!isStarted) {
                    log.debug("Health probe response: status={}, body={}", status, body);
                }
            }
            catch (IOException | InterruptedException e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                // treat as not started and retry
            }

            if (!isStarted) {
                TimeUnit.SECONDS.sleep(1);
                log.debug("Waiting for application startup...");
            }
        }

        log.debug("Application startup check completed");

        if (!isStarted) {
            throw new RuntimeException("Application failed to start within " + maxWaitTimeSeconds + " seconds");
        }

        // Additional wait to ensure the application is fully initialized
        TimeUnit.SECONDS.sleep(2);
        assertUiBundleAvailable(port);
    }

    private static void assertUiBundleAvailable(int port) throws InterruptedException {
        HttpClient client = HttpClient.newHttpClient();
        URI uri = URI.create("http://localhost:" + port + "/");

        int maxWaitTimeSeconds = 30;
        long endTime = System.currentTimeMillis() + (maxWaitTimeSeconds * 1000L);
        while (System.currentTimeMillis() < endTime) {
            if (applicationProcess != null && !applicationProcess.isAlive()) {
                int exitCode = applicationProcess.exitValue();
                throw new IllegalStateException("Application process exited before UI bundle check, code " + exitCode);
            }
            try {
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .version(HttpClient.Version.HTTP_1_1)
                        .header("Accept", "text/html")
                        .GET()
                        .build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                int status = response.statusCode();
                String body = response.body();
                if (status >= 200 && status < 300 && body != null) {
                    if (body.contains(UI_PLACEHOLDER_MARKER)) {
                        throw new IllegalStateException(
                                "UI bundle is missing: received placeholder HTML instead of built frontend assets. "
                                        + "Ensure promptlm-webapp is built with promptlm.webapp.ui.skip=false and the web UI workspace is available."
                        );
                    }
                    if (!body.isBlank()) {
                        return;
                    }
                }
            }
            catch (IOException e) {
                // retry while server finishes startup
            }
            TimeUnit.SECONDS.sleep(1);
        }
        throw new IllegalStateException("Timed out waiting for web UI root page to become available on port " + port);
    }

    /**
     * Get the base URL for the application
     */
    protected static String getBaseUrl() {

        return "http://localhost:" + serverPort;
    }

    /**
     * Take a screenshot and save it to the target directory
     */
    protected void takeScreenshot(String name) {
        // Create the screenshots directory if it doesn't exist
        try {
            Files.createDirectories(Paths.get("target/screenshots"));
        }
        catch (IOException e) {
            System.err.println("Failed to create screenshots directory: " + e.getMessage());
        }
    }

}
