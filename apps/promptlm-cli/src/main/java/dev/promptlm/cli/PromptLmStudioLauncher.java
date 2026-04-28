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

import dev.promptlm.webapp.PromptLmWebAppApplication;
import org.springframework.aot.AotDetector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationContextFactory;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.servlet.context.AnnotationConfigServletWebServerApplicationContext;
import org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;

@Component
public class PromptLmStudioLauncher {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration STARTUP_TIMEOUT = Duration.ofMinutes(10);
    private static final Duration PROBE_INTERVAL = Duration.ofSeconds(1);

    private final HttpClient httpClient;
    private final StudioApplicationStarter studioApplicationStarter;

    @Autowired
    public PromptLmStudioLauncher() {
        this(HttpClient.newBuilder()
                        .connectTimeout(CONNECT_TIMEOUT)
                        .followRedirects(HttpClient.Redirect.NORMAL)
                        .build(),
                new SpringBootStudioApplicationStarter());
    }

    PromptLmStudioLauncher(HttpClient httpClient, StudioApplicationStarter studioApplicationStarter) {
        this.httpClient = httpClient;
        this.studioApplicationStarter = studioApplicationStarter;
    }

    public String launch(int port, boolean noBrowser) {
        URI requestedBaseUri = baseUriForPort(port);
        if (port > 0 && isPromptLmRunning(requestedBaseUri)) {
            if (!noBrowser) {
                openBrowser(requestedBaseUri);
            }
            return "PromptLM Studio is running at " + requestedBaseUri;
        }
        if (port > 0 && !isPortAvailable(port)) {
            throw new IllegalStateException("Port %d is already in use by another service. Stop it or choose a different port with `promptlm studio --port <port>`."
                    .formatted(port));
        }

        ConfigurableApplicationContext studioContext = startStudioContext(port, requestedBaseUri);
        try {
            URI baseUri = resolveBaseUri(port, studioContext);
            waitForStartup(baseUri, studioContext);
            if (!noBrowser) {
                openBrowser(baseUri);
            }
            return "PromptLM Studio is running at " + baseUri;
        }
        catch (RuntimeException ex) {
            closeQuietly(studioContext);
            throw ex;
        }
    }

    private static URI resolveBaseUri(int configuredPort, ConfigurableApplicationContext studioContext) {
        if (configuredPort > 0) {
            return baseUriForPort(configuredPort);
        }
        int runningPort = resolveRunningPort(studioContext);
        if (runningPort <= 0) {
            throw new IllegalStateException("PromptLM Studio started but no HTTP port could be resolved from the application context.");
        }
        return baseUriForPort(runningPort);
    }

    private static int resolveRunningPort(ConfigurableApplicationContext studioContext) {
        String localServerPort = studioContext.getEnvironment().getProperty("local.server.port");
        int port = parsePort(localServerPort);
        if (port > 0) {
            return port;
        }
        if (studioContext instanceof ServletWebServerApplicationContext servletContext
                && servletContext.getWebServer() != null
                && servletContext.getWebServer().getPort() > 0) {
            return servletContext.getWebServer().getPort();
        }
        return parsePort(studioContext.getEnvironment().getProperty("server.port"));
    }

    private static int parsePort(String value) {
        if (value == null || value.isBlank()) {
            return -1;
        }
        try {
            return Integer.parseInt(value.trim());
        }
        catch (NumberFormatException ex) {
            return -1;
        }
    }

    private static URI baseUriForPort(int port) {
        return URI.create("http://127.0.0.1:" + port + "/");
    }

    private ConfigurableApplicationContext startStudioContext(int port, URI baseUri) {
        try {
            System.out.println("Starting PromptLM Studio in-process on " + baseUri);
            return studioApplicationStarter.start(port);
        }
        catch (RuntimeException ex) {
            throw new IllegalStateException("Failed to start PromptLM Studio in-process", ex);
        }
    }

    private void waitForStartup(URI baseUri, ConfigurableApplicationContext studioContext) {
        long deadline = System.nanoTime() + STARTUP_TIMEOUT.toNanos();
        ProbeResult lastHealth = ProbeResult.unreachable();
        ProbeResult lastCapabilities = ProbeResult.unreachable();

        while (System.nanoTime() < deadline) {
            if (!studioContext.isActive()) {
                throw new IllegalStateException("PromptLM Studio context closed before startup completed");
            }
            lastHealth = probe(baseUri.resolve("api/monitor/health"), body -> body.contains("\"status\":\"UP\""));
            lastCapabilities = probe(baseUri.resolve("api/capabilities"), body -> body.contains("\"features\""));
            if (lastHealth.success() && lastCapabilities.success()) {
                return;
            }
            sleep(PROBE_INTERVAL);
        }

        throw new IllegalStateException("PromptLM Studio failed to start within %d seconds. Last health probe: %s. Last capabilities probe: %s."
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

    private void openBrowser(URI baseUri) {
        if (tryOpenWithDesktop(baseUri)) {
            return;
        }
        tryOpenWithSystemCommand(baseUri);
    }

    private static boolean tryOpenWithDesktop(URI baseUri) {
        try {
            if (!Desktop.isDesktopSupported()) {
                return false;
            }
            Desktop desktop = Desktop.getDesktop();
            if (!desktop.isSupported(Desktop.Action.BROWSE)) {
                return false;
            }
            desktop.browse(baseUri);
            return true;
        }
        catch (IOException | UnsupportedOperationException | SecurityException ignored) {
            return false;
        }
        catch (LinkageError ignored) {
            // Native images may not include AWT desktop libs.
            return false;
        }
    }

    private static void tryOpenWithSystemCommand(URI baseUri) {
        List<String> command = browserCommandForCurrentOs(baseUri.toString());
        if (command.isEmpty()) {
            return;
        }
        try {
            new ProcessBuilder(command)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .redirectError(ProcessBuilder.Redirect.DISCARD)
                    .start();
        }
        catch (IOException | SecurityException ignored) {
            // Manual navigation is still possible using the printed URL.
        }
    }

    private static List<String> browserCommandForCurrentOs(String url) {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (osName.contains("mac")) {
            return List.of("open", url);
        }
        if (osName.contains("win")) {
            return List.of("rundll32", "url.dll,FileProtocolHandler", url);
        }
        if (osName.contains("nux") || osName.contains("nix") || osName.contains("aix")) {
            return List.of("xdg-open", url);
        }
        return List.of();
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
            throw new IllegalStateException("Interrupted while waiting for PromptLM Studio startup", ex);
        }
    }

    private static String abbreviate(String body) {
        if (body == null || body.isBlank()) {
            return "<empty>";
        }
        return body.length() <= 120 ? body : body.substring(0, 117) + "...";
    }

    private static void closeQuietly(ConfigurableApplicationContext studioContext) {
        try {
            studioContext.close();
        }
        catch (RuntimeException ignored) {
            // Preserve original startup failures.
        }
    }

    private interface BodyMatcher {
        boolean matches(String body);
    }

    @FunctionalInterface
    interface StudioApplicationStarter {
        ConfigurableApplicationContext start(int port);
    }

    private static final class SpringBootStudioApplicationStarter implements StudioApplicationStarter {

        @Override
        public ConfigurableApplicationContext start(int port) {
            return new SpringApplicationBuilder(PromptLmWebAppApplication.class)
                    .main(PromptLmWebAppApplication.class)
                    .contextFactory(studioContextFactory())
                    .web(WebApplicationType.SERVLET)
                    .headless(false)
                    .logStartupInfo(false)
                    .properties(
                            "debug=false",
                            "spring.application.name=promptlm-webapp",
                            "spring.main.banner-mode=off",
                            "server.port=" + port,
                            "promptlm.cli.runner.enabled=false",
                            "spring.shell.interactive.enabled=false",
                            "spring.shell.noninteractive.enabled=false",
                            "management.endpoints.web.base-path=/api/monitor",
                            "management.endpoints.web.exposure.include=health,info",
                            "management.endpoints.web.path-mapping.health=health",
                            "management.endpoint.health.probes.enabled=true"
                    )
                    .run();
        }

        private static ApplicationContextFactory studioContextFactory() {
            return ApplicationContextFactory.of(() -> AotDetector.useGeneratedArtifacts()
                    ? new ServletWebServerApplicationContext()
                    : new AnnotationConfigServletWebServerApplicationContext());
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
            if (statusCode < 0) {
                return detail;
            }
            return "status=%d body=%s".formatted(statusCode, detail);
        }
    }
}
