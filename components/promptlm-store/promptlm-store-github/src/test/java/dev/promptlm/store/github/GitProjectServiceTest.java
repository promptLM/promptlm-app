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

import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.events.ProjectCreatedEvent;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.repository.template.RepositoryTemplateExtractor;
import dev.promptlm.store.api.ProjectService;
import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import dev.promptlm.store.api.RepositoryOwner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.ApplicationEventPublisher;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class GitProjectServiceTest {

    private ProjectService service;
    private Path repoDir;
    private BasicAppContext appContext;
    private GitHubProperties gitHubProperties;
    private RemoteGitRepositoryProvisioner remoteRepositoryProvisioner;
    private RepositoryTemplateExtractor templateExtractor;
    private ApplicationEventPublisher eventPublisher;
    private Git git;
    private TrustedRemotePolicy trustedRemotePolicy;
    private LocalWorkspacePathPolicy localWorkspacePathPolicy;
    private Path workspaceRoot;

    @BeforeEach
    public void setUp(@TempDir Path tempDir) throws Exception {
        workspaceRoot = tempDir;
        repoDir = tempDir.resolve("repo");
        eventPublisher = mock(ApplicationEventPublisher.class);
        git = mock(Git.class);
        appContext = new BasicAppContext();
        gitHubProperties = new GitHubProperties();
        gitHubProperties.setBaseUrl("http://localhost:8080");
        gitHubProperties.setUsername("owner");
        remoteRepositoryProvisioner = mock(RemoteGitRepositoryProvisioner.class);
        templateExtractor = mock(RepositoryTemplateExtractor.class);
        trustedRemotePolicy = new TrustedRemotePolicy(gitHubProperties);
        StoreLocalProperties storeLocalProperties = new StoreLocalProperties();
        storeLocalProperties.setWorkspaceRoot(workspaceRoot);
        localWorkspacePathPolicy = new LocalWorkspacePathPolicy(storeLocalProperties);
        service = new GitProjectService(
                appContext,
                gitHubProperties,
                git,
                eventPublisher,
                templateExtractor,
                remoteRepositoryProvisioner,
                trustedRemotePolicy,
                localWorkspacePathPolicy
        );
        Files.createDirectories(repoDir);
    }

    @Test
    @DisplayName("should create local and remote repo if none exists")
    void shouldCreateLocalAndRemoteRepoIfNoneExists() throws Exception {
        String projectName = "repo";
        Path baseDir = workspaceRoot.resolve("projects");
        Files.createDirectories(baseDir);
        Path repoDir = baseDir.resolve(projectName);
        String remoteUrl = "http://some.remote";
        URL gitCloneUrl = URI.create(remoteUrl).toURL();

        String owner = "owner";
        RemoteRepository createdRemoteRepository = GitHubRepository.create(owner, projectName, gitCloneUrl);

        when(remoteRepositoryProvisioner.createRemoteRepository(owner, projectName)).thenReturn(createdRemoteRepository);

        ProjectSpec projectSpec = service.newProject(baseDir, owner, projectName);

        assertThat(projectSpec).isNotNull();
        assertThat(projectSpec.getName()).isEqualTo(projectName);
        assertThat(projectSpec.getRepoDir()).isEqualTo(repoDir);
        assertThat(projectSpec.getRepoUrl()).isEqualTo(remoteUrl);

        verify(git).createRepository(repoDir, remoteUrl);
        verify(templateExtractor).extractTo(repoDir);
        verify(git).addAllAndCommit(repoDir.toFile(), "initial commit");
        verify(git).checkoutOrCreateBranch(GitProjectService.DEVELOPMENT_BRANCH, repoDir.toFile());
        verify(git, times(2)).pushAll(repoDir.toFile());
        assertThat(appContext.getActiveProject()).isSameAs(projectSpec);
        verify(eventPublisher).publishEvent((Object) argThat( event -> {
            if (!(event instanceof ProjectCreatedEvent)) {
                return false;
            }
            ProjectCreatedEvent createdEvent = (ProjectCreatedEvent) event;
            return projectName.equals(createdEvent.getProjectSpec().getName())
                    && remoteUrl.equals(createdEvent.getProjectSpec().getRepoUrl());
        }));
    }

    @Test
    @DisplayName("should throw typed conflict when remote repository already exists")
    void shouldThrowTypedConflictWhenRemoteRepositoryAlreadyExists() throws Exception {
        Path baseDir = workspaceRoot.resolve("projects");
        Files.createDirectories(baseDir);
        when(remoteRepositoryProvisioner.repositoryExists("http://localhost:8080", "owner", "repo"))
                .thenReturn(true);

        assertThatThrownBy(() -> service.newProject(baseDir, "owner", "repo"))
                .isInstanceOf(RemoteRepositoryAlreadyExistsException.class)
                .hasMessageContaining("Remote repository already exists");

        verify(remoteRepositoryProvisioner, never()).createRemoteRepository(anyString(), anyString());
    }

    @Test
    @DisplayName("should reject new project outside configured workspace root")
    void shouldRejectNewProjectOutsideWorkspaceRoot() {
        Path outsideBaseDir = Path.of("/tmp/outside-workspace");

        assertThatThrownBy(() -> service.newProject(outsideBaseDir, "owner", "repo"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repoDir must be located under workspace root");
    }

    @Test
    @DisplayName("should fail for non git store")
    void shouldFailForNonGitRepository() throws Exception {
        createDirInRepo(".promptlm");
        assertThatThrownBy(() -> service.connectProject(repoDir))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid GitHub repository path: "  + repoDir.toString());
    }

    @Test
    @DisplayName("should fail for non promptlm store")
    void shouldFailForNonPromptLMRepository() throws Exception {
        createDirInRepo(".git");
        assertThatThrownBy(() -> service.connectProject(repoDir))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid GitHub repository path: "  + repoDir.toString());
    }

    @Test
    @DisplayName("should connect to git store")
    void shouldConnectToGitRepository() throws Exception {
        createDirInRepo(".git", ".promptlm");

        ProjectSpec result = service.connectProject(repoDir);

        assertThat(result.getRepoDir()).isEqualTo(repoDir);
        assertThat(appContext.getActiveProject().getRepoDir()).isEqualTo(repoDir);
    }

    @Test
    @DisplayName("should switch project when requested path is not normalized")
    void shouldSwitchProjectWhenRequestedPathIsNotNormalized() {
        Path normalizedRepoDir = repoDir.toAbsolutePath().normalize();
        ProjectSpec projectSpec = new ProjectSpec();
        projectSpec.setName("repo");
        projectSpec.setRepoDir(normalizedRepoDir);
        appContext.addProject(projectSpec);

        Path nonNormalized = normalizedRepoDir.resolve("..").resolve(normalizedRepoDir.getFileName());
        ProjectSpec switched = service.switchProject(nonNormalized);

        assertThat(switched).isSameAs(projectSpec);
        assertThat(appContext.getActiveProject()).isSameAs(projectSpec);
    }

    @Test
    @DisplayName("should register imported project in app context")
    void shouldRegisterImportedProjectInAppContext() {
        Path targetDir = workspaceRoot.resolve("clone-target");
        URI remoteUrl = URI.create("http://localhost:8080/owner/repo.git");

        when(git.cloneRepository(eq(remoteUrl.toString()), any())).thenReturn(targetDir.toFile());

        ProjectSpec imported = service.importProject(remoteUrl, targetDir);

        assertThat(imported.getRepoDir()).isEqualTo(targetDir.resolve("repo").toAbsolutePath().normalize());
        assertThat(imported.getRepoUrl()).isEqualTo(remoteUrl.toString());
        assertThat(appContext.getActiveProject()).isSameAs(imported);
        assertThat(appContext.getProjects()).contains(imported);
    }

    @Test
    @DisplayName("should reject import from untrusted remote host")
    void shouldRejectImportFromUntrustedRemoteHost() {
        Path targetDir = workspaceRoot.resolve("clone-target");
        URI remoteUrl = URI.create("https://example.com/owner/repo.git");

        assertThatThrownBy(() -> service.importProject(remoteUrl, targetDir))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Remote repository host is not allowed");
    }

    @Test
    @DisplayName("should reject import target outside configured workspace root")
    void shouldRejectImportTargetOutsideWorkspaceRoot() {
        Path outsideTargetDir = Path.of("/tmp/outside-target");
        URI remoteUrl = URI.create("http://localhost:8080/owner/repo.git");

        assertThatThrownBy(() -> service.importProject(remoteUrl, outsideTargetDir))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("targetDir must be located under workspace root");
    }

    /**
     * Ensures the Git-backed store surfaces repository owners from the provisioner for UI consumption.
     */
    @Test
    void shouldDelegateListAvailableOwnersToProvisioner() {
        List<RepositoryOwner> expected = List.of(
                RepositoryOwner.user("alice", "Alice"),
                RepositoryOwner.organization("acme", "Acme")
        );

        when(remoteRepositoryProvisioner.listAvailableOwners()).thenReturn(expected);

        assertThat(service.listAvailableOwners()).isEqualTo(expected);
    }

    @Test
    @DisplayName("should reject connect path outside configured workspace root")
    void shouldRejectConnectPathOutsideWorkspaceRoot() {
        Path outsideRepoPath = Path.of("/tmp/outside-connect");

        assertThatThrownBy(() -> service.connectProject(outsideRepoPath))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repoPath must be located under workspace root");
    }

    private void createDirInRepo(String... dirs) throws IOException {
        Stream.of(dirs).forEach(dir -> {
            try {
                Files.createDirectories(repoDir.resolve(dir));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }
}
