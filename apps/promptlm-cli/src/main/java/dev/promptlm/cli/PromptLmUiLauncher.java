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

package dev.promptlm.cli;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class PromptLmUiLauncher {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration STARTUP_TIMEOUT = Duration.ofMinutes(10);
    private static final Duration PROBE_INTERVAL = Duration.ofSeconds(1);

    private final PromptLmUiPathResolver pathResolver;
    private final HttpClient httpClient;

    @Autowired
    public PromptLmUiLauncher(PromptLmUiPathResolver pathResolver) {
        this(pathResolver, HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build());
    }

    PromptLmUiLauncher(PromptLmUiPathResolver pathResolver, HttpClient httpClient) {
        this.pathResolver = pathResolver;
        this.httpClient = httpClient;
    }

    public String launch(int port, boolean noBrowser) {
        URI baseUri = URI.create("http://127.0.0.1:" + port + "/");
        if (isPromptLmRunning(baseUri)) {
            if (!noBrowser) {
                openBrowser(baseUri);
            }
            return "PromptLM UI is running at " + baseUri;
        }
        if (!isPortAvailable(port)) {
            throw new IllegalStateException("Port %d is already in use by another service. Stop it or choose a different port with `promptlm ui --port <port>`."
                    .formatted(port));
        }

        PromptLmUiPathResolver.LaunchTarget launchTarget = pathResolver.resolve(port);
        System.out.println("Starting PromptLM UI via " + launchTarget.description() + " on " + baseUri);

        Process process = startProcess(launchTarget);
        Thread shutdownHook = new Thread(() -> stopProcess(process), "promptlm-ui-shutdown");
        Runtime.getRuntime().addShutdownHook(shutdownHook);

        try {
            waitForStartup(baseUri, process);
            attachWaiter(process, shutdownHook);
            if (!noBrowser) {
                openBrowser(baseUri);
            }
            return "PromptLM UI is running at " + baseUri;
        }
        catch (RuntimeException ex) {
            stopProcess(process);
            removeShutdownHook(shutdownHook);
            throw ex;
        }
    }

    private Process startProcess(PromptLmUiPathResolver.LaunchTarget launchTarget) {
        ProcessBuilder processBuilder = new ProcessBuilder(launchTarget.command())
                .directory(launchTarget.workingDirectory().toFile())
                .redirectInput(ProcessBuilder.Redirect.INHERIT)
                .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                .redirectError(ProcessBuilder.Redirect.INHERIT);
        inheritJavaHome(processBuilder.environment());
        try {
            return processBuilder.start();
        }
        catch (IOException ex) {
            throw new IllegalStateException("Failed to start PromptLM UI via " + launchTarget.description(), ex);
        }
    }

    private void waitForStartup(URI baseUri, Process process) {
        long deadline = System.nanoTime() + STARTUP_TIMEOUT.toNanos();
        ProbeResult lastHealth = ProbeResult.unreachable();
        ProbeResult lastCapabilities = ProbeResult.unreachable();

        while (System.nanoTime() < deadline) {
            if (!process.isAlive()) {
                throw new IllegalStateException("PromptLM UI exited early with code " + process.exitValue());
            }
            lastHealth = probe(baseUri.resolve("api/monitor/health"), body -> body.contains("\"status\":\"UP\""));
            lastCapabilities = probe(baseUri.resolve("api/capabilities"), body -> body.contains("\"features\""));
            if (lastHealth.success() && lastCapabilities.success()) {
                return;
            }
            sleep(PROBE_INTERVAL);
        }

        throw new IllegalStateException("PromptLM UI failed to start within %d seconds. Last health probe: %s. Last capabilities probe: %s."
                .formatted(STARTUP_TIMEOUT.toSeconds(), lastHealth.summary(), lastCapabilities.summary()));
    }

    private boolean isPromptLmRunning(URI baseUri) {
        return probe(baseUri.resolve("api/capabilities"), body -> body.contains("\"features\"")).success();
    }

    private ProbeResult probe(URI uri, BodyMatcher bodyMatcher) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(CONNECT_TIMEOUT)
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body() == null ? "" : response.body();
            boolean ok = response.statusCode() >= 200 && response.statusCode() < 300 && bodyMatcher.matches(body);
            return new ProbeResult(ok, response.statusCode(), abbreviate(body));
        }
        catch (IOException ex) {
            return ProbeResult.failure(ex.getClass().getSimpleName());
        }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while probing " + uri, ex);
        }
    }

    private void attachWaiter(Process process, Thread shutdownHook) {
        Thread waiter = new Thread(() -> {
            try {
                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    System.err.println("PromptLM UI exited with code " + exitCode);
                }
            }
            catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
            finally {
                removeShutdownHook(shutdownHook);
            }
        }, "promptlm-ui-process-waiter");
        waiter.setDaemon(true);
        waiter.start();
    }

    private void openBrowser(URI baseUri) {
        if (!Desktop.isDesktopSupported()) {
            return;
        }
        try {
            Desktop desktop = Desktop.getDesktop();
            if (desktop.isSupported(Desktop.Action.BROWSE)) {
                desktop.browse(baseUri);
            }
        }
        catch (IOException | UnsupportedOperationException ignored) {
            // Manual navigation is still possible using the printed URL.
        }
    }

    private static void stopProcess(Process process) {
        if (!process.isAlive()) {
            return;
        }
        process.destroy();
        try {
            if (!process.waitFor(10, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                process.waitFor(10, TimeUnit.SECONDS);
            }
        }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
        }
    }

    private static void inheritJavaHome(Map<String, String> environment) {
        String javaHome = System.getProperty("java.home");
        if (javaHome == null || javaHome.isBlank()) {
            return;
        }
        environment.putIfAbsent("JAVA_HOME", javaHome);
        Path javaBin = Path.of(javaHome, "bin");
        String javaBinPath = javaBin.toString();
        String path = environment.getOrDefault("PATH", "");
        if (!path.contains(javaBinPath)) {
            environment.put("PATH", path.isBlank() ? javaBinPath : javaBinPath + java.io.File.pathSeparator + path);
        }
    }

    private static boolean isPortAvailable(int port) {
        try (ServerSocket socket = new ServerSocket(port)) {
            socket.setReuseAddress(true);
            return true;
        }
        catch (IOException ex) {
            return false;
        }
    }

    private static void sleep(Duration duration) {
        try {
            Thread.sleep(duration.toMillis());
        }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for PromptLM UI startup", ex);
        }
    }

    private static String abbreviate(String body) {
        if (body == null || body.isBlank()) {
            return "<empty>";
        }
        return body.length() <= 120 ? body : body.substring(0, 117) + "...";
    }

    private static void removeShutdownHook(Thread shutdownHook) {
        try {
            Runtime.getRuntime().removeShutdownHook(shutdownHook);
        }
        catch (IllegalStateException ignored) {
            // JVM shutdown is already in progress.
        }
    }

    private record ProbeResult(boolean success, int statusCode, String detail) {
        static ProbeResult unreachable() {
            return new ProbeResult(false, -1, "unreachable");
        }

        static ProbeResult failure(String detail) {
            return new ProbeResult(false, -1, detail);
        }

        String summary() {
            return statusCode >= 0 ? statusCode + " " + detail : detail;
        }
    }

    @FunctionalInterface
    private interface BodyMatcher {
        boolean matches(String body);
    }
}
