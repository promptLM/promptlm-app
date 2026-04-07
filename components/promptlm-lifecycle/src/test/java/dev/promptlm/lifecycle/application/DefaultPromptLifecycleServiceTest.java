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

package dev.promptlm.lifecycle.application;

import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.EvaluationResult;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.EvaluationStatus;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.release.PromptReleaseException;
import dev.promptlm.release.PromptReleasePolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import dev.promptlm.domain.events.PromptCreatedEvent;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefaultPromptLifecycleServiceTest {

    private static final String GROUP = "group";
    private static final String NAME = "name";
    private static final String PROMPT_ID = GROUP + "/" + NAME;

    @Mock
    private PromptStorePort repository;

    @Mock
    private PromptTemplatePort template;

    @Mock
    private PromptIdGeneratorPort idGenerator;

    @Mock
    private PromptLifecycleEventPublisher eventPublisher;

    @Mock
    private PromptReleasePolicy releasePolicy;

    @InjectMocks
    private DefaultPromptLifecycleService service;

    private PromptSpec basePromptSpec;

    @BeforeEach
    void setUp() {
        basePromptSpec = PromptSpec.builder()
                .withGroup(GROUP)
                .withName(NAME)
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4")
                        .withMessages(List.of())
                        .build())
                .build();
    }

    @Test
    void createPromptAssignsIdPublishesEventAndReturnsSpec() {
        PromptSpec rendered = basePromptSpec;
        PromptSpec withId = rendered.withId(PROMPT_ID);

        when(repository.findPromptSpec(GROUP, NAME)).thenReturn(Optional.empty());
        when(repository.findPromptSpecTemplate(GROUP)).thenReturn("template");
        when(template.render(eq("template"), eq(GROUP), eq(NAME), any(), any(), any())).thenReturn(rendered);
        when(repository.storePrompt(withId)).thenReturn(withId);

        PromptSpec result = service.createPrompt(GROUP, Map.of(), NAME, List.of(), new PromptSpec.Placeholders(), Map.of());

        assertThat(result).isEqualTo(withId);

        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue()).isInstanceOf(PromptCreatedEvent.class);
        PromptCreatedEvent event = (PromptCreatedEvent) eventCaptor.getValue();
        assertThat(event.promptSpec()).isEqualTo(withId);

        verify(repository).findPromptSpec(GROUP, NAME);
        verify(repository).findPromptSpecTemplate(GROUP);
        verify(template).render(eq("template"), eq(GROUP), eq(NAME), any(), any(), any());
    }

    @Test
    void createPromptThrowsWhenPromptAlreadyExists() {
        when(repository.findPromptSpec(GROUP, NAME)).thenReturn(Optional.of(basePromptSpec));

        assertThatThrownBy(() -> service.createPrompt(GROUP, Map.of(), NAME, List.of(), new PromptSpec.Placeholders(), Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");

        verify(repository).findPromptSpec(GROUP, NAME);
        verifyNoMoreInteractions(repository);
        verifyNoInteractions(template, idGenerator, eventPublisher);
    }

    /**
     * Ensures prompt creation is case-insensitive by normalizing group and name to lowercase
     * before checking for duplicates and generating IDs.
     */
    @Test
    void createPromptSpecNormalizesGroupAndNameToLowercase() {
        PromptSpec mixedCase = basePromptSpec
                .withGroup("Group")
                .withName("Name")
                .withId(null);

        when(repository.findPromptSpec(GROUP, NAME)).thenReturn(Optional.empty());
        when(idGenerator.generateId(eq(GROUP), eq(NAME), any())).thenReturn(PROMPT_ID);
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPromptSpec(mixedCase);

        ArgumentCaptor<PromptSpec> storedCaptor = ArgumentCaptor.forClass(PromptSpec.class);
        verify(repository).findPromptSpec(GROUP, NAME);
        verify(idGenerator).generateId(eq(GROUP), eq(NAME), any());
        verify(repository).storePrompt(storedCaptor.capture());

        PromptSpec stored = storedCaptor.getValue();
        assertThat(stored.getGroup()).isEqualTo(GROUP);
        assertThat(stored.getName()).isEqualTo(NAME);
    }

    @Test
    void createDefaultPromptSpecReturnsCanonicalDraftTemplate() {
        PromptSpec templateSpec = service.createDefaultPromptSpec();

        assertThat(templateSpec.getGroup()).isEqualTo("support");
        assertThat(templateSpec.getName()).isEqualTo("support-prompt");
        assertThat(templateSpec.getDescription()).isEqualTo("Assist support agents");

        ChatCompletionRequest request = (ChatCompletionRequest) templateSpec.getRequest();
        assertThat(request.getVendor()).isEqualTo("openai");
        assertThat(request.getModel()).isEqualTo("gpt-4o");
        assertThat(request.getMessages())
                .extracting(ChatCompletionRequest.Message::getRole, ChatCompletionRequest.Message::getContent)
                .containsExactly(
                        tuple("system", "You are a helpful assistant."),
                        tuple("user", "Help the customer.")
                );
        assertThat(request.getParameters()).containsEntry("maxTokens", 1024);
        assertThat(request.getParameters()).containsEntry("stream", false);

        assertThat(templateSpec.getPlaceholders()).isNotNull();
        assertThat(templateSpec.getPlaceholders().getStartPattern()).isEqualTo("{{");
        assertThat(templateSpec.getPlaceholders().getEndPattern()).isEqualTo("}}");
        assertThat(templateSpec.getPlaceholders().getList())
                .extracting(PromptSpec.Placeholder::getName, PromptSpec.Placeholder::getValue)
                .containsExactly(tuple("customer_name", "Taylor"));
    }

    @Test
    void updatePromptStoresPromptWithIncrementedRevision() {
        PromptSpec existing = basePromptSpec.withRevision(3);
        PromptSpec updating = existing.withRequest(ChatCompletionRequest.builder()
                .withVendor("openai")
                .withModel("gpt-4")
                .withMessages(List.of(ChatCompletionRequest.Message.builder()
                        .withRole("user")
                        .withContent("new-message")
                        .build()))
                .build());

        assertThat(updating).isEqualTo(existing);
        assertThat(updating.hasSemanticChangesComparedTo(existing)).isTrue();

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(existing));
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PromptSpec result = service.updatePrompt(PROMPT_ID, updating);

        assertThat(((ChatCompletionRequest) result.getRequest()).getMessages())
                .extracting(ChatCompletionRequest.Message::getContent)
                .containsExactly("new-message");
        assertThat(result.getRevision()).isEqualTo(4);

        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).storePrompt(result);
    }

    @Test
    void updatePromptStoresPromptWithoutRevisionIncreaseWhenOnlyMetadataChanged() {
        ChatCompletionResponse existingResponse = new ChatCompletionResponse(12L, null, "already-stored");
        PromptSpec existing = basePromptSpec
                .withRevision(3)
                .withResponse(existingResponse);
        PromptSpec updating = basePromptSpec
                .withRevision(3)
                .withDescription("new-desc");

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(existing));
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PromptSpec result = service.updatePrompt(PROMPT_ID, updating);

        assertThat(result.getDescription()).isEqualTo("new-desc");
        assertThat(result.getRevision()).isEqualTo(3);
        assertThat(result.getResponse()).isEqualTo(existingResponse);

        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).storePrompt(result);
    }

    @Test
    void updatePromptStoresProvidedResponseWithoutRevisionIncrease() {
        PromptSpec existing = basePromptSpec.withRevision(3);
        ChatCompletionResponse capturedResponse = new ChatCompletionResponse(45L, null, "captured");
        PromptSpec updating = existing.withResponse(capturedResponse);

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(existing));
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PromptSpec result = service.updatePrompt(PROMPT_ID, updating);

        assertThat(result.getRevision()).isEqualTo(3);
        assertThat(result.getResponse()).isEqualTo(capturedResponse);

        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).storePrompt(result);
    }

    @Test
    void updatePromptPreservesExtensionsWhenUpdateOmitsExtensions() {
        ObjectNode extensionNode = JsonNodeFactory.instance.objectNode()
                .put("foo", "bar");
        PromptSpec existing = basePromptSpec
                .withRevision(3)
                .withExtensions(Map.of("x-legacy", extensionNode));
        PromptSpec updating = basePromptSpec
                .withRevision(3)
                .withDescription("new-desc");

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(existing));
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PromptSpec result = service.updatePrompt(PROMPT_ID, updating);

        assertThat(result.getExtensions()).containsEntry("x-legacy", extensionNode);

        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).storePrompt(result);
    }

    @Test
    void updatePromptMergesExtensionsWhenUpdateProvidesNewEntries() {
        ObjectNode legacyNode = JsonNodeFactory.instance.objectNode()
                .put("foo", "bar");
        ObjectNode newNode = JsonNodeFactory.instance.objectNode()
                .put("baz", "qux");
        PromptSpec existing = basePromptSpec
                .withRevision(3)
                .withExtensions(Map.of("x-legacy", legacyNode));
        PromptSpec updating = basePromptSpec
                .withRevision(3)
                .withExtensions(Map.of("x-new", newNode));

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(existing));
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PromptSpec result = service.updatePrompt(PROMPT_ID, updating);

        assertThat(result.getExtensions())
                .containsEntry("x-legacy", legacyNode)
                .containsEntry("x-new", newNode);

        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).storePrompt(result);
    }

    @Test
    void persistEvaluatedPromptThrowsWhenPromptIsNull() {
        assertThatThrownBy(() -> service.persistEvaluatedPrompt(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must not be null");

        verifyNoInteractions(repository, releasePolicy, eventPublisher, template, idGenerator);
    }

    @Test
    void persistEvaluatedPromptThrowsWhenPromptIdIsMissing() {
        PromptSpec withoutId = basePromptSpec.withId(null);

        assertThatThrownBy(() -> service.persistEvaluatedPrompt(withoutId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("id must not be null or blank");

        verifyNoInteractions(repository, releasePolicy, eventPublisher, template, idGenerator);
    }

    @Test
    void persistEvaluatedPromptThrowsWhenPromptDoesNotExist() {
        PromptSpec evaluated = basePromptSpec
                .withId(PROMPT_ID)
                .withRevision(4)
                .withEvaluationResults(new EvaluationResults(List.of(), EvaluationStatus.EVALUATED_OK));
        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.persistEvaluatedPrompt(evaluated))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not exist");

        verify(repository).getLatestVersion(PROMPT_ID);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void persistEvaluatedPromptStoresNewRevisionThroughRepository() {
        PromptSpec evaluated = basePromptSpec
                .withId(PROMPT_ID)
                .withRevision(4)
                .withEvaluationResults(new EvaluationResults(List.of(), EvaluationStatus.EVALUATED_OK));
        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));
        when(repository.storePrompt(any(PromptSpec.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PromptSpec result = service.persistEvaluatedPrompt(evaluated);

        assertThat(result.getId()).isEqualTo(PROMPT_ID);
        assertThat(result.getRevision()).isEqualTo(5);
        assertThat(result.getEvaluationResults()).isNotNull();
        assertThat(result.getEvaluationResults().getStatus()).isEqualTo(EvaluationStatus.EVALUATED_OK);

        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).storePrompt(result);
        verifyNoInteractions(releasePolicy, eventPublisher, template, idGenerator);
    }

    @Test
    void releasePromptThrowsWhenNoEvaluationResults() {
        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(basePromptSpec));
        assertThatThrownBy(() -> service.releasePrompt(PROMPT_ID))
                .isInstanceOf(PromptReleaseException.class)
                .hasMessageContaining("no evaluation results");

        verify(repository).getLatestVersion(PROMPT_ID);
        verifyNoMoreInteractions(repository);
        verifyNoInteractions(releasePolicy);
    }

    @Test
    void releasePromptThrowsWhenEvaluationFailed() {
        EvaluationResults failingResults = new EvaluationResults(List.of(new EvaluationResult("eval", "type", 0.0, null, null)));
        PromptSpec evaluated = basePromptSpec.withEvaluationResults(failingResults);

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));

        assertThatThrownBy(() -> service.releasePrompt(PROMPT_ID))
                .isInstanceOf(PromptReleaseException.class)
                .hasMessageContaining("failing evaluation results");

        verify(repository).getLatestVersion(PROMPT_ID);
        verifyNoMoreInteractions(repository);
        verifyNoInteractions(releasePolicy);
    }

    @Test
    void releasePromptThrowsWhenEvaluationIsNotConfigured() {
        EvaluationResults notConfigured = new EvaluationResults(List.of(), EvaluationStatus.NOT_CONFIGURED);
        PromptSpec evaluated = basePromptSpec.withEvaluationResults(notConfigured);

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));

        assertThatThrownBy(() -> service.releasePrompt(PROMPT_ID))
                .isInstanceOf(PromptReleaseException.class)
                .hasMessageContaining("no evaluation results");

        verify(repository).getLatestVersion(PROMPT_ID);
        verifyNoMoreInteractions(repository);
        verifyNoInteractions(releasePolicy);
    }

    @Test
    void releasePromptThrowsWhenPolicyRejects() {
        EvaluationResults successResults = new EvaluationResults(List.of(new EvaluationResult("eval", "type", 1.0, null, null)));
        PromptSpec evaluated = basePromptSpec.withEvaluationResults(successResults);

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));
        doThrow(new PromptReleaseException("policy blocked")).when(releasePolicy).validateRelease(evaluated);

        assertThatThrownBy(() -> service.releasePrompt(PROMPT_ID))
                .isInstanceOf(PromptReleaseException.class)
                .hasMessageContaining("policy blocked");

        verify(releasePolicy).validateRelease(evaluated);
        verify(repository).getLatestVersion(PROMPT_ID);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void releasePromptReturnsReleasedSpecWhenEvaluationSuccessful() {
        EvaluationResults successResults = new EvaluationResults(List.of(new EvaluationResult("eval", "type", 1.0, null, null)));
        PromptSpec evaluated = basePromptSpec.withEvaluationResults(successResults);
        PromptSpec released = evaluated.withVersion("1.0.0");

        when(repository.getLatestVersion(PROMPT_ID)).thenReturn(Optional.of(evaluated));
        when(repository.release(evaluated)).thenReturn(released);

        PromptSpec result = service.releasePrompt(PROMPT_ID);

        assertThat(result).isEqualTo(released);

        verify(releasePolicy).validateRelease(evaluated);
        verify(repository).getLatestVersion(PROMPT_ID);
        verify(repository).release(evaluated);
    }
}
