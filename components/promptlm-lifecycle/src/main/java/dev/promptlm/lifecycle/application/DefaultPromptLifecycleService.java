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

import dev.promptlm.domain.events.PromptCreatedEvent;
import dev.promptlm.domain.events.PromptReleaseRequestedEvent;
import dev.promptlm.domain.events.PromptReleasedEvent;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.EvaluationStatus;
import dev.promptlm.domain.promptspec.EvaluationResults;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.ReleaseMetadata;
import dev.promptlm.domain.promptspec.Request;
import dev.promptlm.release.PromptReleaseException;
import dev.promptlm.release.PromptReleasePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
class DefaultPromptLifecycleService implements PromptLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(DefaultPromptLifecycleService.class);
    private final PromptStorePort repository;
    private final PromptTemplatePort template;
    private final PromptIdGeneratorPort idGenerator;
    private final PromptLifecycleEventPublisher eventPublisher;
    private final PromptReleasePolicy releasePolicy;

    DefaultPromptLifecycleService(PromptStorePort repository,
                                  PromptTemplatePort template,
                                  PromptIdGeneratorPort idGenerator,
                                  PromptLifecycleEventPublisher eventPublisher,
                                  PromptReleasePolicy releasePolicy) {
        this.repository = repository;
        this.template = template;
        this.idGenerator = idGenerator;
        this.eventPublisher = eventPublisher;
        this.releasePolicy = releasePolicy;
    }

    @Override
    public PromptSpec createPrompt(String group,
                                   Map<String, String> placeholder,
                                   String name,
                                   List<ChatCompletionRequest.Message> userMessage,
                                   PromptSpec.Placeholders placeholders,
                                   Map<String, JsonNode> extensions) {
        String normalizedGroup = normalizeKey(group);
        String normalizedName = normalizeKey(name);

        repository.findPromptSpec(normalizedGroup, normalizedName)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Prompt %s already exists".formatted(normalizedGroup + "/" + normalizedName));
                });

        String templateContent = repository.findPromptSpecTemplate(normalizedGroup);
        PromptSpec.Placeholders placeholderConfig = placeholders != null ? placeholders : new PromptSpec.Placeholders();
        if (placeholderConfig.getStartPattern() == null) {
            placeholderConfig.setStartPattern("{{");
        }
        if (placeholderConfig.getEndPattern() == null) {
            placeholderConfig.setEndPattern("}}");
        }

        String id = idGenerator.generateId(normalizedGroup, normalizedName, userMessage);
        PromptSpec promptSpec = template.render(templateContent, normalizedGroup, normalizedName, userMessage, placeholder, placeholderConfig)
                .withId(id);
        if (extensions != null && !extensions.isEmpty()) {
            promptSpec = promptSpec.withExtensions(mergeExtensions(promptSpec.getExtensions(), extensions));
        }
        PromptSpec stored = repository.storePrompt(promptSpec);
        eventPublisher.publishEvent(new PromptCreatedEvent(stored));
        return stored;
    }

    @Override
    public PromptSpec createPromptSpec(PromptSpec promptSpec) throws PromptSpecAlreadyExistsException {
        if (promptSpec == null) {
            throw new IllegalArgumentException("Prompt spec must not be null");
        }

        String normalizedGroup = normalizeKey(promptSpec.getGroup());
        String normalizedName = normalizeKey(promptSpec.getName());
        PromptSpec normalizedSpec = promptSpec
                .withGroup(normalizedGroup)
                .withName(normalizedName);

        repository.findPromptSpec(normalizedGroup, normalizedName)
                .ifPresent(existing -> {
                    throw new PromptSpecAlreadyExistsException(promptSpec.getGroup(), promptSpec.getName());
                });


        PromptSpec withId = normalizedSpec.getId() != null
                ? normalizedSpec
                : normalizedSpec.withId(idGenerator.generateId(
                        normalizedGroup,
                        normalizedName,
                        extractMessages(normalizedSpec)
                ));

        PromptSpec stored = repository.storePrompt(withId);
        eventPublisher.publishEvent(new PromptCreatedEvent(stored));
        return stored;
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return null;
        }

        return value.toLowerCase(Locale.ROOT);
    }

    @Override
    public PromptSpec createDefaultPromptSpec() {
        Map<String, Object> defaultParams = new HashMap<>();
        defaultParams.put("temperature", 0.7);
        defaultParams.put("maxTokens", 1024);
        defaultParams.put("topP", 1.0);
        defaultParams.put("frequencyPenalty", 0.0);
        defaultParams.put("presencePenalty", 0.0);
        defaultParams.put("stream", false);

        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setStartPattern("{{");
        placeholders.setEndPattern("}}");
        placeholders.setList(List.of(new PromptSpec.Placeholder("customer_name", "Taylor")));

        Request request = ChatCompletionRequest.builder()
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
                                .build()
                ))
                .withParameters(defaultParams)
                .build();

        return PromptSpec.builder()
                .withGroup("support")
                .withName("support-prompt")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("Assist support agents")
                .withRequest(request)
                .withPlaceholders(placeholders)
                .build();
    }

    @Override
    public PromptSpec updatePrompt(String promptSpecId, PromptSpec updatingSpec) {
        PromptSpec promptSpec = repository.getLatestVersion(promptSpecId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt %s does not exist"));

        PromptSpec updated = promptSpec
                .withDescription(updatingSpec.getDescription())
                .withRequest(updatingSpec.getRequest())
                .withPlaceholders(updatingSpec.getPlaceholders())
                .withAuthors(updatingSpec.getAuthors())
                .withPurpose(updatingSpec.getPurpose())
                .withRepositoryUrl(updatingSpec.getRepositoryUrl())
                .withExtensions(mergeExtensions(promptSpec.getExtensions(), updatingSpec.getExtensions()));
        if (updatingSpec.getResponse() != null) {
            updated = updated.withResponse(updatingSpec.getResponse());
        }

        boolean semanticChanged = updated.hasSemanticChangesComparedTo(promptSpec);
        PromptSpec versioned = semanticChanged ? increaseRevision(updated) : updated;
        PromptSpec hashed = versioned.withSemanticHashComputed();
        repository.storePrompt(hashed);
        return hashed;
    }

    @Override
    public PromptSpec releasePrompt(String promptSpecId) {
        PromptSpec promptSpec = repository.getLatestVersion(promptSpecId)
                .orElseThrow(() -> new PromptReleaseException(
                        "Could not find prompt %s".formatted(promptSpecId)));

        EvaluationResults results = promptSpec.getEvaluationResults();

        if(results == null) {
            throw new IllegalStateException("Prompt %s has null evaluation".formatted(promptSpecId));
        }

        if (results.getStatus() != EvaluationStatus.NOT_CONFIGURED && !results.success()) {
            throw new PromptReleaseException(
                    "Prompt %s has failing evaluation results and was not released".formatted(promptSpecId));
        }

        if (results.getStatus() == EvaluationStatus.NOT_CONFIGURED) {
            log.info("Prompt %s no evals configured, proceeding release.".formatted(promptSpecId));
        }

        releasePolicy.validateRelease(promptSpec);
        PromptSpec released = repository.requestRelease(promptSpec);
        ReleaseMetadata releaseMetadata = requireReleaseMetadata(released);
        if (releaseMetadata.isRequested()) {
            eventPublisher.publishEvent(new PromptReleaseRequestedEvent(released));
        } else if (releaseMetadata.isReleased()) {
            eventPublisher.publishEvent(new PromptReleasedEvent(released));
        } else {
            throw new PromptReleaseException("Unsupported release state '%s' for prompt %s"
                    .formatted(releaseMetadata.state(), promptSpecId));
        }

        return released;
    }

    @Override
    public PromptSpec completeReleasePrompt(String promptSpecId, String pullRequestReference) {
        repository.getLatestVersion(promptSpecId)
                .orElseThrow(() -> new PromptReleaseException(
                        "Could not find prompt %s".formatted(promptSpecId)));

        PromptSpec released = repository.completeRelease(promptSpecId, pullRequestReference);
        ReleaseMetadata releaseMetadata = requireReleaseMetadata(released);
        if (!releaseMetadata.isReleased()) {
            throw new PromptReleaseException("Release completion for prompt %s did not return state 'released'"
                    .formatted(promptSpecId));
        }

        eventPublisher.publishEvent(new PromptReleasedEvent(released));
        return released;
    }

    @Override
    public PromptSpec persistEvaluatedPrompt(PromptSpec evaluatedPromptSpec) {
        if (evaluatedPromptSpec == null) {
            throw new IllegalArgumentException("Evaluated prompt spec must not be null");
        }
        if (evaluatedPromptSpec.getId() == null || evaluatedPromptSpec.getId().isBlank()) {
            throw new IllegalArgumentException("Evaluated prompt spec id must not be null or blank");
        }

        repository.getLatestVersion(evaluatedPromptSpec.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Prompt %s does not exist".formatted(evaluatedPromptSpec.getId())));

        PromptSpec versioned = increaseRevision(evaluatedPromptSpec);
        PromptSpec hashed = versioned.withSemanticHashComputed();
        repository.storePrompt(hashed);
        return hashed;
    }

    private PromptSpec increaseRevision(PromptSpec promptSpec) {
        return promptSpec.withRevision(promptSpec.getRevision() + 1);
    }

    private List<ChatCompletionRequest.Message> extractMessages(PromptSpec promptSpec) {
        if (promptSpec.getRequest() instanceof ChatCompletionRequest chatRequest) {
            return chatRequest.getMessages();
        }
        return List.of();
    }

    private Map<String, JsonNode> mergeExtensions(Map<String, JsonNode> base, Map<String, JsonNode> updates) {
        if (updates == null || updates.isEmpty()) {
            return base;
        }
        if (base == null || base.isEmpty()) {
            return updates;
        }
        Map<String, JsonNode> merged = new LinkedHashMap<>(base);
        merged.putAll(updates);
        return merged;
    }

    private static ReleaseMetadata requireReleaseMetadata(PromptSpec promptSpec) {
        ReleaseMetadata metadata = promptSpec.getReleaseMetadata();
        if (metadata == null) {
            throw new PromptReleaseException(
                    "Release operation did not provide required release metadata for prompt %s".formatted(promptSpec.getId()));
        }
        return metadata;
    }
}
