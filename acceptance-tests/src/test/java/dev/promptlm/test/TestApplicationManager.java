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

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.*;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterAll;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Base class for end-to-end tests that launch the web host application JAR
 * and initialize Playwright to interact with the frontend.
 */
public abstract class TestApplicationManager {

    private static final Logger log = LoggerFactory.getLogger(TestApplicationManager.class);

    private static final String DEFAULT_WEB_HOST_JAR_PATH = "../apps/promptlm-webapp/target/promptlm-webapp-0.1.0-SNAPSHOT-exec.jar";
    private static final String UI_PLACEHOLDER_MARKER = "PromptLM UI bundle placeholder";

    private static final int DEFAULT_SERVER_PORT = 8080;

    protected static int serverPort;

    protected static Process applicationProcess;

    @Deprecated
    static String startApplication(Path userHome) throws IOException {
        // Only start the application if it's not already running
        if (applicationProcess == null) {
            TestedApplication.start(JarFileResolver.resolveJarFile(), userHome);
        }
        return getBaseUrl();
    }

    static String startApplicationWithGitea(Path userHome, String giteaUrl, String username, String password) throws IOException {
        // Only start the application if it's not already running
        if (applicationProcess == null) {
            TestedApplication.startWithGitea(JarFileResolver.resolveJarFile(), userHome, giteaUrl, username, password);
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

    private static boolean isPortAvailable(int port) {
        try (ServerSocket socket = new ServerSocket(port)) {
            socket.setReuseAddress(true);
            return true;
        }
        catch (IOException e) {
            return false;
        }
    }

    private static String resolveJavaCommand() {
        String javaCommand = resolveJavaFromHome(System.getProperty("java.home"));
        if (javaCommand != null) {
            return javaCommand;
        }
        javaCommand = resolveJavaFromHome(System.getenv("JAVA_HOME"));
        if (javaCommand != null) {
            return javaCommand;
        }
        return "java";
    }

    private static String resolveJavaFromHome(String javaHome) {
        if (javaHome == null || javaHome.isBlank()) {
            return null;
        }
        Path javaPath = Paths.get(javaHome, "bin", isWindows() ? "java.exe" : "java");
        return Files.isExecutable(javaPath) ? javaPath.toString() : null;
    }

    private static boolean isWindows() {
        String osName = System.getProperty("os.name", "");
        return osName.toLowerCase().contains("win");
    }

    private static Integer parseDebugPort(String debugAddress) {
        if (debugAddress == null || debugAddress.isBlank()) {
            return null;
        }
        String trimmed = debugAddress.trim();
        int colonIndex = trimmed.lastIndexOf(':');
        String portToken = colonIndex >= 0 ? trimmed.substring(colonIndex + 1) : trimmed;
        try {
            return Integer.parseInt(portToken);
        }
        catch (NumberFormatException e) {
            return null;
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
     * Find the web host JAR file.
     */
    private static File findWebHostJarFile() {
        // First check the default location
        File jarFile = new File(DEFAULT_WEB_HOST_JAR_PATH);
        if (jarFile.exists()) {
            return jarFile;
        }

        // Try to find the web host JAR in the target directory
        File targetDir = new File("../apps/promptlm-webapp/target");
        if (targetDir.exists() && targetDir.isDirectory()) {
            File[] files = targetDir.listFiles((dir, name) ->
                                                       name.startsWith("promptlm-webapp") && name.endsWith("-exec.jar") && !name.contains("sources") && !name.contains("javadoc"));

            if (files != null && files.length > 0) {
                // Use the first matching JAR file found
                return files[0];
            }
        }

        // If no JAR is found, return the default path (it will fail with a clear message)
        return jarFile;
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

    private static class TestedApplication {
        public static void start(File jarFile, Path userHome) {
            startWithGitea(jarFile, userHome, null, null, null);
        }

        public static void startWithGitea(File jarFile, Path userHome, String giteaUrl, String username, String password) {

            try {
                log.debug("USER HOME: " + userHome);
                log.debug("Starting web host from JAR: " + jarFile.getAbsolutePath());
                if (giteaUrl != null) {
                    log.debug("Gitea URL: " + giteaUrl);
                    log.debug("Gitea Username: " + username);
                }

                // Set the server port
                serverPort = findPort();

                if(!jarFile.exists()) {
                    throw new IllegalStateException("JAR file does not exist: " + jarFile.getAbsolutePath() + ". Build the project first.");
                }

                // Start the application JAR. Legacy CLI jars require the "serve" command,
                // while the dedicated web host app starts directly.
                // Enable JDWP only when explicitly requested; default is off to avoid accidental suspend
                String suspendDebugger = System.getProperty("jdwp.suspend",
                        System.getenv().getOrDefault("JDWP_SUSPEND", "n"));
                String debugAddress = System.getProperty("jdwp.address",
                        System.getenv().getOrDefault("JDWP_ADDRESS", "*:5005"));
                boolean enableDebugger = Boolean.parseBoolean(
                        System.getProperty("jdwp.enable",
                                System.getenv().getOrDefault("JDWP_ENABLE", "false")));
                if (enableDebugger) {
                    Integer debugPort = parseDebugPort(debugAddress);
                    if (debugPort != null && !isPortAvailable(debugPort)) {
                        log.warn("JDWP debug port {} is already in use. Disabling debugger for test run.", debugPort);
                        enableDebugger = false;
                    }
                }
                // Build command arguments dynamically
                java.util.List<String> args = new java.util.ArrayList<>();
                args.add(resolveJavaCommand());
                args.add("-Djava.util.logging.ConsoleHandler.level=ALL");
                // Set test environment variables to disable OpenAI and other external services
                if (enableDebugger) {
                    args.add("-agentlib:jdwp=transport=dt_socket,server=y,suspend=" + suspendDebugger + ",address=" + debugAddress);
                }
                args.add("-Duser.home=" + userHome.toAbsolutePath());
                args.add("-Dserver.port=" + serverPort);
                
                // Enable more detailed logging for debugging
                args.add("-Dlogging.level.org.springframework.web=DEBUG");
                args.add("-Dlogging.level.dev.promptlm=DEBUG");
                args.add("-Dserver.error.include-stacktrace=always");
                args.add("-Dserver.error.include-message=always");

                if (giteaUrl != null) {
                    args.add("-Dgitea.url=" + giteaUrl);
                    args.add("-DREPO_REMOTE_URL=" + giteaUrl + "/api/v1");
                    args.add("-Dpromptlm.store.remote.endpoint=" + giteaUrl + "/api/v1");
                    // Set Gitea credentials for GitHub client authentication
                    if (username != null && password != null) {
                        args.add("-DREPO_REMOTE_USERNAME=" + username);
                        args.add("-DREPO_REMOTE_TOKEN=" + password);
                    }
                }
                
                args.add("-jar");
                args.add(jarFile.getAbsolutePath());
                if (jarFile.getName().startsWith("promptlm-cli")) {
                    args.add("serve");
                }

                ProcessBuilder processBuilder = new ProcessBuilder(args);
                String javaHome = System.getProperty("java.home");
                if (javaHome != null && !javaHome.isBlank()) {
                    processBuilder.environment().putIfAbsent("JAVA_HOME", javaHome);
                    Path javaBin = Paths.get(javaHome, "bin");
                    String existingPath = processBuilder.environment().getOrDefault("PATH", "");
                    String javaBinPath = javaBin.toString();
                    if (!existingPath.contains(javaBinPath)) {
                        String separator = File.pathSeparator;
                        String updatedPath = existingPath.isBlank()
                                ? javaBinPath
                                : javaBinPath + separator + existingPath;
                        processBuilder.environment().put("PATH", updatedPath);
                    }
                }

                // Redirect process output to console for debugging
                processBuilder.redirectErrorStream(true);

                applicationProcess = processBuilder.start();

                Thread outputThread = new Thread(() -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(applicationProcess.getInputStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            log.info("[SERVER] " + line);
                            // Output already logged via log.debug above
                        }
                    } catch (IOException e) {
                        String message = e.getMessage();
                        boolean streamClosed = message != null && message.contains("Stream closed");
                        boolean processStopped = applicationProcess == null || !applicationProcess.isAlive();
                        if (streamClosed && processStopped) {
                            log.debug("Server output stream closed after process shutdown.");
                            return;
                        }
                        log.warn("Stopped reading server output: {}", message, e);
                    }
                }, "promptlm-test-app-output");
                outputThread.setDaemon(true); // Mark as daemon thread so it doesn't prevent JVM exit
                outputThread.start();

                waitForApplicationToStart(serverPort);

                log.debug("Web application started on port: " + serverPort);
            }
            catch (Exception e) {
                throw new RuntimeException("Failed to start application", e);
            }
        }
    }

    private static class JarFileResolver {
        public static File resolveJarFile() {
            // Find the web host JAR file
            File webHostJarFile = findWebHostJarFile();
            if (!webHostJarFile.exists()) {
                throw new RuntimeException("Web host JAR not found at " + webHostJarFile.getAbsolutePath() +
                                                   ". Please build the web host first.");
            }
            return webHostJarFile;
        }
    }
}
