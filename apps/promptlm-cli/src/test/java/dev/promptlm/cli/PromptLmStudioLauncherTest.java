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
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.http.HttpClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.mock;
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
    void startsStudioInProcessAndWaitsForReadiness() throws IOException {
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
            String result = launcher.launch(port, true);
            assertEquals("PromptLM Studio is running at http://127.0.0.1:" + port + "/", result);
        }
        finally {
            if (startedServer[0] != null) {
                startedServer[0].stop(0);
            }
        }
    }

    @Test
    void resolvesRuntimePortWhenRequestedPortIsZero() throws IOException {
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
            String result = launcher.launch(0, true);
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
