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

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import com.microsoft.playwright.ElementHandle;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.test.support.ArtifactoryStorageHelper;
import dev.promptlm.test.support.GiteaRepositoryHelper;
import dev.promptlm.test.support.PlaywrightNavigationHelper;
import dev.promptlm.test.support.ProjectSetupHelper;
import dev.promptlm.testutils.artifactory.Artifactory;
import dev.promptlm.testutils.artifactory.ArtifactoryContainer;
import dev.promptlm.testutils.artifactory.WithArtifactory;
import dev.promptlm.testutils.gitea.Gitea;
import dev.promptlm.testutils.gitea.GiteaContainer;
import dev.promptlm.testutils.gitea.WithGitea;
import org.awaitility.core.ConditionTimeoutException;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;
import org.junit.jupiter.api.io.TempDir;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.http.HttpClient;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.awaitility.Awaitility.await;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * End-to-end tests for the prompt creation functionality using Playwright
 * Tests the complete flow through frontend and backend
 * <p>
 */
@WithGitea(createTestRepos = true, actionsEnabled = true)
@WithArtifactory
@IntegrationTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(HappyPathUserJourneyTest.ScreenshotOnFailureExtension.class)
public class HappyPathUserJourneyTest {

    private static final Logger log = LoggerFactory.getLogger(HappyPathUserJourneyTest.class);

    public static final String PROMPT_NAME = "test-prompt-" + System.currentTimeMillis();
    public static final String REPO_NAME = "test-repo-" + System.currentTimeMillis();
    public static final String GROUP = "test-group";
    private static GiteaContainer gitea;
    private static ArtifactoryContainer artifactoryContainer;
    private static volatile boolean artifactoryVariablesConfigured;
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    @TempDir
    private static Path userHome;
    protected Page page;
    private PlaywrightSession playwrightSession;
    private String repositoryOwner;
    private String baseUrl;

    @BeforeAll
    void beforeAll(@Gitea GiteaContainer giteaContainer, @Artifactory ArtifactoryContainer artifactory) throws IOException {
        // Store the Gitea container instance provided by @WithGitea
        this.gitea = giteaContainer;
        HappyPathUserJourneyTest.artifactoryContainer = artifactory;
        this.repositoryOwner = gitea.getAdminUsername();

        // Use the Gitea container provided by @WithGitea annotation
        String giteaUrl = gitea.getWebUrl();
        String giteaUsername = gitea.getAdminUsername();
        String giteaToken = gitea.getAdminToken();

        Files.deleteIfExists(userHome.resolve(".promptlm/context.json"));
        baseUrl = TestApplicationManager.startApplicationWithGitea(userHome, giteaUrl, giteaUsername, giteaToken);
        playwrightSession = PlaywrightSession.startPlaywrightSession(baseUrl);
        page = playwrightSession.getPage();
    }


    @AfterAll
    void afterAll() {
        TestApplicationManager.stopApplication();
        if (playwrightSession != null) {
            playwrightSession.endSession();
            playwrightSession.shutdown();
        }
    }

    @Test
    @Order(1)
    @DisplayName("create first project")
    void createFirstProject() throws IOException, InterruptedException {
        ProjectSetupHelper.verifyNoProjectExists(getUserHome());
        navigateToApplication();
        ProjectSetupHelper.createNewProject(page, REPO_NAME, getUserHome());
        ProjectSetupHelper.assertRepositoryShownAsSelected(page, REPO_NAME);
        verifyProjectExists();
    }

    @Test
    @Order(20)
    @DisplayName("Should be able to create a new prompt")
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    void shouldCreateNewPrompt() {
        page.setViewportSize(1280, 720);
        navigateToApplication();
        ensureRepositoryVariablesConfigured();

        // Click on "Add" button to open dropdown menu
        page.getByTestId("add-button").click();

        // Click on "New Prompt" in the dropdown menu
        page.getByTestId("create-prompt-button").click();

        // Verify we're in the prompt editor via unique heading test id
        Locator editorHeading = page.getByTestId("prompt-editor-heading");
        editorHeading.waitFor();
        assertThat(editorHeading.isVisible()).isTrue();

        // Fill the form
        page.getByTestId("prompt-name-input").fill(PROMPT_NAME);
        page.getByTestId("prompt-group-input").fill(GROUP);
        page.getByTestId("description-text").fill("Description of the prompt.");
        configureCustomPlaceholderDelimiters("[[", "]]");
        addPlaceholder("number_one");
        addPlaceholder("number_two");
        setPlaceholderValue("[[number_one]]", "1");
        setPlaceholderValue("[[number_two]]", "2");

        // add user message
        page.getByTestId("user-prompt-button").click();
        Locator messageTextareas = page.getByTestId("prompt-messages").locator("textarea");
        messageTextareas.last().fill("Number one [[number_one]] plus number two [[number_two]] equals?");

        // Click the save button
        page.getByTestId("save-prompt-button").click();

        page.waitForSelector("text=Prompt created");
        navigateToPath("/prompts");
        page.waitForSelector("text=" + PROMPT_NAME);

        gitea.logRepositoryActionsDiagnostics(repositoryOwner, REPO_NAME);

        // Navigate to Gitea and sign in via helper
        navigateToGitea();
        GiteaActionsUiHelper.ensureSignedIn(page, gitea);

        String branch = "development";
        PromptSpec createdPrompt = waitForPromptSpec(branch, Duration.ofMinutes(2));
        assertThat(createdPrompt.getVersion()).isNotBlank().endsWith("-SNAPSHOT");
        assertThat(createdPrompt.getPlaceholders()).isNotNull();
        assertThat(createdPrompt.getPlaceholders().getStartPattern()).isEqualTo("[[");
        assertThat(createdPrompt.getPlaceholders().getEndPattern()).isEqualTo("]]");
        assertThat(createdPrompt.getPlaceholders().getDefaults())
                .containsEntry("number_one", "1")
                .containsEntry("number_two", "2");
        assertThat(createdPrompt.getRequest()).isInstanceOf(ChatCompletionRequest.class);
        ChatCompletionRequest savedRequest = (ChatCompletionRequest) createdPrompt.getRequest();
        assertThat(savedRequest.getMessages())
                .isNotNull()
                .anyMatch(message -> "user".equalsIgnoreCase(message.getRole())
                        && "Number one 1 plus number two 2 equals?".equals(message.getContent()));
    }

    @Test
    @Order(30)
    @DisplayName("release prompt")
    @Timeout(value = 10, unit = TimeUnit.MINUTES)
    void releasePrompt() {
        PromptSpec beforeRelease = waitForPromptSpec("development", Duration.ofMinutes(2));
        String developmentVersionBeforeRelease = beforeRelease.getVersion();
        String expectedReleaseVersion = normalizeReleaseVersion(developmentVersionBeforeRelease);
        String expectedNextDevelopmentVersion = nextDevelopmentVersion(expectedReleaseVersion);

        navigateToApplication();
        navigateToPath("/prompts");
        boolean visible = page.waitForSelector("text=" + developmentVersionBeforeRelease).isVisible();
        assertThat(visible).isTrue();

        // Keep workflow selection deterministic: clear stale runs before triggering the release.
        ensureRepositoryVariablesConfigured();
        gitea.resetRepositoryActionsState(repositoryOwner, REPO_NAME);
        gitea.logRepositoryActionsDiagnostics(repositoryOwner, REPO_NAME);

        page.getByTestId("prompt-card-%s-action".formatted(PROMPT_NAME)).click();
        page.getByTestId("prompt-editor-release-action").click();
        navigateToPath("/prompts");
        takeScreenshot("here.png");
        verifyPromptVersion("development", expectedNextDevelopmentVersion);

        // Verify deployed prompt in Gitea
        verifyPromptVersion("main", expectedReleaseVersion);
    }

    @Test
    @Order(40)
    @DisplayName("Release Project")
    @Timeout(value = 20, unit = TimeUnit.MINUTES)
    void releaseProject() {
        navigateToGitea();
        waitUntilBuildSucceeded();
        JsonNode deployments = waitForArtifactoryDeployments();
        log.info("Artifactory deployments: {}", deployments);

        JsonNode children = deployments.path("children");
        assertThat(children.isArray())
                .as("Artifactory repository listing should provide children array")
                .isTrue();
        assertThat(children.size())
                .as("At least one artifact should be present in Artifactory")
                .isGreaterThan(0);

        Path extractedDir = ArtifactoryStorageHelper.downloadFirstArtifactArchive(HTTP_CLIENT, artifactoryContainer);
        try (var files = Files.walk(extractedDir)) {
            long fileCount = files.filter(Files::isRegularFile).count();
            assertThat(fileCount)
                    .as("Downloaded artifact should contain at least one file after extraction")
                    .isGreaterThan(0);
        } catch (IOException e) {
            fail("Failed to inspect extracted artifact: " + e.getMessage());
        }
    }

    private JsonNode waitForArtifactoryDeployments() {
        Duration timeout = Duration.ofMinutes(12);
        Duration pollInterval = Duration.ofSeconds(5);
        long deadline = System.nanoTime() + timeout.toNanos();
        JsonNode lastDeployments = null;
        JsonNode lastArchiveMetadata = null;
        RuntimeException lastFetchError = null;

        while (System.nanoTime() < deadline) {
            try {
                lastDeployments = ArtifactoryStorageHelper.fetchArtifactoryDeployments(HTTP_CLIENT, artifactoryContainer);
                lastFetchError = null;
                JsonNode children = lastDeployments.path("children");
                if (children.isArray() && children.size() > 0) {
                    lastArchiveMetadata = ArtifactoryStorageHelper.findFirstArtifactArchiveMetadata(HTTP_CLIENT, artifactoryContainer);
                    if (lastArchiveMetadata != null) {
                        String archivePath = lastArchiveMetadata.path("path").asText();
                        log.info("Artifactory archive ready: {}", archivePath);
                        return lastDeployments;
                    }
                    log.info("Artifactory has entries but no archive artifact yet; retrying in {}s",
                            pollInterval.toSeconds());
                } else {
                    log.info("Artifactory has no artifacts yet; retrying in {}s", pollInterval.toSeconds());
                }
            } catch (RuntimeException fetchError) {
                lastFetchError = fetchError;
                log.warn("Failed to fetch Artifactory deployments (will retry in {}s): {}",
                        pollInterval.toSeconds(),
                        fetchError.getMessage());
            }
            page.waitForTimeout(pollInterval.toMillis());
        }

        if (lastDeployments != null) {
            if (lastArchiveMetadata == null) {
                throw new IllegalStateException("Timed out waiting for an archive artifact (.jar/.zip) in Artifactory");
            }
            return lastDeployments;
        }
        if (lastFetchError != null) {
            throw lastFetchError;
        }
        throw new IllegalStateException("Timed out waiting for Artifactory deployments to become available");
    }

    @Test
    @Order(50)
    @DisplayName("Should validate required fields on prompt form")
    void shouldValidateRequiredFields() {
        // Navigate to new prompt page directly
        navigateToPath("/prompts/new");

        page.getByTestId("prompt-name-input").fill("");
        page.getByTestId("prompt-group-input").fill("");

        // Try to submit the form without required fields
        page.getByTestId("save-prompt-button").click();

        // Check for validation error messages
        assertThat(page.isVisible("[data-testid='prompt-name-error']")).isTrue();
        assertThat(page.isVisible("[data-testid='prompt-group-error']")).isTrue();

        // Take screenshot of validation errors
        takeScreenshot("validation-errors.png");
    }

    private String buildDownloadUrl(String artifactPath) {
        String repositoryBase = artifactoryContainer.getMavenRepositoryUrl();
        String normalizedPath = artifactPath.startsWith("/") ? artifactPath.substring(1) : artifactPath;
        if (normalizedPath.isBlank()) {
            return repositoryBase;
        }
        return repositoryBase + "/" + normalizedPath;
    }

    private void navigateToGitea() {
        page.navigate(gitea.getWebUrl());
    }

    private void configureCustomPlaceholderDelimiters(String openSequence, String closeSequence) {
        Locator placeholderInput = page.getByPlaceholder("placeholder_name");
        if (!placeholderInput.first().isVisible()) {
            page.getByText("Placeholders").first().click(new Locator.ClickOptions().setForce(true));
            placeholderInput.first().waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        }

        Locator settingsButton = page.getByTestId("placeholder-config-button");
        if (settingsButton.count() == 0) {
            settingsButton = page.locator("p:has-text('syntax')")
                    .locator("xpath=following-sibling::*[1]//button")
                    .first();
        }
        settingsButton.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        for (int attempt = 0; attempt < 3; attempt++) {
            settingsButton.click(new Locator.ClickOptions().setForce(true));
            if (page.getByPlaceholder("{{").first().isVisible() || page.getByTestId("placeholder-open-sequence-input").count() > 0) {
                break;
            }
            page.waitForTimeout(200);
        }
        Locator openInput = page.getByTestId("placeholder-open-sequence-input");
        Locator closeInput = page.getByTestId("placeholder-close-sequence-input");
        if (openInput.count() == 0 || closeInput.count() == 0) {
            openInput = page.getByPlaceholder("{{");
            closeInput = page.getByPlaceholder("}}");
        }
        openInput.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        closeInput.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        openInput.fill(openSequence);
        closeInput.fill(closeSequence);
        page.keyboard().press("Escape");
    }

    private void addPlaceholder(String name) {
        Locator placeholderInput = page.getByPlaceholder("placeholder_name");
        placeholderInput.fill(name);
        placeholderInput.press("Enter");
    }

    private void setPlaceholderValue(String placeholderToken, String value) {
        Matcher placeholderNameMatcher = Pattern.compile("\\w+").matcher(placeholderToken);
        assertThat(placeholderNameMatcher.find()).isTrue();
        String placeholderName = placeholderNameMatcher.group();

        Locator placeholderRow = page.getByTestId("placeholder-row-" + placeholderName);
        placeholderRow.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        placeholderRow.hover();

        Locator editButton = page.getByTestId("placeholder-edit-" + placeholderName);
        editButton.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.ATTACHED));
        editButton.click(new Locator.ClickOptions().setForce(true));

        Locator valueEditor = page.getByTestId("placeholder-value-textarea-" + placeholderName + "-0");
        valueEditor.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        valueEditor.fill(value);
        page.keyboard().press("Escape");
    }

    // TODO: do only once
    private void configureRepositoryVariables() {
        if (artifactoryVariablesConfigured) {
            return;
        }

        gitea.waitForRepository(REPO_NAME);
        gitea.enableRepositoryActions(repositoryOwner, REPO_NAME);

        String artifactoryRunnerUrl = System.getProperty(
                "artifactory.runner.api.url",
                System.getProperty("artifactory.internal.api.url", artifactoryContainer.getRunnerAccessibleApiUrl()));

        gitea.ensureRepositoryActionsVariable(repositoryOwner, REPO_NAME, "ARTIFACTORY_URL", artifactoryRunnerUrl);
        gitea.ensureRepositoryActionsVariable(repositoryOwner, REPO_NAME, "ARTIFACTORY_REPOSITORY", artifactoryContainer.getMavenRepositoryName());
        gitea.ensureRepositoryActionsVariable(repositoryOwner, REPO_NAME, "ARTIFACTORY_USERNAME", artifactoryContainer.getDeployerUsername());
        gitea.ensureRepositoryActionsVariable(repositoryOwner, REPO_NAME, "ARTIFACTORY_PASSWORD", artifactoryContainer.getDeployerPassword());

        artifactoryVariablesConfigured = true;
    }

    /**
     * Waits until the build is finished and the job status is "Success".
     * This method navigates to the job page and waits for the job status to be "Success".
     * The timeout for the wait is 5 minutes.
     */
    private void waitUntilBuildSucceeded() {
        String workflowFile = System.getProperty("promptlm.gitea.actions.workflow.file", "deploy-artifactory.yml");
        try {
            int removedCiTasks = gitea.cleanupActionsTaskContainers("workflow-prompt-repository-ci");
            if (removedCiTasks > 0) {
                log.info("Removed {} stale CI Actions task container(s) before deploy wait.", removedCiTasks);
            }
            gitea.logRepositoryActionsDiagnostics(repositoryOwner, REPO_NAME);

            Duration timeout = Duration.ofMinutes(12);
            Duration pollInterval = Duration.ofSeconds(2);
            gitea.waitForRepositoryActionsRun(repositoryOwner, REPO_NAME, timeout, pollInterval);

            // Keep UI navigation as a debugging aid after the API confirms completion.
            GiteaActionsUiHelper.openJobPageForWorkflow(page, gitea, repositoryOwner, REPO_NAME, workflowFile);
            log.info("Workflow '{}' finished successfully. Proceeding with Artifactory verification.", workflowFile);
        } catch (AssertionError | RuntimeException exception) {
            gitea.logRepositoryActionsDiagnostics(repositoryOwner, REPO_NAME);
            gitea.logActionsRunnerDiagnostics("release workflow '" + workflowFile + "' failed");
            throw exception;
        }
    }

    private void ensureRepositoryVariablesConfigured() {
        if (!artifactoryVariablesConfigured) {
            configureRepositoryVariables();
        }
    }

    private void verifyProjectExists() {
        assertThat(getUserHome().resolve(REPO_NAME)).exists();
        assertThat(getUserHome().resolve(".promptlm/context.json").toFile()).isNotEmpty();
    }

    private static Path getUserHome() {
        return userHome;
    }

    private void navigateToApplication() {
        playwrightSession.navigateToApp();
    }

    /**
     * Get the base URL for the application
     */
    protected String getBaseUrl() {
        return TestApplicationManager.getBaseUrl();
    }

    private void verifyPromptVersion(String branch, String expectedVersion) {
        PromptSpec promptSpec = waitForPromptSpec(branch, expectedVersion, Duration.ofMinutes(2));
        assertThat(promptSpec.getVersion()).isEqualTo(expectedVersion);
    }

    private PromptSpec waitForPromptSpec(String branch, Duration timeout) {
        return waitForPromptSpec(branch, null, timeout);
    }

    private PromptSpec waitForPromptSpec(String branch, String expectedVersion, Duration timeout) {
        AtomicReference<PromptSpec> foundPrompt = new AtomicReference<>();
        AtomicReference<Exception> lastError = new AtomicReference<>();
        AtomicReference<String> lastSeenVersion = new AtomicReference<>();

        try {
            await()
                    .pollInterval(Duration.ofSeconds(1))
                    .atMost(timeout)
                    .until(() -> {
                        try {
                            Optional<String> yaml = GiteaRepositoryHelper.fetchRawFile(
                                    HTTP_CLIENT,
                                    getGiteaRepoUrl(),
                                    branch,
                                    "prompts/" + GROUP + "/" + PROMPT_NAME + "/promptlm.yml",
                                    gitea.getAdminToken());
                            if (yaml.isEmpty()) {
                                return false;
                            }

                            PromptSpec promptSpec = getPromptSpec(yaml.get());
                            lastSeenVersion.set(promptSpec.getVersion());
                            if (expectedVersion == null || expectedVersion.equals(promptSpec.getVersion())) {
                                foundPrompt.set(promptSpec);
                                return true;
                            }
                            log.debug("Prompt spec on branch '{}' currently at version '{}', waiting for '{}'", branch, promptSpec.getVersion(), expectedVersion);
                            return false;
                        } catch (Exception exception) {
                            lastError.set(exception);
                            return false;
                        }
                    });
        } catch (ConditionTimeoutException conditionTimeout) {
            String message = "Timed out waiting for prompt spec on branch '" + branch + "'";
            if (expectedVersion != null) {
                message = message + " with version '" + expectedVersion + "'";
            }
            if (lastSeenVersion.get() != null) {
                message = message + " (last seen version '" + lastSeenVersion.get() + "')";
            }
            IllegalStateException timeoutException = new IllegalStateException(message);
            if (lastError.get() != null) {
                timeoutException.initCause(lastError.get());
            } else {
                timeoutException.initCause(conditionTimeout);
            }
            throw timeoutException;
        }

        return foundPrompt.get();
    }

    private static PromptSpec getPromptSpec(String rawYaml) {
        try {
            return ObjectMapperFactory.createYamlMapper().readValue(rawYaml, PromptSpec.class);
        } catch (JacksonException e) {
            throw new IllegalStateException("Failed to parse prompt spec YAML", e);
        }
    }

    private static @NotNull String getGiteaRepoUrl() {
        return gitea.getWebUrl() + "/" + gitea.getAdminUsername() + "/" + REPO_NAME;
    }

    private void takeScreenshot(String fileName) {
        try {
            Path screenshotsDir = Paths.get("target/screenshots");
            Files.createDirectories(screenshotsDir);
            page.screenshot(new Page.ScreenshotOptions()
                    .setPath(screenshotsDir.resolve(fileName)));
        } catch (Exception e) {
            log.error("Failed to take screenshot: " + e.getMessage());
        }
    }

    private void captureFailureScreenshot(String testDisplayName) {
        if (page == null) {
            log.warn("Skipping screenshot for '{}' because Playwright page is null", testDisplayName);
            return;
        }

        String sanitizedName = SCREENSHOT_FILE_SANITIZER.matcher(testDisplayName).replaceAll("_");
        String fileName = String.format("failure-%s-%d.png", sanitizedName, System.currentTimeMillis());
        takeScreenshot(fileName);
        log.info("Stored failure screenshot for '{}' at target/screenshots/{}", testDisplayName, fileName);
    }


    private void captureFailureTrace(String testDisplayName) {
        if (page == null) {
            return;
        }
        try {
            Path tracesDir = Paths.get("target/traces");
            Files.createDirectories(tracesDir);
            String sanitizedName = SCREENSHOT_FILE_SANITIZER.matcher(testDisplayName).replaceAll("_");
            String fileName = String.format("trace-%s-%d.zip", sanitizedName, System.currentTimeMillis());
            page.context().tracing().stop(new com.microsoft.playwright.Tracing.StopOptions()
                    .setPath(tracesDir.resolve(fileName)));
            page.context().tracing().start(new com.microsoft.playwright.Tracing.StartOptions()
                    .setScreenshots(true)
                    .setSnapshots(true)
                    .setSources(true));
            log.info("Stored failure trace for '{}' at target/traces/{}", testDisplayName, fileName);
        } catch (Exception e) {
            log.warn("Failed to capture Playwright trace for '{}'", testDisplayName, e);
        }
    }

    private void handleTestFailure(String displayName, Throwable cause) {
        if (cause != null) {
            log.error("Test '{}' failed", displayName, cause);
        } else {
            log.error("Test '{}' failed", displayName);
        }
        captureFailureScreenshot(displayName);
        captureFailureTrace(displayName);
    }

    private static final Pattern SCREENSHOT_FILE_SANITIZER = Pattern.compile("[^a-zA-Z0-9-_]+");
    private static final Pattern INTEGER_VERSION_PATTERN = Pattern.compile("^(\\d+)$");
    private static final Pattern SEMVER_VERSION_PATTERN = Pattern.compile("^(\\d+)\\.(\\d+)\\.(\\d+)$");

    private static String normalizeReleaseVersion(String version) {
        if (version == null || version.isBlank()) {
            return "1";
        }
        if (version.endsWith("-SNAPSHOT")) {
            return version.substring(0, version.length() - "-SNAPSHOT".length());
        }
        return version;
    }

    private static String nextDevelopmentVersion(String releaseVersion) {
        Matcher integerMatcher = INTEGER_VERSION_PATTERN.matcher(releaseVersion);
        if (integerMatcher.matches()) {
            long current = Long.parseLong(integerMatcher.group(1));
            return (current + 1) + "-SNAPSHOT";
        }

        Matcher semverMatcher = SEMVER_VERSION_PATTERN.matcher(releaseVersion);
        if (semverMatcher.matches()) {
            long major = Long.parseLong(semverMatcher.group(1));
            long minor = Long.parseLong(semverMatcher.group(2));
            long patch = Long.parseLong(semverMatcher.group(3));
            return major + "." + minor + "." + (patch + 1) + "-SNAPSHOT";
        }

        throw new IllegalStateException("Unsupported version format for release validation: " + releaseVersion);
    }

    /**
     * Navigate to a specific path within the application
     */
    protected void navigateToPath(String path) {

        PlaywrightNavigationHelper.navigateToPath(page, getBaseUrl(), path);
    }

    static class ScreenshotOnFailureExtension implements TestWatcher {


        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            context.getTestInstance()
                    .filter(HappyPathUserJourneyTest.class::isInstance)
                    .map(HappyPathUserJourneyTest.class::cast)
                    .ifPresent(test -> test.handleTestFailure(context.getDisplayName(), cause));
        }
    }
}
