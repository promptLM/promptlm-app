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
import dev.promptlm.store.api.ProjectService;
import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PromptStoreController.class)
@Import(ProjectSpecUiEnricher.class)
class PromptStoreControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AppContext appContext;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private SseEmitterRegistry emitterRegistry;

    @MockitoBean
    private SseStatusPublisher sseStatusPublisher;

    @Test
    void registerStoreEventsShouldRegisterPrefixedKey() throws Exception {
        mockMvc.perform(get("/api/store/events/op-1"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));

        verify(emitterRegistry).register(eq("store:op-1"), any(SseEmitter.class));
        verify(sseStatusPublisher).connected(eq("store:op-1"), eq("store"), anyMap());
    }

    @Test
    void getAllProjectsShouldExposeUiFieldsAndHideLegacyFields(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("repo");
        Files.createDirectories(repoDir);

        LocalDateTime createdAt = LocalDateTime.of(2020, 1, 1, 10, 0, 0);
        LocalDateTime updatedAt = LocalDateTime.of(2020, 1, 2, 12, 30, 0);

        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

        Path prompt1 = repoDir.resolve("prompt-a").resolve("promptlm.yml");
        Files.createDirectories(prompt1.getParent());
        Files.writeString(prompt1, "id: a\nname: A\n");
        Files.setLastModifiedTime(prompt1, FileTime.from(createdAt.atZone(ZoneId.systemDefault()).toInstant()));

        Path prompt2 = repoDir.resolve("prompt-b").resolve("promptlm.yml");
        Files.createDirectories(prompt2.getParent());
        Files.writeString(prompt2, "id: b\nname: B\n");
        Files.setLastModifiedTime(prompt2, FileTime.from(updatedAt.atZone(ZoneId.systemDefault()).toInstant()));

        ProjectSpec project = new ProjectSpec();
        project.setName("repo");
        project.setRepoDir(repoDir);
        project.setRepoUrl("https://example.com/my-org/repo");
        project.setOrg("my-org");

        when(appContext.getActiveProject()).thenReturn(project);
        when(appContext.getProjects()).thenReturn(List.of(project));

        mockMvc.perform(get("/api/store/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].repositoryUrl").value("https://example.com/my-org/repo"))
                .andExpect(jsonPath("$[0].localPath").value(repoDir.toString()))
                .andExpect(jsonPath("$[0].promptCount").value(2))
                .andExpect(jsonPath("$[0].createdAt").value(createdAt.format(dateTimeFormatter)))
                .andExpect(jsonPath("$[0].updatedAt").value(updatedAt.format(dateTimeFormatter)))
                .andExpect(jsonPath("$[0].repoUrl").doesNotExist())
                .andExpect(jsonPath("$[0].repoDir").doesNotExist())
                .andExpect(jsonPath("$[0].org").doesNotExist());
    }

    @Test
    void getAllProjectsShouldMarkMissingLocalRepositoryAsBroken(@TempDir Path tempDir) throws Exception {
        Path missingRepoDir = tempDir.resolve("missing-repo");

        ProjectSpec project = new ProjectSpec();
        project.setName("missing-repo");
        project.setRepoDir(missingRepoDir);

        when(appContext.getActiveProject()).thenReturn(project);
        when(appContext.getProjects()).thenReturn(List.of(project));

        mockMvc.perform(get("/api/store/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].healthStatus").value("BROKEN_LOCAL"))
                .andExpect(jsonPath("$[0].healthMessage").value(containsString("Local repository missing at")))
                .andExpect(jsonPath("$[0].healthMessage").value(containsString(missingRepoDir.toAbsolutePath().toString())))
                .andExpect(jsonPath("$[0].promptCount").value(0));
    }

    @Test
    void createStoreAppliesDescription(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("repo-parent");
        Files.createDirectories(repoDir);

        CreateStoreRequest request = new CreateStoreRequest();
        request.setRepoDir(repoDir.toString());
        request.setRepoName("repo-name");
        request.setDescription("  My project description  ");

        ProjectSpec created = new ProjectSpec();
        created.setName("repo-name");
        created.setRepoDir(repoDir.resolve("repo-name"));
        when(projectService.newProject(eq(repoDir), eq(null), eq("repo-name"))).thenReturn(created);

        mockMvc.perform(post("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("My project description"));
    }

    @Test
    void createStoreShouldReturnConflictWhenRemoteRepositoryAlreadyExists(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("repo-parent");
        Files.createDirectories(repoDir);

        CreateStoreRequest request = new CreateStoreRequest();
        request.setRepoDir(repoDir.toString());
        request.setRepoName("repo-name");
        request.setRepoGroup("team");

        when(projectService.newProject(eq(repoDir), eq("team"), eq("repo-name")))
                .thenThrow(new RemoteRepositoryAlreadyExistsException("https://github.com", "team", "repo-name"));

        mockMvc.perform(post("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void createStoreShouldReturnBadRequestForInvalidInput(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("repo-parent");
        Files.createDirectories(repoDir);

        CreateStoreRequest request = new CreateStoreRequest();
        request.setRepoDir(repoDir.toString());
        request.setRepoName("repo-name");

        when(projectService.newProject(eq(repoDir), eq(null), eq("repo-name")))
                .thenThrow(new IllegalArgumentException("repoDir must be located under workspace root"));

        mockMvc.perform(post("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cloneStorePublishesLifecycleEventsWhenOperationIdProvided(@TempDir Path tempDir) throws Exception {
        Path targetDir = tempDir.resolve("clone-target");
        Files.createDirectories(targetDir);

        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setOperationId("clone-op-1");
        request.setRemoteUrl(java.net.URI.create("https://example.com/demo.git"));
        request.setTargetDir(targetDir);
        request.setName("  Demo Clone  ");

        ProjectSpec cloned = new ProjectSpec();
        cloned.setId(java.util.UUID.fromString("11111111-1111-1111-1111-111111111111"));
        cloned.setName("demo-clone");
        cloned.setRepoDir(targetDir.resolve("demo-clone"));

        when(projectService.importProject(eq(request.getRemoteUrl()), eq(targetDir))).thenReturn(cloned);

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("11111111-1111-1111-1111-111111111111"));

        verify(sseStatusPublisher).started(eq("store:clone-op-1"), eq("store"), eq("Clone request started"), anyMap());
        verify(sseStatusPublisher).completed(eq("store:clone-op-1"), eq("store"), eq("Repository clone completed"), anyMap());
    }

    /**
     * Ensures the clone/import flow always yields a stable project id. If the ProjectService returns a ProjectSpec
     * without an id, the controller must derive one (and must not null-deref on successful clone).
     */
    @Test
    void cloneStoreShouldDeriveIdWhenMissing(@TempDir Path tempDir) throws Exception {
        Path targetDir = tempDir.resolve("clone-target");
        Files.createDirectories(targetDir);

        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setRemoteUrl(java.net.URI.create("https://example.com/demo.git"));
        request.setTargetDir(targetDir);

        ProjectSpec cloned = new ProjectSpec();
        Path repoDir = targetDir.resolve("demo").toAbsolutePath().normalize();
        cloned.setName("demo");
        cloned.setRepoDir(repoDir);
        when(projectService.importProject(eq(request.getRemoteUrl()), eq(targetDir))).thenReturn(cloned);

        UUID expected = UUID.nameUUIDFromBytes(repoDir.toString().getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string(expected.toString()));
    }

    @Test
    void cloneStoreShouldReturnBadRequestForInvalidRemoteUrl(@TempDir Path tempDir) throws Exception {
        Path targetDir = tempDir.resolve("clone-target");
        Files.createDirectories(targetDir);

        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setOperationId("clone-invalid-1");
        request.setRemoteUrl(java.net.URI.create("https://example.com/demo.git"));
        request.setTargetDir(targetDir);

        when(projectService.importProject(eq(request.getRemoteUrl()), eq(targetDir)))
                .thenThrow(new IllegalArgumentException("Remote repository host is not allowed"));

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(sseStatusPublisher).failed(eq("store:clone-invalid-1"), eq("store"), eq("Repository clone failed"), anyMap());
    }

    @Test
    void cloneStoreShouldReturnInternalServerErrorForUnexpectedFailure(@TempDir Path tempDir) throws Exception {
        Path targetDir = tempDir.resolve("clone-target");
        Files.createDirectories(targetDir);

        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setOperationId("clone-failure-1");
        request.setRemoteUrl(java.net.URI.create("https://example.com/demo.git"));
        request.setTargetDir(targetDir);

        when(projectService.importProject(eq(request.getRemoteUrl()), eq(targetDir)))
                .thenThrow(new RuntimeException("Clone failed unexpectedly"));

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());

        verify(sseStatusPublisher).failed(eq("store:clone-failure-1"), eq("store"), eq("Repository clone failed"), anyMap());
    }

    @Test
    void cloneStoreShouldReturnBadRequestWhenRemoteUrlIsMissing(@TempDir Path tempDir) throws Exception {
        Path targetDir = tempDir.resolve("clone-target");
        Files.createDirectories(targetDir);

        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setOperationId("clone-missing-remote");
        request.setTargetDir(targetDir);

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(projectService, never()).importProject(any(java.net.URI.class), any(Path.class));
        verify(sseStatusPublisher, never()).started(eq("store:clone-missing-remote"), eq("store"), eq("Clone request started"), anyMap());
        verify(sseStatusPublisher, never()).completed(eq("store:clone-missing-remote"), eq("store"), eq("Repository clone completed"), anyMap());
        verify(sseStatusPublisher).failed(eq("store:clone-missing-remote"), eq("store"), eq("Repository clone failed"), anyMap());
    }

    @Test
    void cloneStoreShouldReturnBadRequestWhenTargetDirIsMissing() throws Exception {
        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setOperationId("clone-missing-target");
        request.setRemoteUrl(java.net.URI.create("https://example.com/demo.git"));

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(projectService, never()).importProject(any(java.net.URI.class), any(Path.class));
        verify(sseStatusPublisher, never()).started(eq("store:clone-missing-target"), eq("store"), eq("Clone request started"), anyMap());
        verify(sseStatusPublisher, never()).completed(eq("store:clone-missing-target"), eq("store"), eq("Repository clone completed"), anyMap());
        verify(sseStatusPublisher).failed(eq("store:clone-missing-target"), eq("store"), eq("Repository clone failed"), anyMap());
    }

    @Test
    void cloneStoreWithoutOperationIdShouldNotPublishSseEventsOnValidationFailure() throws Exception {
        CloneStoreRepoRequest request = new CloneStoreRepoRequest();
        request.setRemoteUrl(java.net.URI.create("https://example.com/demo.git"));

        mockMvc.perform(put("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(projectService, never()).importProject(any(java.net.URI.class), any(Path.class));
        verifyNoInteractions(sseStatusPublisher, emitterRegistry);
    }

    @Test
    void connectRepositoryAppliesDisplayName(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("existing-repo");
        Files.createDirectories(repoDir);

        ConnectRepositoryRequest request = new ConnectRepositoryRequest();
        request.setRepoPath(repoDir);
        request.setDisplayName("  Custom Name  ");

        ProjectSpec connected = new ProjectSpec();
        connected.setName("existing-repo");
        connected.setRepoDir(repoDir);
        when(projectService.connectProject(eq(repoDir))).thenReturn(connected);

        mockMvc.perform(post("/api/store/connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Custom Name"));
    }

    @Test
    void connectRepositoryShouldReturnBadRequestWhenProjectIsInvalid(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("missing-repo");

        ConnectRepositoryRequest request = new ConnectRepositoryRequest();
        request.setRepoPath(repoDir);

        when(projectService.connectProject(eq(repoDir)))
                .thenThrow(new IllegalArgumentException("Invalid GitHub repository path: " + repoDir));

        mockMvc.perform(post("/api/store/connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
