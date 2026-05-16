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

package dev.promptlm.store.github;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import dev.promptlm.store.api.RepositoryGenerationConfig;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RemoteGitRepositoryProvisionerConfigTest {

    @Test
    void shouldRejectNullConfig() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://example.invalid");
        properties.setUsername("alice");

        RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties);

        assertThatThrownBy(() -> provisioner.createRemoteRepository(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("config");
    }

    /**
     * Drives the existence check via {@link RepositoryGenerationConfig} and
     * asserts that {@code RemoteRepositoryAlreadyExistsException} is thrown
     * when the target repository already exists. This guards the new code path
     * that consumes the config object end-to-end.
     */
    @Test
    void shouldThrowWhenRepositoryAlreadyExistsUsingConfig() {
        try (FakeGitHubApi api = FakeGitHubApi.start(true)) {
            GitHubProperties properties = new GitHubProperties();
            properties.setBaseUrl(api.baseApiUrl());
            properties.setEndpoint(api.baseApiUrl());
            properties.setUsername("alice");
            properties.setToken("token");

            RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties);

            RepositoryGenerationConfig config = new RepositoryGenerationConfig(
                    "repo", "owner", "custom desc", "trunk", false, null);

            assertThatThrownBy(() -> provisioner.createRemoteRepository(config))
                    .isInstanceOf(RemoteRepositoryAlreadyExistsException.class);

            assertThat(api.requestPaths()).contains("/api/v3/repos/owner/repo");
        }
    }

    private static final class FakeGitHubApi implements AutoCloseable {
        private final HttpServer server;
        private final List<String> requestPaths = new CopyOnWriteArrayList<>();
        private final boolean repositoryExists;

        private FakeGitHubApi(HttpServer server, boolean repositoryExists) {
            this.server = server;
            this.repositoryExists = repositoryExists;
        }

        static FakeGitHubApi start(boolean repositoryExists) {
            try {
                HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
                FakeGitHubApi fake = new FakeGitHubApi(server, repositoryExists);
                server.createContext("/", fake::handle);
                server.start();
                return fake;
            } catch (IOException ioException) {
                throw new RuntimeException("Failed to start fake GitHub API server for test", ioException);
            }
        }

        String baseApiUrl() {
            return "http://127.0.0.1:" + server.getAddress().getPort() + "/api/v3";
        }

        List<String> requestPaths() {
            return requestPaths;
        }

        private void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            requestPaths.add(path);

            if (path.endsWith("/repos/owner/repo")) {
                if (repositoryExists) {
                    writeJson(exchange, 200, """
                            {"full_name":"owner/repo","name":"repo"}
                            """);
                } else {
                    writeJson(exchange, 404, """
                            {"message":"Not Found"}
                            """);
                }
                return;
            }

            writeJson(exchange, 200, "{}");
        }

        private static void writeJson(HttpExchange exchange, int statusCode, String body) throws IOException {
            byte[] payload = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(statusCode, payload.length);
            exchange.getResponseBody().write(payload);
            exchange.close();
        }

        @Override
        public void close() {
            server.stop(0);
        }
    }
}
