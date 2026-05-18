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

package dev.promptlm.web;

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.PromptSpecLifecycleState;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.Ref;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Date;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PromptSpecLifecycleDeriverTest {

    private static final String SPEC_RELATIVE_PATH = "prompts/support/welcome/promptlm.yml";
    private static final String SPEC_YAML = "id: welcome\nname: welcome\ngroup: support\n";

    private AppContext appContext;
    private ProjectSpec activeProject;
    private PromptSpecLifecycleDeriver deriver;

    @BeforeEach
    void setUp() {
        appContext = mock(AppContext.class);
        activeProject = mock(ProjectSpec.class);
        deriver = new PromptSpecLifecycleDeriver(appContext);
    }

    @Test
    void returnsNullWhenActiveProjectIsAbsent(@TempDir Path tempDir) {
        when(appContext.getActiveProject()).thenReturn(null);

        PromptSpec spec = newSpecWithPath(Path.of(SPEC_RELATIVE_PATH));

        assertThat(deriver.derive(spec)).isNull();
    }

    @Test
    void returnsNullWhenRepoDirIsMissing(@TempDir Path tempDir) {
        when(appContext.getActiveProject()).thenReturn(activeProject);
        when(activeProject.getRepoDir()).thenReturn(tempDir.resolve("does-not-exist"));

        PromptSpec spec = newSpecWithPath(Path.of(SPEC_RELATIVE_PATH));

        assertThat(deriver.derive(spec)).isNull();
    }

    @Test
    void returnsPushedWhenWorkingTreeMatchesHeadAndOriginIsUpToDate(@TempDir Path tempDir) throws Exception {
        Path local = initRepoWithPromptCommit(tempDir.resolve("local"));
        Path remote = initBareRemote(tempDir.resolve("remote.git"));
        configureRemoteAndPush(local, remote);

        wireActiveProject(local);
        PromptSpec spec = newSpecWithPath(Path.of(SPEC_RELATIVE_PATH));

        assertThat(deriver.derive(spec)).isEqualTo(PromptSpecLifecycleState.PUSHED);
    }

    @Test
    void returnsCommittedWhenWorkingTreeMatchesHeadButOriginIsBehind(@TempDir Path tempDir) throws Exception {
        Path local = initRepoWithPromptCommit(tempDir.resolve("local"));
        Path remote = initBareRemote(tempDir.resolve("remote.git"));
        configureRemoteAndPush(local, remote);

        // Add a second, unpushed commit so origin/main is behind local main.
        Path promptFile = local.resolve(SPEC_RELATIVE_PATH);
        Files.writeString(promptFile, SPEC_YAML + "description: updated\n");
        try (Git git = Git.open(local.toFile())) {
            git.add().addFilepattern(SPEC_RELATIVE_PATH).call();
            git.commit()
                    .setMessage("Update prompt")
                    .setAuthor(testIdent())
                    .setCommitter(testIdent())
                    .call();
        }

        wireActiveProject(local);
        PromptSpec spec = newSpecWithPath(Path.of(SPEC_RELATIVE_PATH));

        assertThat(deriver.derive(spec)).isEqualTo(PromptSpecLifecycleState.COMMITTED);
    }

    @Test
    void returnsCommittedWhenRemoteTrackingBranchIsAbsent(@TempDir Path tempDir) throws Exception {
        Path local = initRepoWithPromptCommit(tempDir.resolve("local"));
        // No remote configured / no push performed.

        wireActiveProject(local);
        PromptSpec spec = newSpecWithPath(Path.of(SPEC_RELATIVE_PATH));

        assertThat(deriver.derive(spec)).isEqualTo(PromptSpecLifecycleState.COMMITTED);
    }

    @Test
    void returnsSavedWhenWorkingTreeDiffersFromHead(@TempDir Path tempDir) throws Exception {
        Path local = initRepoWithPromptCommit(tempDir.resolve("local"));
        // Mutate the working tree without committing.
        Files.writeString(local.resolve(SPEC_RELATIVE_PATH), SPEC_YAML + "description: edited\n");

        wireActiveProject(local);
        PromptSpec spec = newSpecWithPath(Path.of(SPEC_RELATIVE_PATH));

        assertThat(deriver.derive(spec)).isEqualTo(PromptSpecLifecycleState.SAVED);
    }

    @Test
    void returnsSavedWhenPathHasNoBlobAtHead(@TempDir Path tempDir) throws Exception {
        Path local = initRepoWithPromptCommit(tempDir.resolve("local"));
        // Add a brand-new spec file to disk that was never committed.
        Path newSpec = local.resolve("prompts/support/new-thing/promptlm.yml");
        Files.createDirectories(newSpec.getParent());
        Files.writeString(newSpec, "id: new-thing\n");

        wireActiveProject(local);
        PromptSpec spec = newSpecWithPath(Path.of("prompts/support/new-thing/promptlm.yml"));

        assertThat(deriver.derive(spec)).isEqualTo(PromptSpecLifecycleState.SAVED);
    }

    @Test
    void returnsNullWhenSpecPathIsNotConfigured(@TempDir Path tempDir) throws Exception {
        Path local = initRepoWithPromptCommit(tempDir.resolve("local"));
        wireActiveProject(local);

        PromptSpec spec = PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder().withModel("m").withVendor("v").build())
                .build();

        assertThat(deriver.derive(spec)).isNull();
    }

    private void wireActiveProject(Path repoDir) {
        when(appContext.getActiveProject()).thenReturn(activeProject);
        when(activeProject.getRepoDir()).thenReturn(repoDir);
    }

    private PromptSpec newSpecWithPath(Path relativePath) {
        return PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder().withModel("m").withVendor("v").build())
                .withPath(relativePath)
                .build();
    }

    private static Path initRepoWithPromptCommit(Path repoDir) throws Exception {
        Files.createDirectories(repoDir);
        try (Git git = Git.init()
                .setInitialBranch("main")
                .setDirectory(repoDir.toFile())
                .call()) {
            Path promptFile = repoDir.resolve(SPEC_RELATIVE_PATH);
            Files.createDirectories(promptFile.getParent());
            Files.writeString(promptFile, SPEC_YAML);
            git.add().addFilepattern(SPEC_RELATIVE_PATH).call();
            git.commit()
                    .setMessage("Add prompt")
                    .setAuthor(testIdent())
                    .setCommitter(testIdent())
                    .call();
        }
        return repoDir;
    }

    private static Path initBareRemote(Path remoteDir) throws Exception {
        Files.createDirectories(remoteDir);
        try (Git ignored = Git.init()
                .setBare(true)
                .setInitialBranch("main")
                .setDirectory(remoteDir.toFile())
                .call()) {
            // bare repo, nothing else to do
        }
        return remoteDir;
    }

    private static void configureRemoteAndPush(Path local, Path remote) throws Exception {
        try (Git git = Git.open(local.toFile())) {
            git.remoteAdd()
                    .setName("origin")
                    .setUri(new org.eclipse.jgit.transport.URIish(remote.toUri().toString()))
                    .call();
            git.push().setRemote("origin").add("main").call();
            // Verify the remote-tracking ref is in place.
            Ref originMain = git.getRepository().findRef("refs/remotes/origin/main");
            assertThat(originMain).isNotNull();
        }
    }

    private static PersonIdent testIdent() {
        return new PersonIdent(
                "PromptLM Test",
                "promptlm@example.com",
                Date.from(Instant.parse("2026-05-18T12:00:00Z")),
                TimeZone.getTimeZone("UTC"));
    }
}
