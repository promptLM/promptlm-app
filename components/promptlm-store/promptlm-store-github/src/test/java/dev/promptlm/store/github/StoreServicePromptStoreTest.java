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

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StoreServicePromptStoreTest {

    @Test
    void commitMessageShouldBeFormatted(@TempDir Path repoDir) throws Exception {
        BranchNameStrategy branchNameStrategy = mock(BranchNameStrategy.class);
        GitFileNameStrategy fileNameStrategy = mock(GitFileNameStrategy.class);
        Git git = mock(Git.class);

        ProjectSpec projectSpec = mock(ProjectSpec.class);
        when(projectSpec.getRepoDir()).thenReturn(repoDir);
        AppContext appContext = new BasicAppContext();
        appContext.setActiveProject(projectSpec);

        when(git.getBranchName(repoDir.toFile())).thenReturn("main");
        when(branchNameStrategy.buildName(any(PromptSpec.class))).thenReturn("feature");
        when(fileNameStrategy.buildPromptPath("grp","prompt")).thenReturn("prompts/grp/prompt/promptlm.yml");

        GitRepositoryMetadata repositoryMetadata = mock(GitRepositoryMetadata.class);
        GitRepositoryMetadataFile metadataFile = new GitRepositoryMetadataFile();
        when(repositoryMetadata.read(repoDir)).thenReturn(metadataFile);

        GitHubPromptStore store = new GitHubPromptStore(ObjectMapperFactory.createYamlMapper(),
                fileNameStrategy,
                git,
                appContext,
                new IntVersioningStrategy(),
                repositoryMetadata);

        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .withVendor("v")
                .withUrl("u")
                .withModel("m")
                .withMessages(List.of())
                .build();

        PromptSpec spec = PromptSpec.builder()
                .withName("prompt")
                .withVersion("1")
                .withRevision(1)
                .withDescription("d")
                .withRequest(request)
                .build()
                .withGroup("grp")
                .withRevision(1);

        store.storePrompt(spec);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(git).addAllAndCommit(eq(repoDir.toFile()), captor.capture());

        String commitMessage = captor.getValue();
        assertThat(commitMessage).isEqualTo("Add prompt prompt/grp rev 1");
    }

    @Test
    void findPromptSpecReturnsPromptWhenPromptFileExists(@TempDir Path repoDir) throws Exception {
        GitFileNameStrategy fileNameStrategy = new GitFileNameStrategy();

        ProjectSpec projectSpec = ProjectSpec.fromRepo(repoDir);
        AppContext appContext = new BasicAppContext();
        appContext.setActiveProject(projectSpec);

        Git git = mock(Git.class);

        GitRepositoryMetadata repositoryMetadata = mock(GitRepositoryMetadata.class);

        GitHubPromptStore store = new GitHubPromptStore(ObjectMapperFactory.createYamlMapper(),
                fileNameStrategy,
                git,
                appContext,
                new IntVersioningStrategy(),
                repositoryMetadata);

        PromptSpec storedSpec = PromptSpec.builder()
                .withGroup("grp")
                .withName("prompt")
                .withVersion("1")
                .withRevision(1)
                .withDescription("d")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("v")
                        .withUrl("u")
                        .withModel("m")
                        .withMessages(List.of())
                        .build())
                .build()
                .withId("grp/prompt");

        Path specPath = repoDir.resolve(fileNameStrategy.buildPromptPath("grp", "prompt"));
        Files.createDirectories(specPath.getParent());
        Files.writeString(specPath, ObjectMapperFactory.createYamlMapper().writeValueAsString(storedSpec));

        assertThat(store.findPromptSpec("grp", "prompt"))
                .isPresent()
                .get()
                .extracting(PromptSpec::getGroup, PromptSpec::getName, PromptSpec::getId)
                .containsExactly("grp", "prompt", "grp/prompt");

        assertThat(store.findPromptSpec("grp", "missing")).isEmpty();

        assertThatThrownBy(() -> store.findPromptSpec("", "prompt"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /**
     * Ensures prompt lookup is case-insensitive: when an existing prompt file is stored under a mixed-case
     * group/name directory, querying via lowercase group/name must still find it.
     */
    @Test
    void findPromptSpecShouldBeCaseInsensitive(@TempDir Path repoDir) throws Exception {
        GitFileNameStrategy fileNameStrategy = new GitFileNameStrategy();

        ProjectSpec projectSpec = ProjectSpec.fromRepo(repoDir);
        AppContext appContext = new BasicAppContext();
        appContext.setActiveProject(projectSpec);

        Git git = mock(Git.class);
        GitRepositoryMetadata repositoryMetadata = mock(GitRepositoryMetadata.class);

        GitHubPromptStore store = new GitHubPromptStore(ObjectMapperFactory.createYamlMapper(),
                fileNameStrategy,
                git,
                appContext,
                new IntVersioningStrategy(),
                repositoryMetadata);

        PromptSpec storedSpec = PromptSpec.builder()
                .withGroup("Support")
                .withName("Welcome")
                .withVersion("1")
                .withRevision(1)
                .withDescription("d")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("v")
                        .withUrl("u")
                        .withModel("m")
                        .withMessages(List.of())
                        .build())
                .build()
                .withId("support/welcome");

        Path mixedCasePath = repoDir.resolve(Path.of("prompts/Support/Welcome/promptlm.yml"));
        Files.createDirectories(mixedCasePath.getParent());
        Files.writeString(mixedCasePath, ObjectMapperFactory.createYamlMapper().writeValueAsString(storedSpec));

        assertThat(store.findPromptSpec("support", "welcome"))
                .isPresent();
    }

}
