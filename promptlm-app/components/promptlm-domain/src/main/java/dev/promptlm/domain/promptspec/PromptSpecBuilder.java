package dev.promptlm.domain.promptspec;

import tools.jackson.databind.JsonNode;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class PromptSpecBuilder {
    private String specVersion;
    private UUID uuid;
    private String id;
    private String name;
    private String group;
    private String version;
    private Integer revision;
    private String description;
    private List<String> authors;
    private String purpose;
    private String repositoryUrl;
    private PromptSpec.PromptStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime retiredAt;
    private String retiredReason;
    private Request request;
    private PromptSpec.Placeholders placeholders;
    private Response response;
    private Map<String, JsonNode> extensions;
    private Path path;
    private List<Execution> executions;
    private String semanticHash;

    private PromptSpecBuilder() {
    }

    private PromptSpecBuilder(PromptSpec promptSpec) {
        this.specVersion = promptSpec.getSpecVersion();
        this.uuid = promptSpec.getUuid();
        this.id = promptSpec.getId();
        this.name = promptSpec.getName();
        this.group = promptSpec.getGroup();
        this.version = promptSpec.getVersion();
        this.revision = promptSpec.getRevision();
        this.description = promptSpec.getDescription();
        this.authors = promptSpec.getAuthors();
        this.purpose = promptSpec.getPurpose();
        this.repositoryUrl = promptSpec.getRepositoryUrl();
        this.status = promptSpec.getStatus();
        this.createdAt = promptSpec.getCreatedAt();
        this.updatedAt = promptSpec.getUpdatedAt();
        this.retiredAt = promptSpec.getRetiredAt();
        this.retiredReason = promptSpec.getRetiredReason();
        this.request = promptSpec.getRequest();
        this.placeholders = promptSpec.getPlaceholders();
        this.response = promptSpec.getResponse();
        this.extensions = promptSpec.getExtensions();
        this.path = promptSpec.getPath();
        this.executions = promptSpec.getExecutions();
        this.semanticHash = promptSpec.getSemanticHash();
    }

    public static PromptSpecBuilder builder() {
        return new PromptSpecBuilder();
    }

    public PromptSpecBuilder withSpecVersion(String specVersion) {
        this.specVersion = specVersion;
        return this;
    }

    public PromptSpecBuilder withUuid(UUID uuid) {
        this.uuid = uuid;
        return this;
    }

    public PromptSpecBuilder withId(String id) {
        this.id = id;
        return this;
    }

    public PromptSpecBuilder withName(String name) {
        this.name = name;
        return this;
    }

    public PromptSpecBuilder withGroup(String group) {
        this.group = group;
        return this;
    }

    public PromptSpecBuilder withVersion(String version) {
        this.version = version;
        return this;
    }

    public PromptSpecBuilder withRevision(Integer revision) {
        this.revision = revision;
        return this;
    }

    public PromptSpecBuilder withDescription(String description) {
        this.description = description;
        return this;
    }

    public PromptSpecBuilder withAuthors(List<String> authors) {
        this.authors = authors;
        return this;
    }

    public PromptSpecBuilder withPurpose(String purpose) {
        this.purpose = purpose;
        return this;
    }

    public PromptSpecBuilder withRepositoryUrl(String repositoryUrl) {
        this.repositoryUrl = repositoryUrl;
        return this;
    }

    public PromptSpecBuilder withStatus(PromptSpec.PromptStatus status) {
        this.status = status;
        return this;
    }

    public PromptSpecBuilder withCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public PromptSpecBuilder withUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    public PromptSpecBuilder withRetiredAt(LocalDateTime retiredAt) {
        this.retiredAt = retiredAt;
        return this;
    }

    public PromptSpecBuilder withRetiredReason(String retiredReason) {
        this.retiredReason = retiredReason;
        return this;
    }

    public PromptSpecBuilder withRequest(Request request) {
        this.request = request;
        return this;
    }

    public PromptSpecBuilder withPlaceholders(Map<String, String> placeholders) {
        if (placeholders == null) {
            this.placeholders = null;
            return this;
        }

        PromptSpec.Placeholders placeholdersValue = new PromptSpec.Placeholders();
        List<PromptSpec.Placeholder> placeholderList = placeholders.entrySet().stream()
                .map(entry -> new PromptSpec.Placeholder(entry.getKey(), entry.getValue()))
                .toList();
        placeholdersValue.setList(placeholderList);
        this.placeholders = placeholdersValue;
        return this;
    }

    public PromptSpecBuilder withPlaceholders(PromptSpec.Placeholders placeholders) {
        this.placeholders = placeholders;
        return this;
    }

    public PromptSpecBuilder withResponse(Response response) {
        this.response = response;
        return this;
    }

    public PromptSpecBuilder withEvaluationSpec(EvaluationSpec evaluationSpec) {
        this.extensions = EvaluationExtensions.withSpec(this.extensions, evaluationSpec);
        return this;
    }

    public PromptSpecBuilder withEvaluationResults(EvaluationResults evaluationResults) {
        this.extensions = EvaluationExtensions.withResults(this.extensions, evaluationResults);
        return this;
    }

    public PromptSpecBuilder withExtensions(Map<String, JsonNode> extensions) {
        this.extensions = extensions;
        return this;
    }

    public PromptSpecBuilder withPath(Path path) {
        this.path = path;
        return this;
    }

    public PromptSpecBuilder withExecutions(List<Execution> executions) {
        this.executions = executions;
        return this;
    }

    public PromptSpecBuilder withSemanticHash(String semanticHash) {
        this.semanticHash = semanticHash;
        return this;
    }

    public PromptSpecBuilder withMessages(List<ChatCompletionRequest.Message> messages) {
        if (messages == null) {
            return this;
        }
        messages.forEach(this::withMessage);
        return this;
    }

    public PromptSpecBuilder withMessage(ChatCompletionRequest.Message message) {
        ChatCompletionRequest chatRequest = ensureChatCompletionRequest();

        List<ChatCompletionRequest.Message> messages = chatRequest.getMessages();
        if (messages == null) {
            messages = new ArrayList<>();
        } else {
            messages = new ArrayList<>(messages);
        }

        messages.add(message);
        chatRequest.setMessages(messages);
        this.request = chatRequest;
        return this;
    }

    private ChatCompletionRequest ensureChatCompletionRequest() {
        if (request == null) {
            request = ChatCompletionRequest.builder()
                    .withType(ChatCompletionRequest.TYPE)
                    .build();
        }

        if (!(request instanceof ChatCompletionRequest)) {
            throw new IllegalStateException("Request must be a ChatCompletionRequest to add messages");
        }

        return (ChatCompletionRequest) request;
    }

    public PromptSpec build() {
        PromptSpec.PromptStatus effectiveStatus = status != null ? status : PromptSpec.PromptStatus.ACTIVE;
        PromptSpec promptSpec = new PromptSpec(specVersion, uuid, id, name, group, version, revision, description, authors, purpose, repositoryUrl,
                effectiveStatus, createdAt, updatedAt, retiredAt, retiredReason, request, placeholders, response, extensions, path, executions, semanticHash);
        return semanticHash == null ? promptSpec.withSemanticHashComputed() : promptSpec;
    }
}
