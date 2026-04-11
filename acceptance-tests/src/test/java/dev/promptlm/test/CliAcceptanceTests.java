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

import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.test.support.JarApplicationLauncher;
import dev.promptlm.test.support.GiteaRepositoryHelper;
import dev.promptlm.testutils.gitea.Gitea;
import dev.promptlm.testutils.gitea.GiteaContainer;
import dev.promptlm.testutils.gitea.WithGitea;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.net.http.HttpClient;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@WithGitea(actionsEnabled = true)
@IntegrationTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CliAcceptanceTests {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private static final String PROMPT_GROUP = "testgroup";
    private static final String PROMPT_NAME = "test-prompt";

    private final String runId = String.valueOf(System.currentTimeMillis());

    @TempDir
    private static Path tempDir;

    private Path userHome;
    private Path projectDir;
    private Map<String, String> cliSystemProperties;

    private GiteaContainer gitea;
    private String repoOwner;
    private String repoName;
    private String repoUrl;
    private String promptId;

    @BeforeAll
    void setUp(@Gitea GiteaContainer giteaContainer) throws IOException {
        this.gitea = giteaContainer;
        this.repoOwner = gitea.getAdminUsername();
        this.repoName = "cli-acceptance-" + runId;
        this.repoUrl = gitea.getWebUrl() + "/" + repoOwner + "/" + repoName;

        this.userHome = tempDir.resolve("home");
        this.projectDir = userHome.resolve("workspace");
        Files.createDirectories(userHome);

        this.cliSystemProperties = new LinkedHashMap<>();
        this.cliSystemProperties.put("REPO_REMOTE_URL", gitea.getWebUrl() + "/api/v1");
        this.cliSystemProperties.put("REPO_REMOTE_USERNAME", gitea.getAdminUsername());
        this.cliSystemProperties.put("REPO_REMOTE_TOKEN", gitea.getAdminToken());
        this.cliSystemProperties.put("promptlm.store.remote.endpoint", gitea.getWebUrl() + "/api/v1");
        this.cliSystemProperties.put("REPO_REMOTE_ALLOW_LOOPBACK_HOST_ALIASES", "true");
    }

    @Test
    @Order(1)
    @DisplayName("create project")
    void createProject() {
        String output = runCli("repo", "create",
                "--dir", projectDir.toString(),
                "--name", repoOwner + "/" + repoName);

        Path repoDir = projectDir.resolve(repoName);
        assertThat(repoDir).exists();
        assertThat(repoDir.resolve("prompts")).exists();
        assertThat(output).contains("created repository");
        assertThat(repoDir.resolve(".git")).exists();
    }

    @Test
    @Order(2)
    @DisplayName("add prompt")
    void addPrompt() {
        String output = runCli("prompt", "create",
                "--name", PROMPT_NAME,
                "--group", PROMPT_GROUP,
                "--userMessage", "\"Describe {{topic}} in {{tone}} tone\"",
                "--placeholder", "topic=quality,tone=friendly");

        promptId = lastNonBlankLine(output);
        assertThat(promptId).isNotBlank();

        String showOutput = runCli("prompt", "show", "--id", promptId);
        PromptSpec shownPrompt = parsePrompt(showOutput);
        assertThat(shownPrompt.getId()).isEqualTo(promptId);
        assertThat(shownPrompt.getVersion()).endsWith("-SNAPSHOT");
        assertThat(shownPrompt.getPlaceholders()).isNotNull();
        assertThat(shownPrompt.getPlaceholders().getDefaults())
                .containsEntry("topic", "quality")
                .containsEntry("tone", "friendly");
        assertThat(shownPrompt.getRequest()).isInstanceOf(ChatCompletionRequest.class);
        assertThat(((ChatCompletionRequest) shownPrompt.getRequest()).getMessages())
                .anyMatch(msg -> "user".equalsIgnoreCase(msg.getRole())
                                 && "Describe {{topic}} in {{tone}} tone".equals(msg.getContent()));

        PromptSpec developmentPrompt = waitForPromptSpec("development");
        assertThat(developmentPrompt.getId()).isEqualTo(promptId);
        assertThat(developmentPrompt.getVersion()).endsWith("-SNAPSHOT");
    }

    @Test
    @Order(3)
    @DisplayName("modify prompt command")
    void modifyPromptCommand() {
        String output = runCli("prompt", "change",
                "--id", promptId,
                "--userMessage", "Updated message");

        assertThat(output).contains("prompt change is no longer supported");
    }

    @Test
    @Order(4)
    @DisplayName("release prompt")
    void releasePrompt() {
        PromptSpec beforeRelease = waitForPromptSpec("development");
        String expectedReleaseVersion = normalizeReleaseVersion(beforeRelease.getVersion());
        String expectedNextDevelopmentVersion = nextDevelopmentVersion(expectedReleaseVersion);

        String releaseOutput = runCli("prompt", "release", "--id", promptId);
        assertThat(releaseOutput).contains(expectedNextDevelopmentVersion);

        PromptSpec mainPrompt = waitForPromptSpec("main");
        PromptSpec developmentPrompt = waitForPromptSpec("development");
        assertThat(mainPrompt.getVersion()).isEqualTo(expectedReleaseVersion);
        assertThat(developmentPrompt.getVersion()).isEqualTo(expectedNextDevelopmentVersion);
    }

    private PromptSpec waitForPromptSpec(String branch) {
        String relativePath = "prompts/%s/%s/promptlm.yml".formatted(
                PROMPT_GROUP.toLowerCase(Locale.ROOT),
                PROMPT_NAME.toLowerCase(Locale.ROOT)
        );

        return await()
                .atMost(2, TimeUnit.MINUTES)
                .pollInterval(Duration.ofSeconds(2))
                .until(() -> GiteaRepositoryHelper.fetchRawFile(
                                        HTTP_CLIENT,
                                        repoUrl,
                                        branch,
                                        relativePath,
                                        gitea.getAdminToken()
                                )
                                .map(this::parsePrompt),
                        Optional::isPresent)
                .orElseThrow();
    }

    private PromptSpec parsePrompt(String yaml) {
        return ObjectMapperFactory.createYamlMapper().readValue(yaml, PromptSpec.class);
    }

    private String runCli(String... args) {
        JarApplicationLauncher.CommandResult result = JarApplicationLauncher.runCliCommand(
                userHome,
                cliSystemProperties,
                Arrays.asList(args),
                Duration.ofMinutes(3)
        );
        String combined = result.output().trim();

        assertThat(result.exitCode())
                .as("CLI exit code for args %s from jar %s. Output:%n%s",
                        Arrays.toString(args),
                        result.jarPath(),
                        combined)
                .isZero();
        assertThat(combined)
                .as("CLI output for args %s".formatted(Arrays.toString(args)))
                .isNotBlank();
        return combined;
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

    private static String normalizeReleaseVersion(String version) {
        String snapshotSuffix = "-SNAPSHOT";
        if (version.endsWith(snapshotSuffix)) {
            return version.substring(0, version.length() - snapshotSuffix.length());
        }
        return version;
    }

    private static String nextDevelopmentVersion(String releaseVersion) {
        if (releaseVersion.matches("\\d+")) {
            long current = Long.parseLong(releaseVersion);
            return (current + 1) + "-SNAPSHOT";
        }

        if (releaseVersion.matches("\\d+\\.\\d+\\.\\d+")) {
            String[] parts = releaseVersion.split("\\.");
            long major = Long.parseLong(parts[0]);
            long minor = Long.parseLong(parts[1]);
            long patch = Long.parseLong(parts[2]);
            return major + "." + minor + "." + (patch + 1) + "-SNAPSHOT";
        }

        throw new IllegalStateException("Unsupported version format for release validation: " + releaseVersion);
    }

}
