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
import java.util.Optional;
import java.util.function.Predicate;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.store.api.PromptStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class GitHubPromptStore implements PromptStore {

    public static final String MAIN_BRANCH = "main";
    public static final String DEV_BRANCH = "development";
    private final ObjectMapper modelYamlMapper;
    private final GitFileNameStrategy fileNameStrategy;
    private final Git git;
    private final AppContext appContext;
    private final VersioningStrategy versioningStrategy;
    private final GitRepositoryMetadata repositoryMetadata;

    public GitHubPromptStore(@Qualifier("modelYamlMapper") ObjectMapper modelYamlMapper,
                             GitFileNameStrategy fileNameStrategy,
                             Git git,
                             AppContext appContext,
                             IntVersioningStrategy versioningStrategy,
                             GitRepositoryMetadata repositoryMetadata) {
        this.modelYamlMapper = modelYamlMapper;
        this.versioningStrategy = versioningStrategy;
        this.fileNameStrategy = fileNameStrategy;
        this.git = git;
        this.appContext = appContext;
        this.repositoryMetadata = repositoryMetadata;
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
    public PromptSpec release(PromptSpec promptSpec) {

        // checkout main branch
        File repo = checkoutMainBranch();

        PromptSpec releasedPrompt = promptSpec;
        try {
            // cherry-pick prompt from development onto main branch
            cherryPickFromDevelopmentBranch(promptSpec, repo);

            // set release version
            String releaseVersion = versioningStrategy.calculateReleaseVersion(promptSpec);
            releasedPrompt = promptSpec.withVersion(releaseVersion).withRevision(0);
            storePrompt(releasedPrompt, "Released", false);
            String tag = versioningStrategy.calculateReleaseTag(releasedPrompt);
            String message = "Release " + tag;
            Path repoPath = appContext.getActiveProject().getRepoDir();
            writeMetadata(repoPath, releasedPrompt, tag, releaseVersion);
            git.addAllAndCommit(repo, message);
            git.tag(tag, repo);
            git.pushAll(repo);

            // checkout development for next snapshot
            git.checkoutBranch(DEV_BRANCH, repo);

            // set next snapshot version
            String newVersion = versioningStrategy.getNextDevelopmentVersion(releasedPrompt);
            PromptSpec developmentPrompt = releasedPrompt.withVersion(newVersion);
            storePrompt(developmentPrompt, "New development version.", true);
            git.pushAll(repo);
            return developmentPrompt;
        } catch (Exception e) {
            throw new GitException("Failed to release prompt %s".formatted(promptSpec.getId()), e);
        } finally {
            git.checkoutBranch(DEV_BRANCH, repo);
        }
    }

    private void cherryPickFromDevelopmentBranch(PromptSpec promptSpec, File repo) {
        git.cherryPick(DEV_BRANCH, promptSpec, repo);
    }

    private File checkoutMainBranch() {
        File repo = appContext.getActiveProject().getRepoDir().toFile();
        git.checkoutBranch(MAIN_BRANCH, repo);
        return repo;
    }

    private void writeMetadata(Path repoPath, PromptSpec picked, String tag, String releaseVersion) {
        GitRepositoryMetadataFile metadataFile = repositoryMetadata.read(repoPath);
        List<GitRepositoryMetadataFile.Version> versions = metadataFile.getVersions();

        GitRepositoryMetadataFile.Version v = versions.stream()
                .filter(m -> m.getId().equals(picked.getId()))
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
