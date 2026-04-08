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

import dev.promptlm.lifecycle.application.PromptSpecAlreadyExistsException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.PromptEvaluationDefinition;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.lifecycle.PromptLifecycleFacade;
import dev.promptlm.execution.PromptExecutor;
import dev.promptlm.store.api.PromptStore;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.PersonIdent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TimeZone;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PromptSpecController.class)
class PromptSpecControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PromptStore promptStore;

    @MockitoBean
    private PromptExecutor promptExecutor;

    @MockitoBean
    private PromptLifecycleFacade promptLifecycleFacade;

    @MockitoBean
    private AppContext appContext;

    @Test
    void getDefaultTemplateReturnsCanonicalDraftSeed() throws Exception {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern("{{");
        placeholders.setEndPattern("}}");
        placeholders.setList(List.of(new PromptSpec.Placeholder("customer_name", "Taylor")));

        PromptSpec template = PromptSpec.builder()
                .withGroup("support")
                .withName("support-prompt")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("Assist support agents")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of(
                                ChatCompletionRequest.Message.builder()
                                        .withRole("system")
                                        .withContent("You are a helpful assistant.")
                                        .build(),
                                ChatCompletionRequest.Message.builder()
                                        .withRole("user")
                                        .withContent("Help the customer.")
                                        .build()))
                        .build())
                .withPlaceholders(placeholders)
                .build();
        when(promptLifecycleFacade.createDefaultPromptSpec()).thenReturn(template);

        mockMvc.perform(get("/api/prompts/template"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("support-prompt"))
                .andExpect(jsonPath("$.group").value("support"))
                .andExpect(jsonPath("$.description").value("Assist support agents"))
                .andExpect(jsonPath("$.request.vendor").value("openai"))
                .andExpect(jsonPath("$.request.model").value("gpt-4o"))
                .andExpect(jsonPath("$.request.messages[0].role").value("system"))
                .andExpect(jsonPath("$.request.messages[0].content").value("You are a helpful assistant."))
                .andExpect(jsonPath("$.request.messages[1].role").value("user"))
                .andExpect(jsonPath("$.request.messages[1].content").value("Help the customer."))
                .andExpect(jsonPath("$.placeholders.startPattern").value("{{"))
                .andExpect(jsonPath("$.placeholders.endPattern").value("}}"))
                .andExpect(jsonPath("$.placeholders.list[0].name").value("customer_name"))
                .andExpect(jsonPath("$.placeholders.list[0].value").value("Taylor"));
    }

    @Test
    void listPromptsShouldNotFailWhenGroupIsNullAndSortingByGroup() throws Exception {
        PromptSpec promptWithNullGroup = PromptSpec.builder()
                .withName("prompt-a")
                .withVersion("0.1.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(null)
                .build();

        when(promptStore.listAllPrompts()).thenReturn(List.of(promptWithNullGroup));

        mockMvc.perform(get("/api/prompts").queryParam("sortBy", "group"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void getPromptStatsDerivesProjectCountAndLastUpdatedFromGitMetadata(@TempDir Path tempDir) throws Exception {
        Instant commitInstant = Instant.parse("2026-01-02T03:04:05Z");
        Path repository = initializeRepositoryWithPromptCommit(tempDir, commitInstant);

        ProjectSpec activeProject = new ProjectSpec();
        activeProject.setId(UUID.randomUUID());
        activeProject.setRepoDir(repository);

        PromptSpec activePrompt = PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("active prompt")
                .withRequest(null)
                .build();

        PromptSpec retiredPrompt = PromptSpec.builder()
                .withGroup("legacy")
                .withName("old-welcome")
                .withVersion("0.9.0")
                .withRevision(1)
                .withDescription("retired prompt")
                .withRequest(null)
                .withStatus(PromptSpec.PromptStatus.RETIRED)
                .build();

        when(promptStore.listAllPrompts(true)).thenReturn(List.of(activePrompt, retiredPrompt));
        when(appContext.getActiveProject()).thenReturn(activeProject);
        when(appContext.getProjects()).thenReturn(List.of(activeProject));

        mockMvc.perform(get("/api/prompts/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalPrompts").value(2))
                .andExpect(jsonPath("$.activePrompts").value(1))
                .andExpect(jsonPath("$.retiredPrompts").value(1))
                .andExpect(jsonPath("$.activeProjects").value(1))
                .andExpect(jsonPath("$.countByGroup.support").value(1))
                .andExpect(jsonPath("$.countByGroup.legacy").value(1))
                .andExpect(jsonPath("$.lastUpdated").value("2026-01-02T03:04:05Z"));
    }

    @Test
    void getPromptGroupsHonorsIncludeRetiredFlag() throws Exception {
        PromptSpec activePrompt = PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("active prompt")
                .withRequest(null)
                .build();

        PromptSpec retiredPrompt = PromptSpec.builder()
                .withGroup("legacy")
                .withName("old-welcome")
                .withVersion("0.9.0")
                .withRevision(1)
                .withDescription("retired prompt")
                .withRequest(null)
                .withStatus(PromptSpec.PromptStatus.RETIRED)
                .build();

        when(promptStore.listAllPrompts(false)).thenReturn(List.of(activePrompt));
        when(promptStore.listAllPrompts(true)).thenReturn(List.of(activePrompt, retiredPrompt));

        mockMvc.perform(get("/api/prompts/groups"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0]").value("support"))
                .andExpect(jsonPath("$[1]").doesNotExist());

        mockMvc.perform(get("/api/prompts/groups").queryParam("includeRetired", "true"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0]").value("legacy"))
                .andExpect(jsonPath("$[1]").value("support"));
    }

    @Test
    void getPromptStatsFailsWhenActiveProjectRepoPathDoesNotExist() throws Exception {
        PromptSpec activePrompt = PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("active prompt")
                .withRequest(null)
                .build();

        ProjectSpec activeProject = new ProjectSpec();
        activeProject.setId(UUID.randomUUID());
        activeProject.setRepoDir(Path.of("/tmp/does-not-exist-for-stats"));

        when(promptStore.listAllPrompts(true)).thenReturn(List.of(activePrompt));
        when(appContext.getActiveProject()).thenReturn(activeProject);
        when(appContext.getProjects()).thenReturn(List.of(activeProject));

        assertThatThrownBy(() -> mockMvc.perform(get("/api/prompts/stats")))
                .hasCauseInstanceOf(IllegalStateException.class)
                .hasStackTraceContaining("Failed to resolve active-project git metadata");
    }

    @Test
    void executeStoredPromptPersistsCapturedResponse() throws Exception {
        String promptId = "prompt-a";

        ChatCompletionRequest requestPayload = ChatCompletionRequest.builder()
                .withVendor("openai")
                .withModel("gpt-4o")
                .withMessages(List.of(
                        ChatCompletionRequest.Message.builder()
                                .withRole("user")
                                .withContent("Ping")
                                .build()
                ))
                .withParameters(Map.of())
                .build();

        PromptSpec storedPrompt = PromptSpec.builder()
                .withGroup("support")
                .withName("prompt-a")
                .withVersion("1.0.0")
                .withRevision(3)
                .withDescription("desc")
                .withRequest(requestPayload)
                .build()
                .withId(promptId);

        PromptSpec requestBodyPrompt = PromptSpec.builder()
                .withGroup("malicious")
                .withName("override")
                .withVersion("9.9.9")
                .withRevision(999)
                .withDescription("request body should not be executed")
                .withRequest(requestPayload)
                .build()
                .withId(promptId);

        PromptSpec executedPrompt = storedPrompt.withResponse(new ChatCompletionResponse(10L, null, "Pong"));
        PromptSpec persistedPrompt = storedPrompt.withResponse(executedPrompt.getResponse());

        when(promptExecutor.runPromptAndAttachResponse(any(PromptSpec.class))).thenReturn(executedPrompt);
        when(promptStore.getLatestVersion(promptId)).thenReturn(Optional.of(storedPrompt));
        when(promptLifecycleFacade.updatePrompt(eq(promptId), any(PromptSpec.class))).thenReturn(persistedPrompt);

        ExecutePromptRequest executePromptRequest = new ExecutePromptRequest(requestBodyPrompt);

        mockMvc.perform(post("/api/prompts/{promptSpecId}/execute", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(executePromptRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.response.content").value("Pong"));

        ArgumentCaptor<PromptSpec> executedPromptCaptor = ArgumentCaptor.forClass(PromptSpec.class);
        verify(promptExecutor).runPromptAndAttachResponse(executedPromptCaptor.capture());
        assertThat(executedPromptCaptor.getValue().getGroup()).isEqualTo("support");
        assertThat(executedPromptCaptor.getValue().getName()).isEqualTo("prompt-a");
        assertThat(executedPromptCaptor.getValue().getVersion()).isEqualTo("1.0.0");
        assertThat(executedPromptCaptor.getValue().getRevision()).isEqualTo(3);

        ArgumentCaptor<PromptSpec> updatedPromptCaptor = ArgumentCaptor.forClass(PromptSpec.class);
        verify(promptLifecycleFacade).updatePrompt(eq(promptId), updatedPromptCaptor.capture());
        assertThat(((ChatCompletionResponse) updatedPromptCaptor.getValue().getResponse()).getContent())
                .isEqualTo("Pong");
        assertThat(updatedPromptCaptor.getValue().getGroup()).isEqualTo("support");
        assertThat(updatedPromptCaptor.getValue().getName()).isEqualTo("prompt-a");
        assertThat(updatedPromptCaptor.getValue().getVersion()).isEqualTo("1.0.0");
        assertThat(updatedPromptCaptor.getValue().getRevision()).isEqualTo(3);
    }

    @Test
    void executePromptReturnsBadRequestForRecoverableExecutionErrors() throws Exception {
        ChatCompletionRequest requestPayload = ChatCompletionRequest.builder()
                .withVendor("openai")
                .withModel("gpt-4o")
                .withMessages(List.of(
                        ChatCompletionRequest.Message.builder()
                                .withRole("user")
                                .withContent("Ping")
                                .build()
                ))
                .withParameters(Map.of())
                .build();

        PromptSpec prompt = PromptSpec.builder()
                .withGroup("support")
                .withName("prompt-a")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(requestPayload)
                .build()
                .withId("prompt-a");

        when(promptExecutor.runPromptAndAttachResponse(any(PromptSpec.class)))
                .thenThrow(new IllegalStateException("No Prompt gateway available for vendor 'openai' and model 'gpt-4o'"));

        ExecutePromptRequest executePromptRequest = new ExecutePromptRequest(prompt);

        mockMvc.perform(post("/api/prompts/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(executePromptRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value(containsString("No Prompt gateway available")));
    }

    @Test
    void executePromptReturnsInternalServerErrorForUnexpectedExecutionErrors() throws Exception {
        ChatCompletionRequest requestPayload = ChatCompletionRequest.builder()
                .withVendor("openai")
                .withModel("gpt-4o")
                .withMessages(List.of(
                        ChatCompletionRequest.Message.builder()
                                .withRole("user")
                                .withContent("Ping")
                                .build()
                ))
                .withParameters(Map.of())
                .build();

        PromptSpec prompt = PromptSpec.builder()
                .withGroup("support")
                .withName("prompt-a")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(requestPayload)
                .build()
                .withId("prompt-a");

        when(promptExecutor.runPromptAndAttachResponse(any(PromptSpec.class)))
                .thenThrow(new RuntimeException("Unexpected execution failure"));

        ExecutePromptRequest executePromptRequest = new ExecutePromptRequest(prompt);

        mockMvc.perform(post("/api/prompts/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(executePromptRequest)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value(containsString("Unexpected execution failure")));
    }

    @Test
    void updatePromptSpecMapsEvaluationExtensions() throws Exception {
        String promptId = "prompt-123";

        PromptSpecCreationRequest request = new PromptSpecCreationRequest();
        request.setId(promptId);
        request.setName("Prompt");
        request.setGroup("group");
        request.setDescription("desc");
        request.setMessages(List.of());

        VendorAndModel vendorAndModel = new VendorAndModel();
        vendorAndModel.setVendorName("openai");
        vendorAndModel.setModel("gpt-4");
        request.setVendorAndModel(vendorAndModel);

        PromptSpecCreationRequest.Request apiRequest = new PromptSpecCreationRequest.Request();
        apiRequest.setMessages(List.of());
        apiRequest.setParameters(new PromptSpecCreationRequest.Parameters());
        request.setRequest(apiRequest);

        ObjectNode evaluationNode = objectMapper.createObjectNode();
        ObjectNode definitionNode = objectMapper.createObjectNode();
        definitionNode.put("evaluator", "semantic-match");
        definitionNode.put("type", "rubric");
        definitionNode.put("description", "score relevance");
        evaluationNode.set("spec", objectMapper.createObjectNode()
                .set("evaluations", objectMapper.createArrayNode().add(definitionNode)));
        request.setExtensions(Map.of("x-evaluation", evaluationNode));

        when(promptLifecycleFacade.updatePrompt(eq(promptId), any(PromptSpec.class)))
                .thenAnswer(invocation -> invocation.getArgument(1));

        mockMvc.perform(put("/api/prompts/{promptSpecId}", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));

        ArgumentCaptor<PromptSpec> promptCaptor = ArgumentCaptor.forClass(PromptSpec.class);
        verify(promptLifecycleFacade).updatePrompt(eq(promptId), promptCaptor.capture());

        PromptSpec updated = promptCaptor.getValue();
        assertThat(updated.getEvaluationSpec()).isNotNull();
        assertThat(updated.getEvaluationSpec().getEvaluations()).hasSize(1);
        assertThat(updated.getEvaluationSpec().getEvaluations().get(0))
                .isInstanceOf(PromptEvaluationDefinition.class);

        PromptEvaluationDefinition evaluation =
                (PromptEvaluationDefinition) updated.getEvaluationSpec().getEvaluations().get(0);
        assertThat(evaluation.getEvaluator()).isEqualTo("semantic-match");
        assertThat(evaluation.getType()).isEqualTo("rubric");
        assertThat(evaluation.getDescription()).isEqualTo("score relevance");
    }

    @Test
    void createPromptSpecIncludesUiFields() throws Exception {
        PromptSpecCreationRequest request = new PromptSpecCreationRequest();
        request.setName("new-prompt");
        request.setGroup("support");
        request.setDescription("new description");
        request.setVersion("1.2.3");
        request.setPlaceholderStartPattern("<<");
        request.setPlaceholderEndPattern(">>");
        request.setPlaceholder(Map.of("customer", "Alice"));
        request.setGitHubRepo("https://github.com/org/repo");

        VendorAndModel vendorAndModel = new VendorAndModel();
        vendorAndModel.setVendorName("openai");
        vendorAndModel.setModel("gpt-4o");
        vendorAndModel.setEndpoint("https://api.example.com/v1");
        request.setVendorAndModel(vendorAndModel);

        PromptSpecCreationRequest.Parameters params = new PromptSpecCreationRequest.Parameters();
        params.setTemperature(0.7);
        params.setMaxTokens(250);

        PromptSpecCreationRequest.Request requestPayload = new PromptSpecCreationRequest.Request();
        requestPayload.setType("chat/completion");
        requestPayload.setVendor("openai");
        requestPayload.setModel("gpt-4o");
        requestPayload.setUrl("https://override.example.com/v1");
        requestPayload.setModelSnapshot("2024-05-01");
        requestPayload.setParameters(params);

        Message message = new Message();
        message.setRole(Message.Role.USER);
        message.setContent("Hello");
        request.setMessages(List.of(message));
        requestPayload.setMessages(List.of(message));
        request.setRequest(requestPayload);

        when(promptLifecycleFacade.createPromptSpec(any(PromptSpec.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));

        ArgumentCaptor<PromptSpec> promptCaptor = ArgumentCaptor.forClass(PromptSpec.class);
        verify(promptLifecycleFacade).createPromptSpec(promptCaptor.capture());

        PromptSpec created = promptCaptor.getValue();
        assertThat(created.getDescription()).isEqualTo("new description");
        assertThat(created.getVersion()).isEqualTo("1.2.3");
        assertThat(created.getRepositoryUrl()).isEqualTo("https://github.com/org/repo");
        assertThat(created.getPlaceholders().getStartPattern()).isEqualTo("<<");
        assertThat(created.getPlaceholders().getEndPattern()).isEqualTo(">>");
        assertThat(created.getPlaceholders().getList())
                .extracting(PromptSpec.Placeholder::getName, PromptSpec.Placeholder::getValue)
                .containsExactly(tuple("customer", "Alice"));

        ChatCompletionRequest createdRequest = (ChatCompletionRequest) created.getRequest();
        assertThat(createdRequest.getVendor()).isEqualTo("openai");
        assertThat(createdRequest.getModel()).isEqualTo("gpt-4o");
        assertThat(createdRequest.getUrl()).isEqualTo("https://override.example.com/v1");
        assertThat(createdRequest.getType()).isEqualTo("chat/completion");
        assertThat(createdRequest.getModelSnapshot()).isEqualTo("2024-05-01");
        assertThat(createdRequest.getParameters()).containsEntry("temperature", 0.7);
        assertThat(createdRequest.getParameters()).containsEntry("maxTokens", 250);
        assertThat(createdRequest.getMessages())
                .extracting(ChatCompletionRequest.Message::getContent)
                .containsExactly("Hello");
    }

    /**
     * Ensures prompt creation is case-insensitive: creating the same (group,name) twice using
     * different casing must yield a 409 Conflict on the second request.
     */
    @Test
    void createPromptSpecShouldRejectCaseInsensitiveDuplicate() throws Exception {
        PromptSpecCreationRequest request = new PromptSpecCreationRequest();
        request.setName("Welcome");
        request.setGroup("Support");
        request.setDescription("desc");
        request.setMessages(List.of());

        PromptSpec created = PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(null)
                .build();

        when(promptLifecycleFacade.createPromptSpec(any(PromptSpec.class)))
                .thenReturn(created)
                .thenThrow(new PromptSpecAlreadyExistsException("support", "welcome"));

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        PromptSpecCreationRequest second = new PromptSpecCreationRequest();
        second.setName("welcome");
        second.setGroup("support");
        second.setDescription("desc");
        second.setMessages(List.of());

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isConflict());

        verify(promptLifecycleFacade, times(2)).createPromptSpec(any(PromptSpec.class));
    }

    private Path initializeRepositoryWithPromptCommit(Path tempDir, Instant commitInstant) throws Exception {
        Path repository = tempDir.resolve("repo");
        Files.createDirectories(repository);

        try (Git git = Git.init()
                .setInitialBranch("main")
                .setDirectory(repository.toFile())
                .call()) {
            Path promptFile = repository.resolve("prompts/support/welcome/promptlm.yml");
            Files.createDirectories(promptFile.getParent());
            Files.writeString(promptFile, "id: welcome\nname: welcome\ngroup: support\n");

            git.add()
                    .addFilepattern("prompts/support/welcome/promptlm.yml")
                    .call();

            PersonIdent ident = new PersonIdent(
                    "PromptLM Test",
                    "promptlm@example.com",
                    Date.from(commitInstant),
                    TimeZone.getTimeZone("UTC"));

            git.commit()
                    .setMessage("Add prompt")
                    .setAuthor(ident)
                    .setCommitter(ident)
                    .call();
        }

        return repository;
    }
}
