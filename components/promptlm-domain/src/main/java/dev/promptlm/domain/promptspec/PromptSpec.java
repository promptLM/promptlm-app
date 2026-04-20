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

package dev.promptlm.domain.promptspec;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.PathToStringSerializer;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;

import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Schema(description = "Prompt specification persisted in the prompt store")
public class PromptSpec {

    private static final String EVALUATION_EXTENSION_KEY = EvaluationExtensions.KEY;
    private static final ObjectMapper EXTENSION_MAPPER = ObjectMapperFactory.createJsonMapper();

    @JsonProperty("specVersion")
    private final String specVersion;

    @JsonProperty("uuid")
    private final UUID uuid;

    /**
     * Unique identifier of this prompt
     */
    @Schema(description = "Unique identifier of this prompt", example = "support_welcome")
    private final String id;

    /**
     * Name of the prompt.
     * Only alphanumeric characters (A-Z, a-z, 0-9), dash (-) and underscore (_) are allowed.
     * Special characters and non-ASCII characters are prohibited.
     */
    @Pattern(regexp = "^[a-zA-Z0-9\\-_]+$", message = "Name must contain only alphanumeric characters (A-Z, a-z, 0-9). Special characters and spaces are not allowed.")
    @Schema(description = "Prompt name", example = "support_welcome")
    private final String name;

    /**
     * Group of prompts. Default group when null.
     */
    @Pattern(regexp = "^[a-zA-Z0-9\\-_]+$", message = "Name must contain only alphanumeric characters (A-Z, a-z, 0-9). Special characters and spaces are not allowed.")
    @Schema(description = "Prompt group", example = "support")
    private final String group;


    /**
     * Version number.
     */
    @Schema(description = "Semantic version of the prompt", example = "1.0.0")
    private final String version;

    @JsonProperty("revision")
    @Schema(description = "Revision number for drafts", example = "3")
    private final Integer revision;

    /**
     * Description of the prompt.
     */
    @Schema(description = "Human readable description of the prompt")
    private final String description;

    @ArraySchema(schema = @Schema(description = "Author identifiers"))
    private final List<String> authors;

    @Schema(description = "Business purpose or intent behind the prompt")
    private final String purpose;

    @JsonProperty("repositoryUrl")
    @Schema(description = "Source repository URL for this prompt", example = "https://github.com/my-org/prompts")
    private final String repositoryUrl;

    /**
     * Status of the prompt (ACTIVE or RETIRED)
     */
    @JsonProperty("status")
    @Schema(description = "Publication status of the prompt")
    private final PromptStatus status;

    @JsonProperty("createdAt")
    @Schema(description = "Timestamp when the prompt was created", format = "date-time")
    private final LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    @Schema(description = "Timestamp when the prompt was last updated", format = "date-time")
    private final LocalDateTime updatedAt;

    /**
     * When the prompt was retired (null if not retired)
     */
    @JsonProperty("retiredAt")
    @Schema(description = "Timestamp when the prompt was retired", format = "date-time")
    private final LocalDateTime retiredAt;

    /**
     * Reason for retirement (null if not retired)
     */
    @JsonProperty("retiredReason")
    @Schema(description = "Optional explanation why the prompt was retired")
    private final String retiredReason;

    /**
     * Request to LLM vendor API
     */
    @Schema(description = "LLM invocation payload", oneOf = {ChatCompletionRequest.class, ImagesGenerationsRequest.class, AudioSpeechRequest.class})
    private final Request request;

    @JsonProperty("placeholders")
    @Schema(description = "Placeholder metadata and default values")
    private final Placeholders placeholders;

    /**
     * Response(s) for the {@link Request}.
     */
    @JsonProperty("response")
    @Schema(description = "Latest captured response from prompt execution")
    private final Response response;

    @JsonProperty("extensions")
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    @Schema(description = "Custom extension payloads keyed by x-*")
    private final Map<String, JsonNode> extensions;

    @JsonProperty("path")
    @JsonSerialize(using = PathToStringSerializer.class)
    @Schema(description = "Filesystem path where the prompt is persisted", example = "prompts/support/welcome.yaml")
    private final Path path;

    @ArraySchema(schema = @Schema(implementation = Execution.class), arraySchema = @Schema(description = "Recent executions of the prompt"))
    private final List<Execution> executions;

    @JsonProperty("semanticHash")
    @Schema(description = "Stable hash across semantic prompt fields")
    private final String semanticHash;

    public String getRepositoryUrl() {
        return repositoryUrl;
    }

    public UUID getUuid() {
        return uuid;
    }

    /**
     * Status of the prompt specification
     */
    public enum PromptStatus {
        /**
         * Prompt is active and available for use
         */
        ACTIVE,

        /**
         * Prompt has been retired and should not be used for new applications
         */
        RETIRED
    }

    @JsonCreator
    public static PromptSpec fromJson(
            @JsonProperty("specVersion") String specVersion,
            @JsonProperty("uuid") UUID uuid,
            @JsonProperty("id") String id,
            @JsonProperty("name") String name,
            @JsonProperty("group") String group,
            @JsonProperty("version") String version,
            @JsonProperty("revision") Integer revision,
            @JsonProperty("description") String description,
            @JsonProperty("authors") List<String> authors,
            @JsonProperty("purpose") String purpose,
            @JsonProperty("repositoryUrl") String repositoryUrl,
            @JsonProperty("status") PromptStatus status,
            @JsonProperty("createdAt") LocalDateTime createdAt,
            @JsonProperty("updatedAt") LocalDateTime updatedAt,
            @JsonProperty("retiredAt") LocalDateTime retiredAt,
            @JsonProperty("retiredReason") String retiredReason,
            @JsonProperty("request") Request request,
            @JsonProperty("placeholders") Placeholders placeholders,
            @JsonProperty("response") Response response,
            @JsonProperty("evaluationSpec") EvaluationSpec evaluationSpec,
            @JsonProperty("evaluationResults") EvaluationResults evaluationResults,
            @JsonProperty("extensions") Map<String, JsonNode> extensions,
            @JsonProperty("path") Path path,
            @JsonProperty("executions") List<Execution> executions,
            @JsonProperty("semanticHash") String semanticHash) {

        Map<String, JsonNode> mergedExtensions = mergeLegacyExtensions(extensions, evaluationSpec, evaluationResults);
        return new PromptSpec(
                specVersion,
                uuid,
                id,
                name,
                group,
                version,
                revision,
                description,
                authors,
                purpose,
                repositoryUrl,
                status,
                createdAt,
                updatedAt,
                retiredAt,
                retiredReason,
                request,
                placeholders,
                response,
                mergedExtensions,
                path,
                executions,
                semanticHash
        );
    }

    public PromptSpec(
            @JsonProperty("specVersion") String specVersion,
            @JsonProperty("uuid") UUID uuid,
            @JsonProperty("id") String id,
            @JsonProperty("name") String name,
            @JsonProperty("group") String group,
            @JsonProperty("version") String version,
            @JsonProperty("revision") Integer revision,
            @JsonProperty("description") String description,
            @JsonProperty("authors") List<String> authors,
            @JsonProperty("purpose") String purpose,
            @JsonProperty("repositoryUrl") String repositoryUrl,
            @JsonProperty("status") PromptStatus status,
            @JsonProperty("createdAt") LocalDateTime createdAt,
            @JsonProperty("updatedAt") LocalDateTime updatedAt,
            @JsonProperty("retiredAt") LocalDateTime retiredAt,
            @JsonProperty("retiredReason") String retiredReason,
            @JsonProperty("request") Request request,
            @JsonProperty("placeholders") Placeholders placeholders,
            @JsonProperty("response") Response response,
            @JsonProperty("extensions") Map<String, JsonNode> extensions,
            @JsonProperty("path") Path path,
            @JsonProperty("executions") List<Execution> executions,
            @JsonProperty("semanticHash") String semanticHash) {

        this.specVersion = specVersion;
        this.uuid = uuid;
        this.id = id;
        this.name = name;
        this.version = version;
        this.revision = revision;
        this.description = description;
        this.authors = authors;
        this.purpose = purpose;
        this.repositoryUrl = repositoryUrl;
        this.group = group;
        this.status = status != null ? status : PromptStatus.ACTIVE; // Default to ACTIVE
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.retiredAt = retiredAt;
        this.retiredReason = retiredReason;
        this.request = request;
        this.placeholders = placeholders;
        this.response = response;
        this.extensions = normalizeExtensions(extensions);
        this.path = path;
        this.executions = executions;
        this.semanticHash = semanticHash;
    }

    public PromptSpec(
            String specVersion,
            UUID uuid,
            String id,
            String name,
            String group,
            String version,
            Integer revision,
            String description,
            List<String> authors,
            String purpose,
            String repositoryUrl,
            PromptStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime retiredAt,
            String retiredReason,
            Request request,
            Placeholders placeholders,
            Response response,
            Map<String, JsonNode> extensions,
            Path path,
            List<Execution> executions) {
        this(
                specVersion,
                uuid,
                id,
                name,
                group,
                version,
                revision,
                description,
                authors,
                purpose,
                repositoryUrl,
                status,
                createdAt,
                updatedAt,
                retiredAt,
                retiredReason,
                request,
                placeholders,
                response,
                extensions,
                path,
                executions,
                null
        );
    }


    public Placeholders getPlaceholders() {

        return this.placeholders;
    }

    public PromptSpec withId(String id) {
        return this.id == id ? this : new PromptSpec(this.specVersion, this.uuid, id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withDescription(String description) {
        return this.description == description ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withName(String name) {

        return this.name == name ? this : new PromptSpec(this.specVersion, this.uuid, this.id, name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withGroup(String group) {

        return this.group == group ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withVersion(String version) {

        return this.version == version ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withRevision(Integer revision) {

        return this.revision == revision ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withAuthors(List<String> authors) {

        return Objects.equals(this.authors, authors) ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withPurpose(String purpose) {

        return Objects.equals(this.purpose, purpose) ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withRepositoryUrl(String repositoryUrl) {
        return this.repositoryUrl == repositoryUrl ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, repositoryUrl, this.status, this.createdAt, updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withStatus(PromptStatus status) {
        return this.status == status ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withCreatedAt(LocalDateTime createdAt) {
        return this.createdAt == createdAt ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withUpdatedAt(LocalDateTime updatedAt) {
        return this.updatedAt == updatedAt ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withRetiredAt(LocalDateTime retiredAt) {

        return this.retiredAt == retiredAt ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withRetiredReason(String retiredReason) {

        return this.retiredReason == retiredReason ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withRequest(Request request) {

        return this.request == request ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, request, this.placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withPlaceholders(Placeholders placeholders) {

        return this.placeholders == placeholders ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, placeholders, this.response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withResponse(Response response) {

        return this.response == response ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, response, this.extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withEvaluationSpec(EvaluationSpec evaluationSpec) {
        Map<String, JsonNode> updated = EvaluationExtensions.withSpec(this.extensions, evaluationSpec);
        return Objects.equals(this.extensions, updated) ? this : withExtensions(updated);
    }

    public PromptSpec withEvaluationResults(EvaluationResults evaluationResults) {
        Map<String, JsonNode> updated = EvaluationExtensions.withResults(this.extensions, evaluationResults);
        return Objects.equals(this.extensions, updated) ? this : withExtensions(updated);
    }

    public PromptSpec withReleaseMetadata(ReleaseMetadata releaseMetadata) {
        Map<String, JsonNode> updated = ReleaseExtensions.withRelease(this.extensions, releaseMetadata);
        return Objects.equals(this.extensions, updated) ? this : withExtensions(updated);
    }

    public PromptSpec withExtensions(Map<String, JsonNode> extensions) {
        return Objects.equals(this.extensions, extensions)
                ? this
                : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, extensions, this.path, this.executions, this.semanticHash);
    }

    public PromptSpec withPath(Path path) {

        return this.path == path ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, path, this.executions, this.semanticHash);
    }

    public PromptSpec withSemanticHash(String semanticHash) {
        return Objects.equals(this.semanticHash, semanticHash) ? this : new PromptSpec(this.specVersion, this.uuid, this.id, this.name, this.group, this.version, this.revision, this.description, this.authors, this.purpose, this.repositoryUrl, this.status, this.createdAt, this.updatedAt, this.retiredAt, this.retiredReason, this.request, this.placeholders, this.response, this.extensions, this.path, this.executions, semanticHash);
    }

    @JsonIgnore
    public PromptSpec withSemanticHashComputed() {
        return withSemanticHash(computeSemanticHash());
    }

    @JsonIgnore
    public boolean isSemanticHashUpToDate() {
        return Objects.equals(this.semanticHash, computeSemanticHash());
    }

    @JsonIgnore
    public boolean hasSemanticChangesComparedTo(PromptSpec other) {
        String thisHash = computeSemanticHash();
        String otherHash = other == null ? null : other.computeSemanticHash();
        return !Objects.equals(thisHash, otherHash);
    }

    @JsonIgnore
    public String computeSemanticHash() {
        byte[] serialized = PromptSpecHash.serialize(this);
        if (serialized == null) {
            return null;
        }
        MessageDigest digest = newDigest();
        digest.update(serialized);
        return toHex(digest.digest());
    }

    private static MessageDigest newDigest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to compute semantic hash", e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    public String getId() {

        return id;
    }

    public String getName() {

        return name;
    }

    public String getVersion() {

        return version;
    }

    public String getDescription() {

        return description;
    }

    public Request getRequest() {

        return request;
    }

    public String getSpecVersion() {

        return specVersion;
    }

    public List<String> getAuthors() {

        return authors;
    }

    public String getPurpose() {

        return purpose;
    }

    public List<Execution> getExecutions() {

        return executions;
    }

    @JsonIgnore
    public EvaluationSpec getEvaluationSpec() {

        return EvaluationExtensions.readSpec(extensions);
    }

    @JsonIgnore
    public EvaluationResults getEvaluationResults() {
        if(extensions.isEmpty()) {
            return EvaluationResults.notConfigured();
        }
        return EvaluationExtensions.readResults(extensions);
    }

    @JsonIgnore
    public ReleaseMetadata getReleaseMetadata() {
        if (extensions.isEmpty()) {
            return null;
        }
        return ReleaseExtensions.readRelease(extensions);
    }

    public Map<String, JsonNode> getExtensions() {
        return extensions == null ? null : Collections.unmodifiableMap(extensions);
    }

    @JsonIgnore
    public JsonNode getExtension(String key) {
        return extensions == null ? null : extensions.get(key);
    }

    public Response getResponse() {

        return response;
    }

    public Path getPath() {

        return path;
    }

    public String getSemanticHash() {

        return semanticHash;
    }

    @JsonAnySetter
    void captureExtension(String key, JsonNode value) {
        if (!isExtensionKey(key)) {
            return;
        }
        extensions.put(key, value);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {

        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        PromptSpec that = (PromptSpec) o;
        return Objects.equals(name, that.name)
                && Objects.equals(group, that.group)
                && Objects.equals(version, that.version)
                && Objects.equals(revision, that.revision);
    }

    @Override
    public int hashCode() {

        return Objects.hash(name, group, version, revision);
    }

    public int getRevision() {

        return revision != null ? revision : 0;
    }

    public String getGroup() {

        return group;
    }

    public PromptStatus getStatus() {

        return status != null ? status : PromptStatus.ACTIVE;
    }

    public LocalDateTime getRetiredAt() {

        return retiredAt;
    }

    public String getRetiredReason() {

        return retiredReason;
    }

    @JsonIgnore
    public boolean isRetired() {

        return PromptStatus.RETIRED.equals(getStatus());
    }

    private static Map<String, JsonNode> normalizeExtensions(Map<String, JsonNode> extensions) {
        if (extensions == null || extensions.isEmpty()) {
            return new LinkedHashMap<>();
        }
        LinkedHashMap<String, JsonNode> copy = new LinkedHashMap<>();
        for (Map.Entry<String, JsonNode> entry : extensions.entrySet()) {
            String key = entry.getKey();
            if (!isExtensionKey(key)) {
                throw new IllegalArgumentException("Extension keys must start with 'x-': " + key);
            }
            copy.put(key, entry.getValue());
        }
        return copy;
    }

    private static boolean isExtensionKey(String key) {
        return key != null && key.startsWith("x-");
    }

    private static Map<String, JsonNode> mergeLegacyExtensions(
            Map<String, JsonNode> extensions,
            EvaluationSpec evaluationSpec,
            EvaluationResults evaluationResults) {
        if (evaluationSpec == null && evaluationResults == null) {
            return extensions;
        }

        LinkedHashMap<String, JsonNode> merged = extensions == null ? new LinkedHashMap<>() : new LinkedHashMap<>(extensions);
        JsonNode existingNode = merged.get(EVALUATION_EXTENSION_KEY);
        ObjectNode evaluationNode = existingNode != null && existingNode.isObject()
                ? ((ObjectNode) existingNode).deepCopy()
                : EXTENSION_MAPPER.createObjectNode();

        if (evaluationSpec != null && evaluationNode.get("spec") == null) {
            evaluationNode.set("spec", EXTENSION_MAPPER.valueToTree(evaluationSpec));
        }
        if (evaluationResults != null && evaluationNode.get("results") == null) {
            evaluationNode.set("results", EXTENSION_MAPPER.valueToTree(evaluationResults));
        }

        if (evaluationNode.size() > 0) {
            merged.put(EVALUATION_EXTENSION_KEY, evaluationNode);
        }

        return merged;
    }

    public static Builder builderFrom(PromptSpec template) {

        Objects.requireNonNull(template, "template");

        return new Builder(template);
    }

    public static BuilderSteps.NameStep builder() {

        return new Builder();
    }

    interface BuilderSteps {

        public interface IdStep {


            BuildStep withId(String id);
        }

        public interface NameStep {
            NameStep withGroup(String group);

            VersionStep withName(String name);
        }

        public interface VersionStep {
            VersionStep withVersion(String version);

            DescriptionStep withRevision(int revision);
        }

        public interface DescriptionStep {
            RequestStep withDescription(String description);
        }

        public interface RequestStep {
            BuildStep withRequest(Request request);
        }

        public interface BuildStep {
            BuildStep withSpecVersion(String specVersion);

            BuildStep withUuid(UUID uuid);

            BuildStep withResponse(Response response);

            BuildStep withAuthors(List<String> authors);

            BuildStep withPurpose(String purpose);

            BuildStep withRepositoryUrl(String repositoryUrl);

            BuildStep withStatus(PromptStatus status);

            BuildStep withCreatedAt(LocalDateTime createdAt);

            BuildStep withUpdatedAt(LocalDateTime updatedAt);

            BuildStep withRetiredAt(LocalDateTime retiredAt);

            BuildStep withRetiredReason(String retiredReason);

            BuildStep withPlaceholders(Placeholders placeholders);

            BuildStep withEvaluationSpec(EvaluationSpec evaluationSpec);

            BuildStep withEvaluationResults(EvaluationResults evaluationResults);

            BuildStep withExtensions(Map<String, JsonNode> extensions);

            BuildStep withPath(Path path);

            BuildStep withExecutions(List<Execution> executions);

            BuildStep withSemanticHash(String semanticHash);

            PromptSpec build();
        }
    }

    public static final class Builder implements BuilderSteps.IdStep, BuilderSteps.NameStep, BuilderSteps.VersionStep, BuilderSteps.DescriptionStep, BuilderSteps.RequestStep, BuilderSteps.BuildStep {
        private String specVersion;
        private UUID uuid;
        private String id;
        private String name;
        private String version;
        private int revision;
        private String description;
        private Request request;
        private Response response;
        private List<String> authors;
        private String purpose;
        private String repositoryUrl;
        private String group;
        private PromptStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime retiredAt;
        private String retiredReason;
        private Placeholders placeholders;
        private Map<String, JsonNode> extensions;
        private Path path;
        private List<Execution> executions;
        private String semanticHash;

        private Builder() {
        }

        private Builder(PromptSpec template) {
            this.specVersion = template.getSpecVersion();
            this.uuid = template.getUuid();
            this.id = template.getId();
            this.name = template.getName();
            this.version = template.getVersion();
            this.revision = template.getRevision();
            this.description = template.getDescription();
            this.request = template.getRequest();
            this.response = template.getResponse();
            this.authors = template.getAuthors();
            this.purpose = template.getPurpose();
            this.repositoryUrl = template.getRepositoryUrl();
            this.group = template.getGroup();
            this.status = template.getStatus();
            this.createdAt = template.getCreatedAt();
            this.updatedAt = template.getUpdatedAt();
            this.retiredAt = template.getRetiredAt();
            this.retiredReason = template.getRetiredReason();
            this.placeholders = template.getPlaceholders();
            this.extensions = template.getExtensions();
            this.path = template.getPath();
            this.executions = template.getExecutions();
            this.semanticHash = template.getSemanticHash();
        }

        @Override
        public BuilderSteps.BuildStep withId(String id) {
            this.id = id;
            return this;
        }

        @Override
        public BuilderSteps.NameStep withGroup(String group) {
            this.group = group;
            return this;
        }

        @Override
        public BuilderSteps.VersionStep withName(String name) {
            this.name = name;
            return this;
        }

        @Override
        public BuilderSteps.VersionStep withVersion(String version) {
            this.version = version;
            return this;
        }

        @Override
        public BuilderSteps.RequestStep withDescription(String description) {
            this.description = description;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withRequest(Request request) {
            this.request = request;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withSpecVersion(String specVersion) {
            this.specVersion = specVersion;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withUuid(UUID uuid) {
            this.uuid = uuid;
            return this;
        }

        @Override
        public BuilderSteps.DescriptionStep withRevision(int revision) {
            this.revision = revision;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withResponse(Response response) {
            this.response = response;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withAuthors(List<String> authors) {
            this.authors = authors;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withPurpose(String purpose) {
            this.purpose = purpose;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withRepositoryUrl(String repositoryUrl) {
            this.repositoryUrl = repositoryUrl;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withStatus(PromptStatus status) {
            this.status = status;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withRetiredAt(LocalDateTime retiredAt) {
            this.retiredAt = retiredAt;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withRetiredReason(String retiredReason) {
            this.retiredReason = retiredReason;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withPlaceholders(Placeholders placeholders) {
            this.placeholders = placeholders;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withEvaluationSpec(EvaluationSpec evaluationSpec) {
            this.extensions = EvaluationExtensions.withSpec(this.extensions, evaluationSpec);
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withEvaluationResults(EvaluationResults evaluationResults) {
            this.extensions = EvaluationExtensions.withResults(this.extensions, evaluationResults);
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withExtensions(Map<String, JsonNode> extensions) {
            this.extensions = extensions;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withPath(Path path) {
            this.path = path;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withExecutions(List<Execution> executions) {
            this.executions = executions;
            return this;
        }

        @Override
        public BuilderSteps.BuildStep withSemanticHash(String semanticHash) {
            this.semanticHash = semanticHash;
            return this;
        }

        @Override
        public PromptSpec build() {
            return new PromptSpec(
                    specVersion,
                    uuid,
                    id,
                    name,
                    group,
                    version,
                    revision,
                    description,
                    authors,
                    purpose,
                    repositoryUrl,
                    status,
                    createdAt,
                    updatedAt,
                    retiredAt,
                    retiredReason,
                    request,
                    placeholders,
                    response,
                    extensions,
                    path,
                    executions,
                    semanticHash
            );
        }
    }

    @Schema(description = "Collection of placeholders and their default values")
    public static class Placeholders {
        private String startPattern;
        private String endPattern;
        @ArraySchema(schema = @Schema(implementation = Placeholder.class))
        private List<Placeholder> list = new ArrayList<>();

        public Placeholders() {

        }

        public Map<String, String> getDefaults() {
            Map<String, String> defaults = new LinkedHashMap<>();
            if (list == null || list.isEmpty()) {
                return defaults;
            }

            for (Placeholder placeholder : list) {
                if (placeholder == null) {
                    continue;
                }

                String name = placeholder.getName();
                if (name == null) {
                    continue;
                }

                if (defaults.containsKey(name)) {
                    throw new IllegalStateException("Duplicate placeholder name: " + name);
                }

                defaults.put(name, placeholder.getValue());
            }

            return defaults;
        }

        public String getStartPattern() {

            return this.startPattern;
        }

        public String getEndPattern() {

            return this.endPattern;
        }

        public List<Placeholder> getList() {

            return this.list;
        }

        public void setStartPattern(String startPattern) {

            this.startPattern = startPattern;
        }

        public void setEndPattern(String endPattern) {

            this.endPattern = endPattern;
        }

        public void setList(List<Placeholder> list) {

            this.list = list;
        }

        public boolean equals(final Object o) {

            if (o == this)
                return true;
            if (!(o instanceof Placeholders))
                return false;
            final Placeholders other = (Placeholders) o;
            if (!other.canEqual((Object) this))
                return false;
            final Object this$startPattern = this.getStartPattern();
            final Object other$startPattern = other.getStartPattern();
            if (this$startPattern == null ? other$startPattern != null : !this$startPattern.equals(other$startPattern))
                return false;
            final Object this$endPattern = this.getEndPattern();
            final Object other$endPattern = other.getEndPattern();
            if (this$endPattern == null ? other$endPattern != null : !this$endPattern.equals(other$endPattern))
                return false;
            final Object this$list = this.getList();
            final Object other$list = other.getList();
            if (this$list == null ? other$list != null : !this$list.equals(other$list))
                return false;
            return true;
        }

        protected boolean canEqual(final Object other) {

            return other instanceof Placeholders;
        }

        public int hashCode() {

            final int PRIME = 59;
            int result = 1;
            final Object $startPattern = this.getStartPattern();
            result = result * PRIME + ($startPattern == null ? 43 : $startPattern.hashCode());
            final Object $endPattern = this.getEndPattern();
            result = result * PRIME + ($endPattern == null ? 43 : $endPattern.hashCode());
            final Object $list = this.getList();
            result = result * PRIME + ($list == null ? 43 : $list.hashCode());
            return result;
        }

        public String toString() {

            return "PromptSpec.Placeholders(startPattern=" + this.getStartPattern() + ", endPattern=" + this.getEndPattern() + ", list=" + this.getList() + ")";
        }
    }

    @Schema(description = "Placeholder entry containing name/value pair")
    public static class Placeholder {
        private String name;
        private String value;

        public Placeholder() {

        }

        public Placeholder(String name, String value) {
            this.name = name;
            this.value = value;
        }

        public String getName() {

            return this.name;
        }

        public String getValue() {

            return this.value;
        }

        public void setName(String name) {

            this.name = name;
        }

        public void setValue(String value) {

            this.value = value;
        }

        public boolean equals(final Object o) {

            if (o == this)
                return true;
            if (!(o instanceof Placeholder))
                return false;
            final Placeholder other = (Placeholder) o;
            if (!other.canEqual((Object) this))
                return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name))
                return false;
            final Object this$value = this.getValue();
            final Object other$value = other.getValue();
            if (this$value == null ? other$value != null : !this$value.equals(other$value))
                return false;
            return true;
        }

        protected boolean canEqual(final Object other) {

            return other instanceof Placeholder;
        }

        public int hashCode() {

            final int PRIME = 59;
            int result = 1;
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $value = this.getValue();
            result = result * PRIME + ($value == null ? 43 : $value.hashCode());
            return result;
        }

        public String toString() {

            return "PromptSpec.Placeholder(name=" + this.getName() + ", value=" + this.getValue() + ")";
        }
    }
}
