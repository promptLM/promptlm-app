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
import dev.promptlm.lifecycle.PromptLifecycleFacade;
import dev.promptlm.execution.PromptExecutor;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.ReleaseMetadata;
import dev.promptlm.domain.promptspec.Request;
import dev.promptlm.lifecycle.application.PromptSpecAlreadyExistsException;
import dev.promptlm.store.api.PromptStore;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.revwalk.RevCommit;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/prompts")
@Tag(name = "Prompt Specifications", description = "API for managing prompt specifications")
@Validated
public class PromptSpecController {

    private static final String PROMPTS_DIRECTORY = "prompts";
    private static final String RELEASE_STATE_HEADER = "X-PromptLM-Release-State";

    private final PromptStore promptStore;
    private final PromptExecutor promptExecutor;
    private final PromptLifecycleFacade promptLifecycleFacade;
    private final AppContext appContext;

    public PromptSpecController(PromptStore promptStore,
                                PromptExecutor promptExecutor,
                                PromptLifecycleFacade promptLifecycleFacade,
                                AppContext appContext) {
        this.promptStore = promptStore;
        this.promptExecutor = promptExecutor;
        this.promptLifecycleFacade = promptLifecycleFacade;
        this.appContext = appContext;
    }

    /**
     * Get the PromptSpec with given id.
     */
    @Operation(summary = "Get prompt specification by ID", 
               description = "Retrieves the latest version of a prompt specification by its unique identifier")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prompt specification found",
                    content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = PromptSpec.class))),
        @ApiResponse(responseCode = "404", description = "Prompt specification not found")
    })
    @GetMapping(path = "/{promptSpecId}")
    public ResponseEntity<PromptSpec> getById(
            @Parameter(description = "Unique identifier of the prompt specification") 
            @PathVariable(name = "promptSpecId") String promptSpecId) {
        Optional<PromptSpec> latestVersion = promptStore.getLatestVersion(promptSpecId);
        return ResponseEntity.of(latestVersion);
    }

    /**
     * List all prompts with options for filtering and sorting.
     * @return List of prompt specifications matching the criteria
     */
    @Operation(summary = "List all prompt specifications", 
               description = "Returns a list of prompt specifications")
    @ApiResponse(responseCode = "200", description = "List of prompt specifications",
                content = @Content(mediaType = "application/json",
                        array = @ArraySchema(schema = @Schema(implementation = PromptSpec.class))))
    @GetMapping
    public ResponseEntity<List<PromptSpec>> listPromptSpecs() {
        List<PromptSpec> prompts = promptStore.listAllPrompts();
        return ResponseEntity.ok(prompts);
    }
    
    /**
     * Create a new {@link PromptSpec}.
     */
    @Operation(summary = "Create a new prompt specification", 
               description = "Creates a new prompt specification with the provided details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prompt specification created successfully",
                    content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = PromptSpec.class))),
        @ApiResponse(responseCode = "404", description = "Failed to create prompt specification")
    })
    @PostMapping
    public ResponseEntity<PromptSpec> createPromptSpec(
            @Parameter(description = "Prompt specification creation request details", required = true) 
            @Valid @RequestBody PromptSpecCreationRequest request) {
        if (!StringUtils.hasText(request.getGroup()) || !StringUtils.hasText(request.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and group must not be blank");
        }
        PromptSpec promptSpec = toPromptSpec(request);

        try {
            PromptSpec created = promptLifecycleFacade.createPromptSpec(promptSpec);
            return ResponseEntity.ok(created);
        } catch (PromptSpecAlreadyExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
        }
    }

    /**
     * Update the given PromptSpec
     */
    @Operation(summary = "Update an existing prompt specification", 
               description = "Updates an existing prompt specification with the provided details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prompt specification updated successfully",
                    content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = PromptSpec.class))),
        @ApiResponse(responseCode = "404", description = "Prompt specification not found")
    })
    @PutMapping("/{promptSpecId}")
    public ResponseEntity<PromptSpec> updatePromptSpec(
            @Parameter(description = "ID of the prompt specification to update") 
            @PathVariable("promptSpecId") String promptSpecId,
            @Parameter(description = "Updated prompt specification details", required = true) 
            @Valid @RequestBody PromptSpecCreationRequest request) {
        if (!StringUtils.hasText(request.getGroup()) || !StringUtils.hasText(request.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and group must not be blank");
        }
        PromptSpec promptSpec = toPromptSpec(request);
        
        // Validate that the ID in the path matches the ID in the request body
        if (promptSpec.getId() != null && !promptSpecId.equals(promptSpec.getId())) {
            throw new IllegalArgumentException("Prompt ID in URL path does not match the ID in the request body");
        }
        
        PromptSpec spec = promptLifecycleFacade.updatePrompt(promptSpecId, promptSpec);
        return ResponseEntity.ok(spec);
    }

    @Operation(
        summary = "Get default prompt template",
        description = "Returns a new prompt specification with default values")
        @ApiResponse(
                responseCode = "200",
                description = "Default prompt template",
                content = @Content(
                        mediaType = MediaType.APPLICATION_JSON_VALUE,
                        schema = @Schema(implementation = PromptSpec.class)
                )
        )
    @GetMapping("/template")
    public ResponseEntity<PromptSpec> getDefaultTemplate() {
        PromptSpec template = promptLifecycleFacade.createDefaultPromptSpec();
        return ResponseEntity.ok(template);
    }

    private PromptSpec toPromptSpec(PromptSpecCreationRequest creationRequest) {
        Map<String, Object> parametersMap = new HashMap<>();
        PromptSpecCreationRequest.Request requestPayload = creationRequest.getRequest();
        if (requestPayload != null && requestPayload.getParameters() != null) {
            PromptSpecCreationRequest.Parameters params = requestPayload.getParameters();
            if (params.getTemperature() != null) parametersMap.put("temperature", params.getTemperature());
            if (params.getTopP() != null) parametersMap.put("topP", params.getTopP());
            if (params.getMaxTokens() != null) parametersMap.put("maxTokens", params.getMaxTokens());
            if (params.getFrequencyPenalty() != null) parametersMap.put("frequencyPenalty", params.getFrequencyPenalty());
            if (params.getPresencePenalty() != null) parametersMap.put("presencePenalty", params.getPresencePenalty());
            if (params.getStream() != null) parametersMap.put("stream", params.getStream());
        }

        String vendor = requestPayload != null ? requestPayload.getVendor() : null;
        if (!StringUtils.hasText(vendor) && creationRequest.getVendorAndModel() != null) {
            vendor = creationRequest.getVendorAndModel().getVendorName();
        }

        String model = requestPayload != null ? requestPayload.getModel() : null;
        if (!StringUtils.hasText(model) && creationRequest.getVendorAndModel() != null) {
            model = creationRequest.getVendorAndModel().getModel();
        }

        String url = requestPayload != null ? requestPayload.getUrl() : null;
        if (!StringUtils.hasText(url) && creationRequest.getVendorAndModel() != null) {
            url = creationRequest.getVendorAndModel().getEndpoint();
        }

        String type = requestPayload != null ? requestPayload.getType() : null;
        if (!StringUtils.hasText(type)) {
            type = ChatCompletionRequest.TYPE;
        }

        String modelSnapshot = requestPayload != null ? requestPayload.getModelSnapshot() : null;

        List<Message> messages = creationRequest.getMessages();
        if ((messages == null || messages.isEmpty()) && requestPayload != null) {
            messages = requestPayload.getMessages();
        }

        Request request = ChatCompletionRequest.builder()
                .withModel(model)
                .withVendor(vendor)
                .withUrl(url)
                .withType(type)
                .withModelSnapshot(modelSnapshot)
                .withMessages(map(messages))
                .withParameters(parametersMap)
                .build();

        String version = StringUtils.hasText(creationRequest.getVersion())
                ? creationRequest.getVersion()
                : "1-SNAPSHOT";

        PromptSpec promptSpec = PromptSpec.builder()
                .withGroup(creationRequest.getGroup())
                .withName(creationRequest.getName())
                .withVersion(version)
                .withRevision(1)
                .withDescription(creationRequest.getDescription())
                .withRequest(request)
                .withRepositoryUrl(creationRequest.getGitHubRepo())
                .withPlaceholders(toPlaceholders(creationRequest))
                .withExtensions(creationRequest.getExtensions())
                .build();
        
        // Set the ID after building if provided
        if (creationRequest.getId() != null) {
            promptSpec = promptSpec.withId(creationRequest.getId());
        }
        
        return promptSpec;
    }

    private List<ChatCompletionRequest.Message> map(List<Message> messages) {
        if (messages == null) {
            return List.of();
        }
        return messages.stream()
                .map(m -> ChatCompletionRequest.Message.builder()
                        .withContent(m.getContent())
                        .withRole(m.getRole().name().toLowerCase())
                        .withName(m.getName())
                        .build())
                .toList();
    }

    private PromptSpec.Placeholders toPlaceholders(PromptSpecCreationRequest request) {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern(StringUtils.hasText(request.getPlaceholderStartPattern()) ? request.getPlaceholderStartPattern() : "{{");
        placeholders.setEndPattern(StringUtils.hasText(request.getPlaceholderEndPattern()) ? request.getPlaceholderEndPattern() : "}}");

        Map<String, String> defaults = request.getPlaceholder() != null ? request.getPlaceholder() : Map.of();
        List<PromptSpec.Placeholder> list = defaults.entrySet().stream()
                .map(entry -> new PromptSpec.Placeholder(entry.getKey(), entry.getValue()))
                .toList();
        placeholders.setList(list);
        return placeholders;
    }

    /**
     * Retire a prompt specification by marking it as RETIRED.
     * This preserves the prompt in the store but indicates it should not be used for new applications.
     * 
     * @param promptSpecId The ID of the prompt to retire
     * @param reason Optional reason for retirement
     * @return The updated prompt specification with RETIRED status
     */
    @Operation(summary = "Retire a prompt specification", 
               description = "Marks a prompt specification as retired with an optional retirement reason")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prompt specification retired successfully",
                    content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = PromptSpec.class))),
        @ApiResponse(responseCode = "404", description = "Prompt specification not found")
    })
    @PutMapping("/{promptSpecId}/retire")
    public ResponseEntity<PromptSpec> retirePrompt(
            @Parameter(description = "ID of the prompt specification to retire") 
            @PathVariable("promptSpecId") String promptSpecId,
            
            @Parameter(description = "Optional reason for retiring this prompt specification") 
            @RequestParam(value = "reason", required = false) String reason) {
        
        // Get the latest version of the prompt
        Optional<PromptSpec> promptOpt = promptStore.getLatestVersion(promptSpecId);
        if (promptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // Mark the prompt as retired
        PromptSpec prompt = promptOpt.get();
        PromptSpec retiredPrompt = prompt
                .withStatus(PromptSpec.PromptStatus.RETIRED)
                .withRetiredAt(LocalDateTime.now())
                .withRetiredReason(reason);
        
        // Update the prompt in the store
        promptStore.updatePrompt(promptSpecId, retiredPrompt);
        
        // Return the updated prompt
        return promptStore.getLatestVersion(promptSpecId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get statistics about prompts in the store
     * 
     * @return PromptStats object with counts and distributions
     */
    @Operation(summary = "Get prompt statistics", 
               description = "Returns statistics about prompts in the store including counts and distributions")
    @ApiResponse(responseCode = "200", description = "Prompt statistics retrieved successfully",
                content = @Content(mediaType = "application/json", 
                                  schema = @Schema(implementation = PromptStats.class)))
    @GetMapping("/stats")
    public PromptStats getPromptStats() {
        // Get all prompts including retired ones
        List<PromptSpec> allPrompts = promptStore.listAllPrompts(true);

        // Count active and retired prompts
        long activeCount = allPrompts.stream()
                .filter(p -> p.getStatus() == null || p.getStatus() == PromptSpec.PromptStatus.ACTIVE)
                .count();
        
        long retiredCount = allPrompts.stream()
                .filter(p -> p.getStatus() == PromptSpec.PromptStatus.RETIRED)
                .count();
        
        // Count prompts by group
        Map<String, Long> countByGroup = allPrompts.stream()
                .filter(p -> p.getGroup() != null && !p.getGroup().isEmpty())
                .collect(Collectors.groupingBy(PromptSpec::getGroup, Collectors.counting()));

        ProjectSpec activeProject = AppContext.requireActiveProject(appContext);
        int activeProjects = appContext.getProjects().size();
        Instant lastUpdated = resolveActiveProjectLastUpdatedFromGitMetadata(activeProject);

        return new PromptStats(
                allPrompts.size(),
                activeCount,
                retiredCount,
                countByGroup,
                activeProjects,
                lastUpdated
        );
    }
    
    /**
     * Get all available prompt groups for filtering
     * 
     * @param includeRetired Whether to include groups that only contain retired prompts
     * @return List of unique group names
     */
    @Operation(summary = "Get all prompt groups", 
               description = "Returns a list of all unique prompt group names")
    @ApiResponse(responseCode = "200", description = "List of prompt groups",
                content = @Content(mediaType = "application/json", 
                                  schema = @Schema(type = "array", implementation = String.class)))
    @GetMapping("/groups")
    public List<String> getPromptGroups(
            @Parameter(description = "Include groups that only contain retired prompts") 
            @RequestParam(value = "includeRetired", required = false, defaultValue = "false") boolean includeRetired) {
        List<PromptSpec> prompts = promptStore.listAllPrompts(includeRetired);

        // Extract unique groups
        return prompts.stream()
                .map(PromptSpec::getGroup)
                .filter(group -> group != null && !group.isEmpty())
                .distinct()
                .sorted()
                .toList();
    }
    
    /**
     * Create a new release for a prompt specification.
     * This will create a new version of the prompt with an incremented version number.
     *
     * @param promptSpecId The ID of the prompt to release.
     * @return The release operation response payload.
     */
    @Operation(
            summary = "Release a new version of a prompt",
            description = "Requests release for a prompt specification. In direct mode the response state is released. In pr_two_phase mode the response state is requested until /release/complete is called.",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Release operation response as prompt specification. Header X-PromptLM-Release-State mirrors extensions.x-promptlm.release.state (requested|released).",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PromptSpec.class))
                    ),
                    @ApiResponse(
                            responseCode = "404",
                            description = "Prompt specification with the given ID not found."
                    )
            }
    )
    @PostMapping("/{promptSpecId}/release")
    public ResponseEntity<PromptSpec> releasePrompt(
            @Parameter(description = "The unique identifier of the prompt specification to release.")
            @PathVariable("promptSpecId") String promptSpecId) {
        Optional<PromptSpec> latestVersion = promptStore.getLatestVersion(promptSpecId);
        if (latestVersion.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PromptSpec releaseResponse = promptLifecycleFacade.release(promptSpecId);
        return releaseResponse(releaseResponse);
    }

    @Hidden
    @PostMapping("/{group}/{name}/release")
    public ResponseEntity<PromptSpec> releasePromptByGroupAndName(
            @PathVariable("group") String group,
            @PathVariable("name") String name) {
        return releasePrompt(group + "/" + name);
    }

    @Operation(
            summary = "Complete a pending prompt release",
            description = "Finalizes a previously requested PR-mode release after validating the referenced pull request has been merged into main. Header X-PromptLM-Release-State is released on success.",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Completed release response.",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PromptSpec.class))
                    ),
                    @ApiResponse(
                            responseCode = "404",
                            description = "Prompt specification with the given ID not found."
                    )
            }
    )
    @PostMapping("/{promptSpecId}/release/complete")
    public ResponseEntity<PromptSpec> completeReleasePrompt(
            @Parameter(description = "The unique identifier of the prompt specification to complete.")
            @PathVariable("promptSpecId") String promptSpecId,
            @Parameter(description = "Pull request number or URL for the pending release request.")
            @RequestParam("pr") String pullRequestReference) {
        Optional<PromptSpec> latestVersion = promptStore.getLatestVersion(promptSpecId);
        if (latestVersion.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PromptSpec releaseResponse = promptLifecycleFacade.completeRelease(promptSpecId, pullRequestReference);
        return releaseResponse(releaseResponse);
    }

    @Hidden
    @PostMapping("/{group}/{name}/release/complete")
    public ResponseEntity<PromptSpec> completeReleasePromptByGroupAndName(
            @PathVariable("group") String group,
            @PathVariable("name") String name,
            @RequestParam("pr") String pullRequestReference) {
        return completeReleasePrompt(group + "/" + name, pullRequestReference);
    }

    /**
     * Execute a prompt specification and return the result with the LLM response
     * 
     * @param request The execute prompt request containing the prompt specification to execute
     * @return The executed prompt specification with the response from the LLM
     */
    @Operation(summary = "Execute a prompt specification",
               description = "Executes the given prompt specification with the configured LLM and returns the result")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prompt executed successfully",
                    content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = PromptSpec.class))),
        @ApiResponse(responseCode = "400", description = "Invalid prompt specification"),
        @ApiResponse(responseCode = "500", description = "Error executing the prompt")
    })
    @PostMapping("/execute")
    public ResponseEntity<?> executePrompt(
            @Parameter(description = "Prompt specification to execute", required = true)
            @Valid @RequestBody ExecutePromptRequest request) {
        if (request.getPromptSpec() == null) {
            return ResponseEntity.badRequest().build();
        }
        PromptSpec promptSpec = request.getPromptSpec();
        try {
            PromptSpec executedSpec = promptExecutor.runPromptAndAttachResponse(promptSpec);
            return ResponseEntity.ok(executedSpec);
        } catch (RuntimeException exception) {
            throw mapPromptExecutionException(promptSpec.getId(), exception);
        }
    }

    /**
     * Execute a persisted prompt specification by ID and return the result with the LLM response.
     * This endpoint loads the stored prompt, executes it, and returns the executed spec with its persisted ID.
     *
     * @param promptSpecId The ID of the prompt specification to execute
     * @return The executed prompt specification with the response from the LLM
     */
    @Operation(summary = "Execute a stored prompt specification",
               description = "Loads the stored prompt specification by ID, executes it, and returns the result")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prompt executed successfully",
                    content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = PromptSpec.class))),
        @ApiResponse(responseCode = "404", description = "Prompt specification not found"),
        @ApiResponse(responseCode = "500", description = "Error executing the prompt")
    })
    @PostMapping("/{promptSpecId}/execute")
    public ResponseEntity<?> executeStoredPrompt(
            @Parameter(description = "ID of the prompt specification to execute", required = true)
            @PathVariable("promptSpecId") String promptSpecId,
            @Parameter(description = "Prompt specification to execute", required = true)
            @Valid @RequestBody(required = false) ExecutePromptRequest request) {
        Optional<PromptSpec> latestStoredSpec = promptStore.getLatestVersion(promptSpecId);
        if (latestStoredSpec.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (request != null && request.getPromptSpec() != null) {
            PromptSpec requestPromptSpec = request.getPromptSpec();
            if (requestPromptSpec.getId() != null && !promptSpecId.equals(requestPromptSpec.getId())) {
                return ResponseEntity.badRequest().build();
            }
        }

        PromptSpec promptSpecToExecute = latestStoredSpec.get();
        if (promptSpecToExecute.getId() == null || promptSpecToExecute.getId().isBlank()) {
            promptSpecToExecute = promptSpecToExecute.withId(promptSpecId);
        }
        try {
            PromptSpec executedSpec = promptExecutor.runPromptAndAttachResponse(promptSpecToExecute);
            PromptSpec persistedUpdate = latestStoredSpec.get().withResponse(executedSpec.getResponse());
            promptLifecycleFacade.updatePrompt(promptSpecId, persistedUpdate);
            return ResponseEntity.ok(executedSpec);
        } catch (RuntimeException exception) {
            throw mapPromptExecutionException(promptSpecId, exception);
        }
    }

    private Instant resolveActiveProjectLastUpdatedFromGitMetadata(ProjectSpec activeProject) {
        Path normalizedRepoDir = activeProject.getRepoDir().toAbsolutePath().normalize();

        try (org.eclipse.jgit.api.Git git = org.eclipse.jgit.api.Git.open(normalizedRepoDir.toFile())) {
            Iterable<RevCommit> promptCommits = git.log()
                    .addPath(PROMPTS_DIRECTORY)
                    .setMaxCount(1)
                    .call();

            java.util.Iterator<RevCommit> commits = promptCommits.iterator();
            if (commits.hasNext()) {
                return instantFromCommit(commits.next());
            }
            throw new IllegalStateException(
                    "No git commit found for prompts directory in active project repository: " + normalizedRepoDir);
        } catch (NoHeadException e) {
            throw new IllegalStateException("Active project repository has no commits: " + normalizedRepoDir, e);
        } catch (IOException | GitAPIException e) {
            throw new IllegalStateException("Failed to resolve active-project git metadata: " + normalizedRepoDir, e);
        }
    }

    private ResponseEntity<PromptSpec> releaseResponse(PromptSpec releaseResponse) {
        ReleaseMetadata releaseMetadata = releaseResponse.getReleaseMetadata();
        if (releaseMetadata == null || !StringUtils.hasText(releaseMetadata.state())) {
            throw new IllegalStateException("Release response is missing required release metadata state");
        }
        return ResponseEntity.ok()
                .header(RELEASE_STATE_HEADER, releaseMetadata.state())
                .body(releaseResponse);
    }

    private Instant instantFromCommit(RevCommit commit) {
        return Instant.ofEpochSecond(commit.getCommitTime());
    }

    private PromptExecutionException mapPromptExecutionException(String promptId, RuntimeException exception) {
        if (exception instanceof IllegalArgumentException
                || exception instanceof IllegalStateException
                || exception instanceof UnsupportedOperationException) {
            return PromptExecutionException.badRequest(promptId, exception);
        }
        return PromptExecutionException.internalServerError(promptId, exception);
    }

}
