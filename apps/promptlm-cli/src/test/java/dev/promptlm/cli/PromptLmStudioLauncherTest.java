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

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationListener;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.core.env.ConfigurableEnvironment;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PromptLmStudioLauncherTest {

    @Test
    void returnsRunningMessageWhenStudioAlreadyAvailable() throws IOException {
        int port = findFreePort();
        HttpServer server = startPromptLmServer(port);
        try {
            PromptLmStudioLauncher launcher = new PromptLmStudioLauncher(
                    HttpClient.newHttpClient(),
                    p -> {
                        fail("Studio starter must not be invoked when PromptLM Studio is already running.");
                        return mock(ConfigurableApplicationContext.class);
                    }
            );

            String result = launcher.launch(port, true);

            assertEquals("PromptLM Studio is running at http://127.0.0.1:" + port + "/", result);
        }
        finally {
            server.stop(0);
        }
    }

    @Test
    void throwsWhenPortIsOccupiedByAnotherService() throws IOException {
        int port = findFreePort();
        try (ServerSocket socket = new ServerSocket(port)) {
            socket.setReuseAddress(true);

            PromptLmStudioLauncher launcher = new PromptLmStudioLauncher(
                    HttpClient.newHttpClient(),
                    p -> {
                        fail("Studio starter must not run when the requested port is unavailable.");
                        return mock(ConfigurableApplicationContext.class);
                    }
            );

            IllegalStateException exception = assertThrows(IllegalStateException.class, () -> launcher.launch(port, true));
            assertEquals("Port " + port + " is already in use by another service. Stop it or choose a different port with `promptlm studio --port <port>`.",
                    exception.getMessage());
        }
    }

    @Test
    void startsStudioInProcessAndWaitsForReadiness() throws Exception {
        int port = findFreePort();
        HttpServer[] startedServer = new HttpServer[1];

        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.isActive()).thenReturn(true);

        PromptLmStudioLauncher launcher = new PromptLmStudioLauncher(
                HttpClient.newHttpClient(),
                p -> {
                    try {
                        HttpServer server = startPromptLmServer(p);
                        startedServer[0] = server;
                        return context;
                    }
                    catch (IOException e) {
                        throw new IllegalStateException("Failed to start embedded test server", e);
                    }
                }
        );

        try {
            String result = launchAndStop(launcher, port, context);
            assertEquals("PromptLM Studio is running at http://127.0.0.1:" + port + "/", result);
        }
        finally {
            if (startedServer[0] != null) {
                startedServer[0].stop(0);
            }
        }
    }

    @Test
    void resolvesRuntimePortWhenRequestedPortIsZero() throws Exception {
        HttpServer[] startedServer = new HttpServer[1];

        ConfigurableEnvironment environment = mock(ConfigurableEnvironment.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.isActive()).thenReturn(true);
        when(context.getEnvironment()).thenReturn(environment);

        PromptLmStudioLauncher launcher = new PromptLmStudioLauncher(
                HttpClient.newHttpClient(),
                p -> {
                    try {
                        HttpServer server = startPromptLmServer(0);
                        startedServer[0] = server;
                        int actualPort = server.getAddress().getPort();
                        when(environment.getProperty("local.server.port")).thenReturn(String.valueOf(actualPort));
                        return context;
                    }
                    catch (IOException e) {
                        throw new IllegalStateException("Failed to start embedded test server", e);
                    }
                }
        );

        try {
            String result = launchAndStop(launcher, 0, context);
            assertEquals("PromptLM Studio is running at http://127.0.0.1:"
                            + startedServer[0].getAddress().getPort() + "/",
                    result);
        }
        finally {
            if (startedServer[0] != null) {
                startedServer[0].stop(0);
            }
        }
    }

    @Test
    void launchBlocksUntilContextClosedAfterReadiness() throws Exception {
        int port = findFreePort();
        HttpServer[] startedServer = new HttpServer[1];

        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(context.isActive()).thenReturn(true);

        PromptLmStudioLauncher launcher = new PromptLmStudioLauncher(
                HttpClient.newHttpClient(),
                p -> {
                    try {
                        HttpServer server = startPromptLmServer(p);
                        startedServer[0] = server;
                        return context;
                    }
                    catch (IOException e) {
                        throw new IllegalStateException("Failed to start embedded test server", e);
                    }
                }
        );

        try {
            CompletableFuture<String> launchFuture = CompletableFuture.supplyAsync(() -> launcher.launch(port, true));

            // Capture the ContextClosedEvent listener registered by the launcher; under the
            // production code path Spring's shutdown publishes the event automatically.
            @SuppressWarnings({"unchecked", "rawtypes"})
            ArgumentCaptor<ApplicationListener> listenerCaptor = ArgumentCaptor.forClass(ApplicationListener.class);
            assertEventually(() -> {
                verify(context, atLeastOnce()).addApplicationListener(listenerCaptor.capture());
                return null;
            });

            // The launcher must still be blocked at this point — readiness was reached but
            // no ContextClosedEvent has been fired yet.
            assertThrows(TimeoutException.class, () -> launchFuture.get(200, TimeUnit.MILLISECONDS));

            @SuppressWarnings("unchecked")
            ApplicationListener<ContextClosedEvent> capturedListener = listenerCaptor.getValue();
            capturedListener.onApplicationEvent(new ContextClosedEvent(context));

            String result = launchFuture.get(5, TimeUnit.SECONDS);
            assertThat(result).isEqualTo("PromptLM Studio is running at http://127.0.0.1:" + port + "/");
        }
        finally {
            if (startedServer[0] != null) {
                startedServer[0].stop(0);
            }
        }
    }

    /**
     * Runs `launch()` on a background thread, fires a ContextClosedEvent on the mock context
     * once the launcher has registered its listener, and returns the launch result.
     */
    private static String launchAndStop(PromptLmStudioLauncher launcher,
                                        int port,
                                        ConfigurableApplicationContext context)
            throws InterruptedException, ExecutionException, TimeoutException {
        CompletableFuture<String> launchFuture = CompletableFuture.supplyAsync(() -> launcher.launch(port, true));
        @SuppressWarnings({"unchecked", "rawtypes"})
        ArgumentCaptor<ApplicationListener> listenerCaptor = ArgumentCaptor.forClass(ApplicationListener.class);
        assertEventually(() -> {
            verify(context, atLeastOnce()).addApplicationListener(listenerCaptor.capture());
            return null;
        });
        @SuppressWarnings("unchecked")
        ApplicationListener<ContextClosedEvent> capturedListener = listenerCaptor.getValue();
        capturedListener.onApplicationEvent(new ContextClosedEvent(context));
        return launchFuture.get(5, TimeUnit.SECONDS);
    }

    private static void assertEventually(ThrowingSupplier action) {
        Duration timeout = Duration.ofSeconds(5);
        long deadline = System.nanoTime() + timeout.toNanos();
        Throwable last = null;
        while (System.nanoTime() < deadline) {
            try {
                action.get();
                return;
            }
            catch (Throwable t) {
                last = t;
                try {
                    Thread.sleep(50);
                }
                catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new AssertionError("Interrupted", ie);
                }
            }
        }
        throw new AssertionError("Condition not met within " + timeout, last);
    }

    @FunctionalInterface
    private interface ThrowingSupplier {
        Object get() throws Throwable;
    }

    private static HttpServer startPromptLmServer(int port) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/api/monitor/health", exchange -> sendJson(exchange, 200, "{\"status\":\"UP\"}"));
        server.createContext("/api/capabilities", exchange -> sendJson(exchange, 200, "{\"features\":[]}"));
        server.start();
        return server;
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String body) throws IOException {
        byte[] bytes = body.getBytes();
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(bytes);
        }
    }

    private static int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            socket.setReuseAddress(true);
            return socket.getLocalPort();
        }
    }
}
