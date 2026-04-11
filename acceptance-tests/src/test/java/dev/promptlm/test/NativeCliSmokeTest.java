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
import dev.promptlm.testutils.gitea.Gitea;
import dev.promptlm.testutils.gitea.GiteaContainer;
import dev.promptlm.testutils.gitea.WithGitea;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@WithGitea(actionsEnabled = true)
@NativeSmokeTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class NativeCliSmokeTest {

    private static final Duration CLI_TIMEOUT = Duration.ofMinutes(3);
    private static final String UI_WEBAPP_WRAPPER = """
            #!/usr/bin/env bash
            set -euo pipefail
            exec "%s" "$@"
            """;

    @TempDir
    private static Path tempDir;

    private Path userHome;
    private Path workspaceRoot;
    private Map<String, String> nativeSystemProperties;
    private String repositoryName;
    private String repositorySlug;
    private String repositoryGitUrl;

    @BeforeEach
    void setUp(@Gitea GiteaContainer giteaContainer) throws IOException {
        String runId = UUID.randomUUID().toString().replace("-", "");
        repositoryName = "native-smoke-" + runId;
        repositorySlug = giteaContainer.getAdminUsername() + "/" + repositoryName;
        repositoryGitUrl = giteaContainer.getWebUrl() + "/" + repositorySlug + ".git";

        Path testRoot = tempDir.resolve("case-" + runId);
        userHome = testRoot.resolve("home");
        workspaceRoot = userHome.resolve("workspace");
        Files.createDirectories(workspaceRoot);

        nativeSystemProperties = new LinkedHashMap<>();
        nativeSystemProperties.put("REPO_REMOTE_URL", giteaContainer.getWebUrl() + "/api/v1");
        nativeSystemProperties.put("REPO_REMOTE_USERNAME", giteaContainer.getAdminUsername());
        nativeSystemProperties.put("REPO_REMOTE_TOKEN", giteaContainer.getAdminToken());
        nativeSystemProperties.put("promptlm.store.remote.endpoint", giteaContainer.getWebUrl() + "/api/v1");
        nativeSystemProperties.put("REPO_REMOTE_ALLOW_LOOPBACK_HOST_ALIASES", "true");
    }

    /**
     * Verifies repo creation succeeds with the native CLI binary.
     */
    @Test
    @Order(1)
    @DisplayName("repo create command succeeds")
    void shouldRunRepoCreateCommand() throws IOException {
        Path createdRepository = createRepository();
        assertThat(createdRepository.resolve(".git")).isDirectory();
    }

    /**
     * Verifies prompt creation succeeds with the native CLI binary.
     */
    @Test
    @Order(2)
    @DisplayName("prompt create command succeeds")
    void shouldRunPromptCreateCommand() throws IOException {
        createRepository();
        String promptId = createPrompt();
        assertThat(promptId).isNotBlank();
    }

    /**
     * Verifies prompt show succeeds with the native CLI binary.
     */
    @Test
    @Order(3)
    @DisplayName("prompt show command succeeds")
    void shouldRunPromptShowCommand() throws IOException {
        createRepository();
        String promptId = createPrompt();

        NativeBinaryLauncher.CommandResult showPrompt = runCliCommand(List.of("prompt", "show", "--id", promptId));
        assertCommandSucceeded(showPrompt);
        assertThat(showPrompt.output()).contains(promptId);
    }

    /**
     * Verifies prompt change command returns the expected deprecation message with the native CLI binary.
     */
    @Test
    @Order(4)
    @DisplayName("prompt change command succeeds with deprecation output")
    void shouldRunPromptChangeCommand() throws IOException {
        createRepository();
        String promptId = createPrompt();

        NativeBinaryLauncher.CommandResult changePrompt = runCliCommand(
                List.of("prompt", "change", "--id", promptId, "--userMessage", "updated-smoke-prompt"));
        assertCommandSucceeded(changePrompt);
        assertThat(changePrompt.output()).contains("prompt change is no longer supported in the CLI");
    }

    /**
     * Verifies prompt release succeeds with the native CLI binary.
     */
    @Test
    @Order(5)
    @DisplayName("prompt release command succeeds")
    void shouldRunPromptReleaseCommand() throws IOException {
        createRepository();
        String promptId = createPrompt();

        NativeBinaryLauncher.CommandResult releasePrompt = runCliCommand(List.of("prompt", "release", "--id", promptId));
        assertCommandSucceeded(releasePrompt);
        assertThat(releasePrompt.output()).contains("-SNAPSHOT");
    }

    /**
     * Verifies repo use succeeds with the native CLI binary.
     */
    @Test
    @Order(6)
    @DisplayName("repo use command succeeds")
    void shouldRunRepoUseCommand() throws IOException {
        Path createdRepository = createRepository();

        NativeBinaryLauncher.CommandResult useRepository = runCliCommand(
                List.of("repo", "use", "--path", createdRepository.toString()));
        assertCommandSucceeded(useRepository);
        assertThat(useRepository.output()).contains("using repo");
    }

    /**
     * Verifies repo clone succeeds with the native CLI binary.
     */
    @Test
    @Order(7)
    @DisplayName("repo clone command succeeds")
    void shouldRunRepoCloneCommand() throws IOException {
        createRepository();

        Path cloneTargetRoot = workspaceRoot.resolve("cloned-repos");
        Files.createDirectories(cloneTargetRoot);
        NativeBinaryLauncher.CommandResult cloneRepository = runCliCommand(
                List.of("repo", "clone", "--repo", repositoryGitUrl, "--target", cloneTargetRoot.toString()));
        assertCommandSucceeded(cloneRepository);
        assertThat(cloneRepository.output()).contains("using repo");
        assertThat(cloneTargetRoot.resolve(repositoryName).resolve(".git")).isDirectory();
    }

    /**
     * Verifies ui command succeeds with the native CLI binary and releases the bound port afterwards.
     */
    @Test
    @Order(8)
    @DisplayName("ui command succeeds")
    void shouldRunUiCommand() throws IOException {
        createRepository();

        int uiPort = findFreePort();
        Path uiBundleRoot = workspaceRoot.resolve("ui-bundle");
        prepareUiBundle(uiBundleRoot);
        NativeBinaryLauncher.CommandResult uiCommand = runCliCommand(
                List.of("ui", "--port", String.valueOf(uiPort), "--no-browser", "true"),
                uiBundleRoot
        );
        assertCommandSucceeded(uiCommand);
        assertThat(uiCommand.output()).contains("PromptLM UI is running at");

        await()
                .atMost(Duration.ofSeconds(30))
                .pollInterval(Duration.ofSeconds(1))
                .until(() -> isPortAvailable(uiPort));
    }

    private Path createRepository() throws IOException {
        Path createdReposRoot = workspaceRoot.resolve("created-repos");
        Files.createDirectories(createdReposRoot);

        NativeBinaryLauncher.CommandResult createRepository = runCliCommand(
                List.of("repo", "create", "--dir", createdReposRoot.toString(), "--name", repositorySlug));
        assertCommandSucceeded(createRepository);
        assertThat(createRepository.output()).contains("created repository");

        Path createdRepository = createdReposRoot.resolve(repositoryName);
        assertThat(createdRepository.resolve(".git")).isDirectory();
        assertThat(createdRepository.resolve(".promptlm")).isDirectory();
        return createdRepository;
    }

    private String createPrompt() {
        NativeBinaryLauncher.CommandResult createPrompt = runCliCommand(
                List.of("prompt", "create",
                        "--name", "native-cli-prompt",
                        "--group", "native-smoke",
                        "--userMessage", "native-smoke-prompt",
                        "--placeholder", "topic=native"));
        assertCommandSucceeded(createPrompt);

        String promptId = lastNonBlankLine(createPrompt.output());
        assertThat(promptId).isNotBlank();
        return promptId;
    }

    private NativeBinaryLauncher.CommandResult runCliCommand(List<String> arguments) {
        return NativeBinaryLauncher.runCliCommand(userHome, nativeSystemProperties, arguments, CLI_TIMEOUT);
    }

    private NativeBinaryLauncher.CommandResult runCliCommand(List<String> arguments, Path workingDirectory) {
        return NativeBinaryLauncher.runCliCommand(userHome, nativeSystemProperties, arguments, CLI_TIMEOUT, workingDirectory);
    }

    private static void assertCommandSucceeded(NativeBinaryLauncher.CommandResult commandResult) {
        assertThat(commandResult.exitCode())
                .as("Native command exit code for %s from binary %s%nOutput:%n%s",
                        commandResult.command(),
                        commandResult.binaryPath(),
                        commandResult.output())
                .isZero();
        assertThat(commandResult.output()).isNotBlank();
        assertThat(commandResult.output()).doesNotContain("Command not found");
    }

    private static String lastNonBlankLine(String output) {
        String[] lines = output.split("\\R");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (!line.isBlank()) {
                return line;
            }
        }
        return "";
    }

    private static int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            socket.setReuseAddress(true);
            return socket.getLocalPort();
        }
    }

    private void prepareUiBundle(Path uiBundleRoot) throws IOException {
        Path binDirectory = uiBundleRoot.resolve("bin");
        Files.createDirectories(binDirectory);
        Path helperScript = binDirectory.resolve("promptlm-webapp");
        Path webappBinaryPath = NativeBinaryLauncher.resolveRequiredWebappBinaryPath();
        Files.writeString(helperScript, UI_WEBAPP_WRAPPER.formatted(webappBinaryPath.toAbsolutePath().normalize()));
        helperScript.toFile().setExecutable(true, false);
        assertThat(Files.isExecutable(helperScript))
                .as("UI helper wrapper must be executable: %s", helperScript)
                .isTrue();
    }

    private static boolean isPortAvailable(int port) {
        try (ServerSocket socket = new ServerSocket(port)) {
            socket.setReuseAddress(true);
            return true;
        }
        catch (IOException ignored) {
            return false;
        }
    }
}
