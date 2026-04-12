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

import com.microsoft.playwright.Page;
import dev.promptlm.test.support.ReleaseArtifactContractDelegate;
import dev.promptlm.testutils.artifactory.Artifactory;
import dev.promptlm.testutils.artifactory.ArtifactoryContainer;
import dev.promptlm.testutils.artifactory.WithArtifactory;
import dev.promptlm.testutils.gitea.Gitea;
import dev.promptlm.testutils.gitea.GiteaActions;
import dev.promptlm.testutils.gitea.GiteaContainer;
import dev.promptlm.testutils.gitea.GiteaWorkflowException;
import dev.promptlm.testutils.gitea.WithGitea;
import dev.promptlm.test.util.ZipTestUtils;
import org.assertj.core.api.WithAssertions;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.Comparator;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.file.FileVisitResult;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

import static org.assertj.core.api.Assertions.assertThat;

@WithGitea(actionsEnabled = true, createTestRepos = true, testRepoNames = {CiWorkflowHarnessTest.REPO_NAME})
@WithArtifactory
@IntegrationTest
class CiWorkflowHarnessTest implements WithAssertions {

    static final String REPO_NAME = "template-repo";
    private static final String WORKFLOW_FILE = "deploy-artifactory.yml";
    private static final Logger log = LoggerFactory.getLogger(CiWorkflowHarnessTest.class);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private static final String EMPTY_CONTEXT_JSON = """
            {
                \"projects\":[],
                \"activeProject\":null
            }
            """;
    @TempDir
    private Path tempDir;
    private RepositorySeeder repositorySeeder;
    private PlaywrightSession playwrightSession;
    private Page page;
    private GiteaContainer gitea;
    private ArtifactoryContainer artifactory;
    private String originalUserHome;
    private Path promptlmHome;

    @BeforeEach
    void setUpBootstrap(@Gitea GiteaContainer gitea, @Artifactory ArtifactoryContainer artifactory) {
        this.gitea = gitea;
        this.artifactory = artifactory;
        repositorySeeder = new RepositorySeeder(gitea, tempDir);
        isolatePromptlmHome();
        playwrightSession = PlaywrightSession.startPlaywrightSession(gitea.getWebUrl());
        page = playwrightSession.getPage();
    }

    @AfterEach
    void tearDownPlaywright() {
        try {
            if (playwrightSession != null) {
                try {
                    playwrightSession.shutdown();
                } finally {
                    playwrightSession = null;
                    page = null;
                }
            }
        } finally {
            if (repositorySeeder != null) {
                try {
                    repositorySeeder.resetTemplateRepository();
                } catch (Exception e) {
                    log.warn("Failed to reset template repository state", e);
                }
            }
            try {
                resetPromptlmMetadata();
            } catch (Exception e) {
                log.warn("Failed to reset promptlm metadata", e);
            } finally {
                restoreUserHome();
            }
        }
    }

    @Test
    @DisplayName("Dispatches deploy-artifactory.yml via harness and verifies artifacts")
    void shouldExecuteCiWorkflowAndPublishArtifacts(@Gitea GiteaContainer gitea, @Artifactory ArtifactoryContainer artifactory) {
        log.info("Starting CI workflow harness test against Gitea webUrl={} apiUrl={} artifactoryUrl={}",
                gitea.getWebUrl(), gitea.getApiUrl(), artifactory.getRunnerAccessibleApiUrl());
        gitea.resetRepositoryActionsState(gitea.getAdminUsername(), REPO_NAME);
        log.info("Reset Actions state before seeding CI workflow for {}/{}", gitea.getAdminUsername(), REPO_NAME);

        configureRepositoryVariables(gitea, artifactory);
        log.info("Repository variables configured for {}/{}", gitea.getAdminUsername(), REPO_NAME);

        String seededCommitSha = repositorySeeder.seedTemplateRepository();
        log.info("Template repository seeded (workflow should start) for {}/{} at commit {}",
                gitea.getAdminUsername(), REPO_NAME, seededCommitSha);

        Duration timeout = Duration.ofMinutes(12);
        Duration pollInterval = Duration.ofSeconds(5);
        GiteaActions.ActionExecutionReport workflowReport =
                waitForWorkflowExecution(gitea, gitea.getAdminUsername(), REPO_NAME, seededCommitSha, timeout, pollInterval);
        assertSuccessfulWorkflowExecution(workflowReport, seededCommitSha);

        ReleaseArtifactContractDelegate.assertPublishedReleaseArtifactContract(HTTP_CLIENT, artifactory);

        // Keep UI navigation as a debugging aid when the API says the workflow ran.
        GiteaActionsUiHelper.ensureSignedIn(page, gitea);
        GiteaActionsUiHelper.openJobPageForWorkflow(page, gitea, "testuser", REPO_NAME, WORKFLOW_FILE);
    }

    private void configureRepositoryVariables(GiteaContainer gitea, ArtifactoryContainer artifactory) {
        String owner = gitea.getAdminUsername();
        gitea.enableRepositoryActions(owner, REPO_NAME);
        String runnerCloneUrl = gitea.buildRunnerAccessibleCloneUrl(owner, REPO_NAME);
        log.info("Using runner-accessible clone URL: {}", runnerCloneUrl);
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "REPO_REMOTE_URL", runnerCloneUrl);
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "REPO_REMOTE_USERNAME", owner);
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "REPO_REMOTE_TOKEN", gitea.getAdminToken());
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "OPENAI_API_KEY", "dummy-key");
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "ARTIFACTORY_URL", artifactory.getRunnerAccessibleApiUrl());
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "ARTIFACTORY_REPOSITORY", artifactory.getMavenRepositoryName());
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "ARTIFACTORY_USERNAME", artifactory.getDeployerUsername());
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "ARTIFACTORY_PASSWORD", artifactory.getDeployerPassword());
        gitea.ensureRepositoryActionsVariable(owner, REPO_NAME, "PROMPTLM_UPLOAD_ARTIFACTS", "true");
    }

    private GiteaActions.ActionExecutionReport waitForWorkflowExecution(GiteaContainer gitea,
                                                                        String owner,
                                                                        String repository,
                                                                        String commitSha,
                                                                        Duration timeout,
                                                                        Duration pollInterval) {
        try {
            return gitea.actions().waitForWorkflowRunBySha(owner, repository, commitSha, timeout, pollInterval);
        } catch (GiteaWorkflowException e) {
            gitea.logRepositoryActionsDiagnostics(owner, repository);
            throw e;
        }
    }

    private void assertSuccessfulWorkflowExecution(GiteaActions.ActionExecutionReport workflowReport,
                                                   String seededCommitSha) {
        assertThat(workflowReport.run().headSha())
                .as("workflow run should match seeded commit")
                .startsWith(seededCommitSha);
        assertThat(workflowReport.run().status())
                .as("workflow run status should be completed")
                .isEqualToIgnoringCase("completed");
        assertThat(workflowReport.run().conclusion())
                .as("workflow run conclusion should be success")
                .isEqualToIgnoringCase("success");
        assertThat(workflowReport.allJobsTerminal())
                .as("workflow jobs should be terminal")
                .isTrue();
        assertThat(workflowReport.jobs())
                .as("workflow should have at least one job")
                .isNotEmpty();
        workflowReport.jobs().forEach(job ->
                assertThat(job.conclusion() == null ? "" : job.conclusion().toLowerCase(Locale.ROOT))
                        .as("workflow job %s should be successful or skipped", job.name())
                        .isIn("success", "skipped"));
    }

    private static final class RepositorySeeder {

        private final GiteaContainer gitea;
        private final Path workspace;
        private final Path repoDir;

        private RepositorySeeder(GiteaContainer gitea, Path workspace) {
            this.gitea = gitea;
            this.workspace = workspace;
            this.repoDir = workspace.resolve(REPO_NAME + "-local");
        }

        String seedTemplateRepository() {
            try {
                gitea.waitForRepository(REPO_NAME);
                Files.createDirectories(repoDir);
                initialiseRepository(repoDir);
                extractTemplate(repoDir);
                String commitSha = commitAndPush(repoDir, false);
                gitea.waitForRepository(REPO_NAME);
                return commitSha;
            } catch (IOException | GitAPIException | URISyntaxException e) {
                throw new IllegalStateException("Failed to seed repository", e);
            }
        }

        void resetTemplateRepository() {
            try {
                deleteDirectory(repoDir);
                Files.createDirectories(repoDir);
                initialiseRepository(repoDir);
                extractTemplate(repoDir);
                commitAndPush(repoDir, true);
            } catch (IOException | GitAPIException | URISyntaxException e) {
                throw new IllegalStateException("Failed to reset repository state", e);
            } finally {
                try {
                    deleteDirectory(repoDir);
                } catch (IOException e) {
                    log.warn("Failed to clean local repository at {}", repoDir, e);
                }
            }
        }

        private InputStream resourceStream() {
            ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
            if (classLoader == null) {
                classLoader = RepositorySeeder.class.getClassLoader();
            }
            try {
                var resources = classLoader.getResources("repo-template.zip");
                StringBuilder locations = new StringBuilder();
                while (resources.hasMoreElements()) {
                    var resourceUrl = resources.nextElement();
                    String location = resourceUrl.toExternalForm();
                    if (locations.length() > 0) {
                        locations.append(", ");
                    }
                    locations.append(location);
                    if (location.contains("/repository-template/") || location.contains("repository-template-")) {
                        return resourceUrl.openStream();
                    }
                }
                throw new IllegalStateException("repo-template.zip from repository-template module not found. "
                        + "Discovered locations: [" + locations + "]");
            } catch (IOException e) {
                throw new IllegalStateException("Failed to load repo-template.zip from repository-template module", e);
            }
        }

        private void initialiseRepository(Path repoDir) throws GitAPIException, URISyntaxException {
            try (Git git = Git.init().setDirectory(repoDir.toFile()).setInitialBranch("main").call()) {
                git.remoteAdd()
                        .setName("origin")
                        .setUri(new URIish(remoteUrl()))
                        .call();
            }
        }

        private void extractTemplate(Path repoDir) throws IOException {
            try (InputStream inputStream = resourceStream()) {
                ZipTestUtils.unzip(inputStream, repoDir);
            }
        }

        private String commitAndPush(Path repoDir, boolean force) throws IOException, GitAPIException {
            try (Git git = Git.open(repoDir.toFile())) {
                git.add().addFilepattern(".").call();
                RevCommit commit = git.commit()
                        .setMessage("Seed repository template")
                        .setAuthor(gitea.getAdminUsername(), gitea.getAdminUsername() + "@example.com")
                        .setCommitter(gitea.getAdminUsername(), gitea.getAdminUsername() + "@example.com")
                        .call();
                git.push()
                        .setRemote("origin")
                        .setCredentialsProvider(credentials())
                        .setRefSpecs(new RefSpec("refs/heads/main:refs/heads/main"))
                        .setForce(force)
                        .call();
                return commit.getId().getName();
            }
        }

        private void commitAndPush(Path repoDir) throws IOException, GitAPIException {
            commitAndPush(repoDir, false);
        }

        void triggerWorkflowRun() {
            try {
                Path marker = repoDir.resolve(".workflow-trigger");
                Files.writeString(
                        marker,
                        "trigger-" + System.currentTimeMillis(),
                        StandardCharsets.UTF_8,
                        StandardOpenOption.CREATE,
                        StandardOpenOption.TRUNCATE_EXISTING
                );

                try (Git git = Git.open(repoDir.toFile())) {
                    git.add().addFilepattern(marker.getFileName().toString()).call();
                    git.commit()
                            .setMessage("Trigger workflow run")
                            .setAuthor(gitea.getAdminUsername(), gitea.getAdminUsername() + "@example.com")
                            .setCommitter(gitea.getAdminUsername(), gitea.getAdminUsername() + "@example.com")
                            .call();
                    git.push()
                            .setRemote("origin")
                            .setCredentialsProvider(credentials())
                            .setRefSpecs(new RefSpec("refs/heads/main:refs/heads/main"))
                            .call();
                }
            } catch (IOException | GitAPIException e) {
                throw new IllegalStateException("Failed to push workflow trigger commit", e);
            }
        }

        private UsernamePasswordCredentialsProvider credentials() {
            return new UsernamePasswordCredentialsProvider(gitea.getAdminUsername(), gitea.getAdminToken());
        }

        private String remoteUrl() {
            return gitea.getWebUrl() + "/" + gitea.getAdminUsername() + "/" + REPO_NAME + ".git";
        }
    }

    private void isolatePromptlmHome() {
        promptlmHome = tempDir.resolve("promptlm-home");
        try {
            Files.createDirectories(promptlmHome);
            originalUserHome = System.getProperty("user.home");
            System.setProperty("user.home", promptlmHome.toString());
            resetPromptlmMetadata();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to prepare isolated promptlm home", e);
        }
    }

    private void resetPromptlmMetadata() throws IOException {
        if (promptlmHome == null) {
            return;
        }
        Path metadataDir = promptlmHome.resolve(".promptlm");
        Files.createDirectories(metadataDir);
        Path contextFile = metadataDir.resolve("context.json");
        Files.writeString(contextFile, EMPTY_CONTEXT_JSON, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    }

    private void restoreUserHome() {
        if (originalUserHome != null) {
            System.setProperty("user.home", originalUserHome);
            originalUserHome = null;
        }
    }

    private static void deleteDirectory(Path directory) throws IOException {
        if (directory == null || Files.notExists(directory)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(directory)) {
            for (Path path : walk.sorted(Comparator.reverseOrder()).collect(Collectors.toList())) {
                Files.deleteIfExists(path);
            }
        }
    }
}
