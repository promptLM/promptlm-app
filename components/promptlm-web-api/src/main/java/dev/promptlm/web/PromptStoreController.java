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
import dev.promptlm.store.api.RepositoryOwner;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/store")
@Tag(name = "Prompt Store", description = "API for managing prompt store repositories and projects")
public class PromptStoreController {

    private final AppContext appContext;
    private final ProjectService projectService;
    private final ProjectSpecUiEnricher projectSpecUiEnricher;
    private final SseEmitterRegistry emitterRegistry;
    private final SseStatusPublisher sseStatusPublisher;

    public PromptStoreController(AppContext appContext,
                                 ProjectService projectService,
                                 ProjectSpecUiEnricher projectSpecUiEnricher,
                                 SseEmitterRegistry emitterRegistry,
                                 SseStatusPublisher sseStatusPublisher) {
        this.appContext = appContext;
        this.projectService = projectService;
        this.projectSpecUiEnricher = projectSpecUiEnricher;
        this.emitterRegistry = emitterRegistry;
        this.sseStatusPublisher = sseStatusPublisher;
    }

    @Operation(summary = "Get active project", 
               description = "Returns the currently active project in the application context")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Active project found",
                    content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = ProjectSpec.class))),
        @ApiResponse(responseCode = "404", description = "No active project found")
    })
    @GetMapping
    public ResponseEntity<ProjectSpec> getActiveProject() {
        ProjectSpec activeProject = ensureProjectIdentity(appContext.getActiveProject());
        return ResponseEntity.ok(activeProject);
    }

    @Operation(summary = "List available repository owners",
               description = "Returns the authenticated user and organizations available for repository creation")
    @ApiResponse(responseCode = "200", description = "Owners retrieved successfully",
            content = @Content(mediaType = "application/json",
                    array = @ArraySchema(schema = @Schema(implementation = RepositoryOwner.class))))
    @GetMapping("/owners")
    public ResponseEntity<List<RepositoryOwner>> listOwners() {
        return ResponseEntity.ok(projectService.listAvailableOwners());
    }

    @Operation(summary = "Create new store", 
               description = "Creates a new prompt store repository in the specified directory")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Store created successfully",
                    content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = ProjectSpec.class)))
    })
    @PostMapping
    public ResponseEntity<ProjectSpec> createStore(
            @Parameter(description = "Create store request details", required = true) 
            @Validated @RequestBody CreateStoreRequest request) throws RemoteRepositoryAlreadyExistsException {
        try {
            Path repoDir = Path.of(request.getRepoDir());
            ProjectSpec projectSpec = projectService.newProject(repoDir, request.getRepoGroup(), request.getRepoName());
            if (StringUtils.hasText(request.getDescription())) {
                projectSpec.setDescription(request.getDescription().trim());
            }
            return ResponseEntity.ok(ensureProjectIdentity(projectSpec));
        } catch (RemoteRepositoryAlreadyExistsException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @Operation(summary = "Clone existing store", 
               description = "Clones an existing prompt store repository from a remote URL")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Store cloned successfully, returns the result message",
                    content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = String.class)))
    })
    @PutMapping
    public ResponseEntity<String> cloneStore(
            @Parameter(description = "Clone store request details", required = true) 
            @RequestBody CloneStoreRepoRequest request) {
        String operationId = normalizeOperationId(request.getOperationId());
        String emitterKey = buildEmitterKey(operationId);
        Map<String, Object> baseDetails = buildStoreEventDetails(request, operationId);

        try {
            URI remoteUrl = requireCloneRemoteUrl(request);
            Path targetDir = requireCloneTargetDir(request);

            if (emitterKey != null) {
                sseStatusPublisher.started(emitterKey, "store", "Clone request started", baseDetails);
            }

            ProjectSpec projectSpec = projectService.importProject(remoteUrl, targetDir);
            if (StringUtils.hasText(request.getName())) {
                projectSpec.setName(request.getName().trim());
            }

            projectSpec = ensureProjectIdentity(projectSpec);
            if (emitterKey != null) {
                Map<String, Object> completedDetails = buildCompletedStoreEventDetails(baseDetails, projectSpec);
                sseStatusPublisher.completed(emitterKey, "store", "Repository clone completed", completedDetails);
                emitterRegistry.findEmitter(emitterKey).ifPresent(SseEmitter::complete);
            }
            return ResponseEntity.ok(projectSpec.getId().toString());
        } catch (RuntimeException ex) {
            if (emitterKey != null) {
                Map<String, Object> failedDetails = buildFailedStoreEventDetails(baseDetails, ex);
                sseStatusPublisher.failed(emitterKey, "store", "Repository clone failed", failedDetails);
                emitterRegistry.findEmitter(emitterKey).ifPresent(SseEmitter::complete);
            }
            throw mapCloneStoreStatus(ex);
        }
    }

    @Operation(summary = "Connect to existing repository", 
               description = "Connects to an existing prompt store repository at the specified path")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Connected to repository successfully",
                    content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ProjectSpec.class)))
    })
    @PostMapping("/connection")
    public ResponseEntity<ProjectSpec> connectRepository(
            @Parameter(description = "Repository path", required = true) 
            @RequestBody ConnectRepositoryRequest request) {
        try {
            ProjectSpec p = projectService.connectProject(request.getRepoPath());
            if (StringUtils.hasText(request.getDisplayName())) {
                p.setName(request.getDisplayName().trim());
            }
            return ResponseEntity.ok(ensureProjectIdentity(p));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @Operation(summary = "Get all projects", 
               description = "Returns a list of all available projects")
    @ApiResponse(responseCode = "200", description = "List of projects retrieved successfully",
            content = @Content(mediaType = "application/json", 
                    array = @ArraySchema(schema = @Schema(implementation = ProjectSpec.class))))
    @GetMapping("/all")
    public ResponseEntity<List<ProjectSpec>> getAllProjects() {
        ProjectSpec activeProject = projectSpecUiEnricher.enrich(ensureProjectIdentity(appContext.getActiveProject()));
        List<ProjectSpec> projects = new ArrayList<>(appContext.getProjects());
        projects.replaceAll(project -> projectSpecUiEnricher.enrich(ensureProjectIdentity(project)));
        if (activeProject != null && projects.stream().noneMatch(project -> project.getId() != null && project.getId().equals(activeProject.getId()))) {
            projects.add(activeProject);
        }
        UUID activeProjectId = activeProject != null ? activeProject.getId() : null;
        projects.sort(
                Comparator
                        .comparing((ProjectSpec project) -> activeProjectId != null && activeProjectId.equals(project.getId()) ? 0 : 1)
                        .thenComparing(ProjectSpec::getName, Comparator.nullsLast(String::compareToIgnoreCase))
        );
        return ResponseEntity.ok(projects);
    }

    @Hidden
    @GetMapping(value = "/events/{operationId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter registerStoreEvents(@PathVariable("operationId") String operationId) {
        String key = "store:" + operationId;
        SseEmitter emitter = new SseEmitter(0L);
        emitterRegistry.register(key, emitter);
        sseStatusPublisher.connected(key, "store", Map.of("operationId", operationId));
        return emitter;
    }

    @Operation(summary = "Switch active project", 
               description = "Switches the active project to the project with the specified ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Project switched successfully"),
        @ApiResponse(responseCode = "500", description = "Failed to switch projects")
    })
    @PostMapping("/switch/{projectId}")
    public ResponseEntity<Void> switchProject(
            @Parameter(description = "ID of the project to switch to", required = true) 
            @PathVariable("projectId") UUID projectId) {
        ProjectSpec selectedProject = appContext.getProjects().stream()
                .filter(candidate -> projectId.equals(candidate.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Project with id %s not found".formatted(projectId)));
        appContext.setActiveProject(selectedProject);
        return ResponseEntity.ok().build();
    }

    private ProjectSpec ensureProjectIdentity(ProjectSpec projectSpec) {
        if (projectSpec == null) {
            return null;
        }
        if (projectSpec.getId() == null) {
            projectSpec.setId(deriveProjectId(projectSpec));
        }
        return projectSpec;
    }

    private UUID deriveProjectId(ProjectSpec projectSpec) {
        String source = Optional.ofNullable(projectSpec.getRepoDir())
                .map(Path::toString)
                .orElseGet(() -> Optional.ofNullable(projectSpec.getRepoUrl())
                        .orElseGet(() -> Optional.ofNullable(projectSpec.getName()).orElse(UUID.randomUUID().toString())));
        return UUID.nameUUIDFromBytes(source.getBytes(StandardCharsets.UTF_8));
    }

    private String normalizeOperationId(String operationId) {
        return StringUtils.hasText(operationId) ? operationId.trim() : null;
    }

    private String buildEmitterKey(String operationId) {
        return operationId != null ? "store:" + operationId : null;
    }

    private Map<String, Object> buildStoreEventDetails(CloneStoreRepoRequest request, String operationId) {
        Map<String, Object> details = new java.util.LinkedHashMap<>();
        if (operationId != null) {
            details.put("operationId", operationId);
        }
        details.put("phase", "clone");
        if (request.getRemoteUrl() != null) {
            details.put("remoteUrl", request.getRemoteUrl().toString());
        }
        if (request.getTargetDir() != null) {
            details.put("targetDir", request.getTargetDir().toString());
        }
        if (StringUtils.hasText(request.getName())) {
            details.put("projectName", request.getName().trim());
        }
        return Map.copyOf(details);
    }

    private URI requireCloneRemoteUrl(CloneStoreRepoRequest request) {
        if (request.getRemoteUrl() == null) {
            throw new IllegalArgumentException("remoteUrl must not be null");
        }
        return request.getRemoteUrl();
    }

    private Path requireCloneTargetDir(CloneStoreRepoRequest request) {
        if (request.getTargetDir() == null) {
            throw new IllegalArgumentException("targetDir must not be null");
        }
        return request.getTargetDir();
    }

    private Map<String, Object> buildCompletedStoreEventDetails(Map<String, Object> baseDetails, ProjectSpec projectSpec) {
        Map<String, Object> details = new java.util.LinkedHashMap<>(baseDetails);
        if (projectSpec.getId() != null) {
            details.put("projectId", projectSpec.getId().toString());
        }
        String projectName = StringUtils.hasText(projectSpec.getName()) ? projectSpec.getName().trim() : null;
        if (projectName != null) {
            details.put("projectName", projectName);
        }
        return Map.copyOf(details);
    }

    private Map<String, Object> buildFailedStoreEventDetails(Map<String, Object> baseDetails, Exception error) {
        Map<String, Object> details = new java.util.LinkedHashMap<>(baseDetails);
        details.put("error", error.getClass().getSimpleName());
        if (StringUtils.hasText(error.getMessage())) {
            details.put("reason", error.getMessage());
        }
        return Map.copyOf(details);
    }

    private ResponseStatusException mapCloneStoreStatus(RuntimeException exception) {
        if (exception instanceof IllegalArgumentException
                || exception instanceof IllegalStateException
                || exception instanceof UnsupportedOperationException) {
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage(), exception);
    }

}
