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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.ReleaseMetadata;
import dev.promptlm.store.api.PromptStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class GitHubPromptStore implements PromptStore {

    public static final String MAIN_BRANCH = "main";
    public static final String DEV_BRANCH = "development";
    private static final String RELEASE_BRANCH_PREFIX = "release/";
    private static final Pattern PR_REFERENCE_NUMBER = Pattern.compile("^(\\d+)$");
    private static final Pattern PR_REFERENCE_URL = Pattern.compile(".*/pull/(\\d+).*");

    private final ObjectMapper modelYamlMapper;
    private final GitFileNameStrategy fileNameStrategy;
    private final Git git;
    private final AppContext appContext;
    private final VersioningStrategy versioningStrategy;
    private final GitRepositoryMetadata repositoryMetadata;
    private final ReleasePromotionProperties releasePromotionProperties;
    private final ReleasePullRequestGateway releasePullRequestGateway;
    private final Map<String, ReentrantLock> releaseLocks = new ConcurrentHashMap<>();

    public GitHubPromptStore(@Qualifier("modelYamlMapper") ObjectMapper modelYamlMapper,
                             GitFileNameStrategy fileNameStrategy,
                             Git git,
                             AppContext appContext,
                             IntVersioningStrategy versioningStrategy,
                             GitRepositoryMetadata repositoryMetadata) {
        this(
                modelYamlMapper,
                fileNameStrategy,
                git,
                appContext,
                versioningStrategy,
                repositoryMetadata,
                defaultReleaseProperties(),
                null
        );
    }

    @Autowired
    public GitHubPromptStore(@Qualifier("modelYamlMapper") ObjectMapper modelYamlMapper,
                             GitFileNameStrategy fileNameStrategy,
                             Git git,
                             AppContext appContext,
                             IntVersioningStrategy versioningStrategy,
                             GitRepositoryMetadata repositoryMetadata,
                             ReleasePromotionProperties releasePromotionProperties,
                             ReleasePullRequestGateway releasePullRequestGateway) {
        this.modelYamlMapper = modelYamlMapper;
        this.versioningStrategy = versioningStrategy;
        this.fileNameStrategy = fileNameStrategy;
        this.git = git;
        this.appContext = appContext;
        this.repositoryMetadata = repositoryMetadata;
        this.releasePromotionProperties = releasePromotionProperties;
        this.releasePullRequestGateway = releasePullRequestGateway;
    }

    private static ReleasePromotionProperties defaultReleaseProperties() {
        ReleasePromotionProperties properties = new ReleasePromotionProperties();
        properties.setMode(ReleasePromotionMode.DIRECT.value());
        return properties;
    }

    /**
     * Save the given {@link PromptSpec} to disk and sync with remote.
     */
    @Override
    public PromptSpec storePrompt(PromptSpec promptSpec) {
        String commitMessage = String.format("Add prompt %s/%s rev %d",
                promptSpec.getName(),
                promptSpec.getGroup(),
                Optional.ofNullable(promptSpec.getRevision()).orElse(0));
        return storePrompt(promptSpec, commitMessage, true);
    }

    private PromptSpec storePrompt(PromptSpec promptSpec, String commitMessage, boolean ensureDevelopmentBranch) {
        File repo = appContext.getActiveProject().getRepoDir().toFile();
        if (ensureDevelopmentBranch) {
            switchToDevelopmentBranch(repo);
        }
        PromptSpec hashUpdatedPrompt = promptSpec.withSemanticHashComputed();

        Path relativePath = resolvePromptSpecRelativePath(repo.toPath(), hashUpdatedPrompt.getGroup(), hashUpdatedPrompt.getName());
        Path specPath = repo.toPath().resolve(relativePath);

        LocalDateTime now = LocalDateTime.now();
        PromptSpec finalPromptSpec;

        if (Files.exists(specPath)) {
            // It's an update
            LocalDateTime createdAt = hashUpdatedPrompt.getCreatedAt() != null ? hashUpdatedPrompt.getCreatedAt() : now;
            finalPromptSpec = hashUpdatedPrompt
                    .withCreatedAt(createdAt)
                    .withUpdatedAt(now)
                    .withPath(relativePath);
        } else {
            // It's a new prompt
            finalPromptSpec = hashUpdatedPrompt
                    .withCreatedAt(now)
                    .withUpdatedAt(now)
                    .withPath(relativePath);
        }

        saveToDisk(finalPromptSpec);
        git.addAllAndCommit(repo, commitMessage);
        git.pushAll(repo);
        return finalPromptSpec;
    }

    private void switchToDevelopmentBranch(File repo) {
        git.checkoutOrCreateBranch(DEV_BRANCH, repo);
    }

    public void saveToDisk(PromptSpec promptSpec) {
        try {
            File repo = appContext.getActiveProject().getRepoDir().toFile();
            String s = null;
            s = modelYamlMapper.writeValueAsString(promptSpec);

            Path promptSpecPath = promptSpec.getPath() != null
                    ? promptSpec.getPath()
                    : resolvePromptSpecRelativePath(repo.toPath(), promptSpec.getGroup(), promptSpec.getName());

            Path specPath = repo.toPath().resolve(promptSpecPath);
            if (Files.notExists(specPath.getParent())) {
                Files.createDirectories(specPath.getParent());
            }
            Files.writeString(specPath, s);
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

    @Override
    public Optional<PromptSpec> getLatestVersion(String promptId) {
        Path repoDir = appContext.getActiveProject().getRepoDir();
        if(repoDir == null) {
            return Optional.empty();
        }
        File repo = repoDir.toFile();
        Predicate<PromptSpec> predicate = spec -> spec.getId().equals(promptId);
        // Don't filter by status when getting by ID - we want to retrieve it even if retired
        Optional<PromptSpec> match = searchInPromptSpecIncludingRetired(repo, predicate, p -> true);
        return match;
    }

    /**
     * Search for prompt specs, filtering out retired prompts by default
     */
    private Optional<PromptSpec> searchInPromptSpec(File repo, Predicate<PromptSpec> predicate, Predicate<? super Path> beforeReading) {
        // Combine the provided predicate with a filter for active prompts only
        Predicate<PromptSpec> activePromptPredicate = predicate.and(spec -> 
                spec.getStatus() == null || spec.getStatus() == PromptSpec.PromptStatus.ACTIVE);
        
        return searchInPromptSpecIncludingRetired(repo, activePromptPredicate, beforeReading);
    }
    
    /**
     * Search for prompt specs including retired ones
     */
    private Optional<PromptSpec> searchInPromptSpecIncludingRetired(File repo, Predicate<PromptSpec> predicate, Predicate<? super Path> beforeReading) {
        try (var stream = walkRepo(repo.toPath())) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(this::isPromptSpec)
                    .filter(beforeReading)
                    .map(f -> modelYamlMapper.readValue(f.toFile(), PromptSpec.class))
                    .peek(spec -> spec.getId())
                    .filter(predicate)
                    .findFirst();
        }
    }

    private boolean isPromptSpec(Path path) {
        String filename = path.getFileName().toString();
        return filename.equals("promptlm.yml");
    }

    @Override
    public Optional<PromptSpec> getPromptVersion(String promptId, int versionNumber) {
        return Optional.empty();
    }

    @Override
    public List<PromptSpec> listVersions(String promptId) {
        return List.of();
    }

    public int updatePrompt(String promptId, PromptSpec promptSpec) {
        // Ensure the prompt ID matches
        if (!promptId.equals(promptSpec.getId())) {
            throw new IllegalArgumentException("Prompt ID in request does not match the ID in the prompt spec");
        }

        String commitMessage = promptSpec.isRetired()
                ? "Retired prompt: " + promptSpec.getName()
                : "Updated prompt: " + promptSpec.getName();

        PromptSpec updatedSpec = storePrompt(promptSpec, commitMessage, true);
        updatedSpec.withRevision(promptSpec.getRevision() + 1);
        // Return the new version number (assuming version is incremented)
        return updatedSpec.getRevision();
    }

    @Override
    public boolean deletePromptVersion(String promptId, int versionNumber) {
        return false;
    }

    @Override
    public boolean deleteAllVersions(String promptId) {
        return false;
    }

    @Override
    public String findPromptSpecTemplate(String xy) {
        PromptSpec promptSpec = PromptSpec.builder()
                .withName("new-prompt-name")
                .withVersion("1-SNAPSHOT")
                .withRevision(0)
                .withDescription("Generated from default template")
                .withRequest(
                        ChatCompletionRequest.builder()
                                .withType(ChatCompletionRequest.TYPE)
                                .withModel("gpt-4o")
                                .withVendor("openai")
                                .withUrl("https://api.openai.com/v1/chat/completions")
                                .build()
                )
                .build();

        try {
            return modelYamlMapper.writeValueAsString(promptSpec);
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public PromptSpec requestRelease(PromptSpec promptSpec) {
        if (promptSpec == null) {
            throw new IllegalArgumentException("Prompt spec must not be null");
        }

        return withPromptReleaseLock(promptSpec.getId(), () -> requestReleaseUnlocked(promptSpec));
    }

    @Override
    public PromptSpec completeRelease(String promptSpecId, String pullRequestReference) {
        if (promptSpecId == null || promptSpecId.isBlank()) {
            throw new IllegalArgumentException("promptSpecId must not be blank");
        }
        if (pullRequestReference == null || pullRequestReference.isBlank()) {
            throw new IllegalArgumentException("pullRequestReference must not be blank");
        }

        return withPromptReleaseLock(promptSpecId, () -> completeReleaseUnlocked(promptSpecId, pullRequestReference));
    }

    private PromptSpec requestReleaseUnlocked(PromptSpec promptSpec) {
        ReleasePromotionMode mode = releasePromotionProperties.resolveMode();
        return switch (mode) {
            case DIRECT -> requestDirectRelease(promptSpec);
            case PR_TWO_PHASE -> requestPrTwoPhaseRelease(promptSpec);
        };
    }

    private PromptSpec requestDirectRelease(PromptSpec promptSpec) {
        Path repoPath = requireActiveRepoPath();
        File repo = repoPath.toFile();
        PromptSpec releaseCandidate = releaseCandidate(promptSpec);
        String releaseVersion = releaseCandidate.getVersion();
        String releaseTag = versioningStrategy.calculateReleaseTag(releaseCandidate);

        if (git.tagExists(releaseTag, repo)) {
            return releaseCandidate.withReleaseMetadata(releasedMetadata(
                    ReleaseMetadata.MODE_DIRECT,
                    releaseVersion,
                    releaseTag,
                    MAIN_BRANCH,
                    null,
                    null,
                    true
            ));
        }

        try {
            checkoutMainBranch(repo);
            cherryPickFromDevelopmentBranch(promptSpec, repo);
            PromptSpec releasedPrompt = storePrompt(releaseCandidate, "Released", false);
            writeMetadata(repoPath, releasedPrompt, releaseTag, releaseVersion);
            git.addAllAndCommit(repo, "Release " + releaseTag);
            git.tagIfMissing(releaseTag, repo);
            git.pushAll(repo);

            git.checkoutBranch(DEV_BRANCH, repo);
            String newVersion = versioningStrategy.getNextDevelopmentVersion(releasedPrompt);
            PromptSpec developmentPrompt = releasedPrompt.withVersion(newVersion);
            storePrompt(developmentPrompt, "New development version.", true);
            git.pushAll(repo);

            return releasedPrompt.withReleaseMetadata(releasedMetadata(
                    ReleaseMetadata.MODE_DIRECT,
                    releaseVersion,
                    releaseTag,
                    MAIN_BRANCH,
                    null,
                    null,
                    false
            ));
        } catch (Exception e) {
            throw new GitException("Failed to release prompt %s".formatted(promptSpec.getId()), e);
        } finally {
            git.checkoutBranch(DEV_BRANCH, repo);
        }
    }

    private PromptSpec requestPrTwoPhaseRelease(PromptSpec promptSpec) {
        Path repoPath = requireActiveRepoPath();
        File repo = repoPath.toFile();
        String repositoryFullName = git.getFullName(repoPath);
        ReleasePullRequestGateway pullRequestGateway = requireReleasePullRequestGateway();
        pullRequestGateway.validatePrModeCapabilities(repositoryFullName);

        PromptSpec releaseCandidate = releaseCandidate(promptSpec);
        String releaseVersion = releaseCandidate.getVersion();
        String releaseTag = versioningStrategy.calculateReleaseTag(releaseCandidate);
        String releaseBranch = buildReleaseBranchName(promptSpec.getId(), releaseVersion);

        if (git.tagExists(releaseTag, repo)) {
            return releaseCandidate.withReleaseMetadata(releasedMetadata(
                    ReleaseMetadata.MODE_PR_TWO_PHASE,
                    releaseVersion,
                    releaseTag,
                    MAIN_BRANCH,
                    null,
                    null,
                    true
            ));
        }

        List<ReleasePullRequest> openReleasePullRequests = pullRequestGateway.listOpenPullRequests(repositoryFullName, MAIN_BRANCH).stream()
                .filter(pr -> isReleaseBranchForPrompt(pr.headRef(), promptSpec.getId()))
                .toList();
        Optional<ReleasePullRequest> sameVersionRequest = openReleasePullRequests.stream()
                .filter(pr -> releaseBranch.equals(pr.headRef()))
                .findFirst();
        if (sameVersionRequest.isPresent()) {
            ReleasePullRequest existing = sameVersionRequest.get();
            return releaseCandidate.withReleaseMetadata(requestedMetadata(
                    releaseVersion,
                    releaseTag,
                    releaseBranch,
                    existing.number(),
                    existing.url(),
                    true
            ));
        }
        Optional<ReleasePullRequest> conflictingRequest = openReleasePullRequests.stream().findFirst();
        if (conflictingRequest.isPresent()) {
            throw new GitException(
                    "Conflicting pending release request for prompt %s already exists on branch %s (PR #%d)."
                            .formatted(promptSpec.getId(), conflictingRequest.get().headRef(), conflictingRequest.get().number())
            );
        }

        try {
            git.checkoutBranch(DEV_BRANCH, repo);
            git.checkoutOrCreateBranch(releaseBranch, repo);
            storePrompt(releaseCandidate, "Release requested", false);
            git.pushAll(repo);

            ReleasePullRequest created = pullRequestGateway.createReleasePullRequest(
                    repositoryFullName,
                    releaseBranch,
                    MAIN_BRANCH,
                    "Release %s %s".formatted(promptSpec.getId(), releaseVersion),
                    "Release request for prompt %s version %s".formatted(promptSpec.getId(), releaseVersion)
            );
            return releaseCandidate.withReleaseMetadata(requestedMetadata(
                    releaseVersion,
                    releaseTag,
                    releaseBranch,
                    created.number(),
                    created.url(),
                    false
            ));
        } catch (Exception e) {
            throw new GitException("Failed to request release for prompt %s".formatted(promptSpec.getId()), e);
        } finally {
            git.checkoutBranch(DEV_BRANCH, repo);
        }
    }

    private PromptSpec completeReleaseUnlocked(String promptSpecId, String pullRequestReference) {
        if (releasePromotionProperties.resolveMode() != ReleasePromotionMode.PR_TWO_PHASE) {
            throw new IllegalStateException(
                    "Release completion is only available when promptlm.release.promotion.mode=pr_two_phase"
            );
        }

        Path repoPath = requireActiveRepoPath();
        File repo = repoPath.toFile();
        String repositoryFullName = git.getFullName(repoPath);
        ReleasePullRequestGateway pullRequestGateway = requireReleasePullRequestGateway();
        pullRequestGateway.validatePrModeCapabilities(repositoryFullName);

        int pullRequestNumber = parsePullRequestReference(pullRequestReference);
        ReleasePullRequest pullRequest = pullRequestGateway.getPullRequest(repositoryFullName, pullRequestNumber);
        if (!MAIN_BRANCH.equals(pullRequest.baseRef())) {
            throw new GitException(
                    "Pull request #%d must target %s but targets %s"
                            .formatted(pullRequestNumber, MAIN_BRANCH, pullRequest.baseRef())
            );
        }

        String releaseVersion = extractReleaseVersionFromBranch(promptSpecId, pullRequest.headRef())
                .orElseThrow(() -> new GitException(
                        "Pull request #%d does not match release branch pattern for prompt %s"
                                .formatted(pullRequestNumber, promptSpecId)
                ));
        PromptSpec releaseCandidate = releaseCandidate(requirePromptById(promptSpecId).withVersion(releaseVersion));
        String releaseTag = versioningStrategy.calculateReleaseTag(releaseCandidate);

        if (git.tagExists(releaseTag, repo)) {
            return releaseCandidate.withReleaseMetadata(releasedMetadata(
                    ReleaseMetadata.MODE_PR_TWO_PHASE,
                    releaseVersion,
                    releaseTag,
                    MAIN_BRANCH,
                    pullRequest.number(),
                    pullRequest.url(),
                    true
            ));
        }

        if (!pullRequest.merged()) {
            throw new GitException(
                    "Pull request #%d has not been merged into %s"
                            .formatted(pullRequestNumber, MAIN_BRANCH)
            );
        }

        try {
            git.checkoutBranch(MAIN_BRANCH, repo);
            writeMetadata(repoPath, releaseCandidate, releaseTag, releaseVersion);
            commitMetadataIfChanged(repo, releaseTag);
            git.tagIfMissing(releaseTag, repo);
            git.pushAll(repo);

            PromptSpec releasedOnMain = searchInPromptSpecIncludingRetired(
                    repo,
                    spec -> promptSpecId.equals(spec.getId()),
                    path -> true
            ).orElse(releaseCandidate);

            git.checkoutBranch(DEV_BRANCH, repo);
            String nextDevelopmentVersion = versioningStrategy.getNextDevelopmentVersion(releaseCandidate);
            PromptSpec developmentPrompt = releasedOnMain.withVersion(nextDevelopmentVersion);
            storePrompt(developmentPrompt, "New development version.", true);
            git.pushAll(repo);

            return releasedOnMain.withVersion(releaseVersion).withReleaseMetadata(releasedMetadata(
                    ReleaseMetadata.MODE_PR_TWO_PHASE,
                    releaseVersion,
                    releaseTag,
                    MAIN_BRANCH,
                    pullRequest.number(),
                    pullRequest.url(),
                    false
            ));
        } catch (Exception e) {
            throw new GitException(
                    "Failed to complete release for prompt %s from PR reference %s"
                            .formatted(promptSpecId, pullRequestReference),
                    e
            );
        } finally {
            git.checkoutBranch(DEV_BRANCH, repo);
        }
    }

    private Optional<String> extractReleaseVersionFromBranch(String promptSpecId, String branchName) {
        String expectedPrefix = buildReleaseBranchNamePrefix(promptSpecId);
        if (branchName == null || !branchName.startsWith(expectedPrefix)) {
            return Optional.empty();
        }
        String releaseVersion = branchName.substring(expectedPrefix.length());
        return releaseVersion.isBlank() ? Optional.empty() : Optional.of(releaseVersion);
    }

    private boolean isReleaseBranchForPrompt(String branchName, String promptSpecId) {
        return branchName != null && branchName.startsWith(buildReleaseBranchNamePrefix(promptSpecId));
    }

    private String buildReleaseBranchName(String promptSpecId, String releaseVersion) {
        return buildReleaseBranchNamePrefix(promptSpecId) + releaseVersion;
    }

    private String buildReleaseBranchNamePrefix(String promptSpecId) {
        return RELEASE_BRANCH_PREFIX + sanitizePromptIdForBranch(promptSpecId) + "-";
    }

    private static String sanitizePromptIdForBranch(String promptSpecId) {
        return promptSpecId.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "-");
    }

    private int parsePullRequestReference(String pullRequestReference) {
        String value = pullRequestReference.trim();
        Matcher numberMatcher = PR_REFERENCE_NUMBER.matcher(value);
        if (numberMatcher.matches()) {
            return Integer.parseInt(numberMatcher.group(1));
        }

        Matcher urlMatcher = PR_REFERENCE_URL.matcher(value);
        if (urlMatcher.matches()) {
            return Integer.parseInt(urlMatcher.group(1));
        }

        throw new IllegalArgumentException(
                "Invalid pull request reference '%s'. Provide a numeric PR id or pull request URL."
                        .formatted(pullRequestReference)
        );
    }

    private PromptSpec releaseCandidate(PromptSpec promptSpec) {
        String releaseVersion = versioningStrategy.calculateReleaseVersion(promptSpec);
        return promptSpec.withVersion(releaseVersion).withRevision(0);
    }

    private PromptSpec requirePromptById(String promptSpecId) {
        return getLatestVersion(promptSpecId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Could not find PromptSpec with id %s".formatted(promptSpecId))
                );
    }

    private PromptSpec withPromptReleaseLock(String promptId, Supplier<PromptSpec> operation) {
        String lockKey = promptId == null || promptId.isBlank() ? "__unknown__" : promptId;
        ReentrantLock lock = releaseLocks.computeIfAbsent(lockKey, ignored -> new ReentrantLock());
        lock.lock();
        try {
            return operation.get();
        } finally {
            lock.unlock();
        }
    }

    private ReleasePullRequestGateway requireReleasePullRequestGateway() {
        if (releasePullRequestGateway == null) {
            throw new IllegalStateException(
                    "PR-mode release requires a pull request gateway implementation"
            );
        }
        return releasePullRequestGateway;
    }

    private Path requireActiveRepoPath() {
        if (appContext.getActiveProject() == null || appContext.getActiveProject().getRepoDir() == null) {
            throw new IllegalStateException("No active project repository is configured for release operations");
        }
        return appContext.getActiveProject().getRepoDir();
    }

    private void commitMetadataIfChanged(File repo, String releaseTag) {
        try {
            git.addAllAndCommit(repo, "Release " + releaseTag);
        } catch (GitException e) {
            String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase(Locale.ROOT);
            if (!message.contains("nothing to commit")) {
                throw e;
            }
        }
    }

    private ReleaseMetadata requestedMetadata(String releaseVersion,
                                              String releaseTag,
                                              String releaseBranch,
                                              Integer pullRequestNumber,
                                              String pullRequestUrl,
                                              boolean existing) {
        return new ReleaseMetadata(
                ReleaseMetadata.STATE_REQUESTED,
                ReleaseMetadata.MODE_PR_TWO_PHASE,
                releaseVersion,
                releaseTag,
                releaseBranch,
                pullRequestNumber,
                pullRequestUrl,
                existing
        );
    }

    private ReleaseMetadata releasedMetadata(String mode,
                                             String releaseVersion,
                                             String releaseTag,
                                             String branch,
                                             Integer pullRequestNumber,
                                             String pullRequestUrl,
                                             boolean existing) {
        return new ReleaseMetadata(
                ReleaseMetadata.STATE_RELEASED,
                mode,
                releaseVersion,
                releaseTag,
                branch,
                pullRequestNumber,
                pullRequestUrl,
                existing
        );
    }

    private void cherryPickFromDevelopmentBranch(PromptSpec promptSpec, File repo) {
        git.cherryPick(DEV_BRANCH, promptSpec, repo);
    }

    private void checkoutMainBranch(File repo) {
        git.checkoutBranch(MAIN_BRANCH, repo);
    }

    private void writeMetadata(Path repoPath, PromptSpec picked, String tag, String releaseVersion) {
        GitRepositoryMetadataFile metadataFile = repositoryMetadata.read(repoPath);
        List<GitRepositoryMetadataFile.Version> versions = metadataFile.getVersions();

        GitRepositoryMetadataFile.Version v = versions.stream()
                .filter(m -> m.getId().equals(picked.getId()) && releaseVersion.equals(m.getVersion()))
                .findFirst()
                .orElse(newVersion(versions));
        v.setName(picked.getName());
        v.setGroup(picked.getGroup());
        v.setId(picked.getId());
        v.setTag(tag);
        v.setVersion(releaseVersion);

        repositoryMetadata.write(repoPath, metadataFile);
    }

    private GitRepositoryMetadataFile.Version newVersion(List<GitRepositoryMetadataFile.Version> versions) {
        GitRepositoryMetadataFile.Version v = new GitRepositoryMetadataFile.Version();
        versions.add(v);
        return v;
    }

    @Override
    public Optional<PromptSpec> findPromptSpec(String group, String name) {
        if (appContext.getActiveProject() == null) {
            return Optional.empty();
        }
        Path repoDir = appContext.getActiveProject().getRepoDir();
        if (repoDir == null) {
            return Optional.empty();
        }

        Path relativePath = resolvePromptSpecRelativePath(repoDir, group, name);
        Path specPath = repoDir.resolve(relativePath);
        if (Files.notExists(specPath)) {
            return Optional.empty();
        }

        PromptSpec promptSpec = modelYamlMapper.readValue(specPath.toFile(), PromptSpec.class);
        return Optional.of(promptSpec);
    }

    private Path resolvePromptSpecRelativePath(Path repoDir, String group, String name) {
        String canonical = fileNameStrategy.buildPromptPath(group, name);
        Path canonicalRelative = Path.of(canonical);
        Path canonicalAbsolute = repoDir.resolve(canonicalRelative);
        if (Files.exists(canonicalAbsolute)) {
            return canonicalRelative;
        }

        Optional<Path> existing = findExistingPromptSpecRelativePath(repoDir, group, name);
        return existing.orElse(canonicalRelative);
    }

    private Optional<Path> findExistingPromptSpecRelativePath(Path repoDir, String group, String name) {
        if (group == null || group.isBlank() || name == null || name.isBlank()) {
            return Optional.empty();
        }

        Path promptsDir = repoDir.resolve("prompts");
        if (Files.notExists(promptsDir)) {
            return Optional.empty();
        }

        String targetGroup = group.toLowerCase(Locale.ROOT);
        String targetName = name.toLowerCase(Locale.ROOT);

        try (var stream = Files.walk(promptsDir, 3)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().equals("promptlm.yml"))
                    .map(repoDir::relativize)
                    .filter(rel -> rel.getNameCount() >= 4)
                    .filter(rel -> rel.getName(0).toString().equals("prompts"))
                    .filter(rel -> rel.getName(1).toString().toLowerCase(Locale.ROOT).equals(targetGroup))
                    .filter(rel -> rel.getName(2).toString().toLowerCase(Locale.ROOT).equals(targetName))
                    .findFirst();
        } catch (IOException e) {
            return Optional.empty();
        }
    }
    
    /**
     * List all prompts in the store, excluding retired prompts.
     * 
     * @return List of active prompt specifications
     */
    @Override
    public List<PromptSpec> listAllPrompts() {
        // By default, only return active prompts
        return listAllPrompts(false);
    }

    @Override
    public PromptSpec getDevelopmentVersion(String id) {

        Path repoDir = appContext.getActiveProject().getRepoDir();
        git.checkoutBranch(DEV_BRANCH, repoDir.toFile());
        Optional<PromptSpec> dev = searchInPromptSpec(repoDir.toFile(), (p) -> p.getId().equals(id), p -> true);
        return dev.orElseThrow(() -> new IllegalArgumentException("Could not find PromptSpec with id %s".formatted(id)));

    }

    /**
     * List all prompts in the store
     * 
     * @param includeRetired Whether to include retired prompts in the results
     * @return List of prompt specifications
     */
    @Override
    public List<PromptSpec> listAllPrompts(boolean includeRetired) {
        if(appContext.getActiveProject() == null || appContext.getActiveProject().getRepoDir() == null) {
            return List.of();
        }
        
        File repo = appContext.getActiveProject().getRepoDir().toFile();
        if (!repo.exists() || !repo.isDirectory()) {
            return List.of();
        }
        // Use the appropriate search method based on whether we want to include retired prompts
        if (includeRetired) {
            try (var stream = walkRepo(repo.toPath())) {
                return stream
                        .filter(Files::isRegularFile)
                        .filter(this::isPromptSpec)
                        .map(path -> modelYamlMapper.readValue(path.toFile(), PromptSpec.class))
                        .toList();
            }
        }
        try (var stream = walkRepo(repo.toPath())) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(this::isPromptSpec)
                    .map(path -> modelYamlMapper.readValue(path.toFile(), PromptSpec.class))
                    .filter(spec -> spec.getStatus() == null || spec.getStatus() == PromptSpec.PromptStatus.ACTIVE)
                    .toList();
        }
    }

    private java.util.stream.Stream<Path> walkRepo(Path repoPath) {
        try {
            return Files.walk(repoPath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
