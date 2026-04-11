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

import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Schema(description = "Request payload for creating or updating a prompt specification")
public class PromptSpecCreationRequest {
    @Schema(description = "Unique identifier of the prompt being created or updated", example = "support_welcome")
    private String id;

    @Schema(description = "Human-readable name of the prompt", example = "support_welcome", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank
    private String name;

    @Schema(description = "Grouping label for the prompt", example = "support", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank
    private String group;

    @Schema(description = "Functional description of the prompt")
    private String description;

    @Schema(description = "Default placeholder values keyed by placeholder name", additionalProperties = Schema.AdditionalPropertiesValue.TRUE, example = "{\"customer_name\":\"Alice\"}")
    private Map<String, String> placeholder = new HashMap<>();

    @Schema(description = "Opening delimiter for placeholders", example = "{{")
    private String placeholderStartPattern;

    @Schema(description = "Closing delimiter for placeholders", example = "}}")
    private String placeholderEndPattern;

    @Schema(description = "User-facing template copy rendered in the UI")
    private String userMessage;

    @Schema(description = "Type of the prompt request", example = "chat/completion")
    private String type;

    @Schema(description = "LLM request configuration", implementation = PromptSpecCreationRequest.Request.class)
    private Request request;

    @Schema(description = "Primary vendor and model selection", implementation = VendorAndModel.class)
    private VendorAndModel vendorAndModel;

    @Schema(description = "Source repository URL containing the prompt definition", example = "https://github.com/my-org/prompts")
    private String gitHubRepo;

    @ArraySchema(arraySchema = @Schema(description = "Conversation messages that make up the prompt"), schema = @Schema(implementation = Message.class))
    private List<Message>  messages = new ArrayList<>();

    @Schema(description = "Semantic version of the prompt draft", example = "1.0.0")
    private String version;

    @Schema(description = "Custom extension payloads keyed by x-*", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    private Map<String, JsonNode> extensions = new HashMap<>();

    public Request getRequest() {
        return request;
    }

    public void setRequest(Request request) {
        this.request = request;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGroup() {
        return group;
    }

    public void setGroup(String group) {
        this.group = group;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, String> getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(Map<String, String> placeholder) {
        this.placeholder = placeholder;
    }

    public String getPlaceholderStartPattern() {
        return placeholderStartPattern;
    }

    public void setPlaceholderStartPattern(String placeholderStartPattern) {
        this.placeholderStartPattern = placeholderStartPattern;
    }

    public String getPlaceholderEndPattern() {
        return placeholderEndPattern;
    }

    public void setPlaceholderEndPattern(String placeholderEndPattern) {
        this.placeholderEndPattern = placeholderEndPattern;
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public VendorAndModel getVendorAndModel() {
        return vendorAndModel;
    }

    public void setVendorAndModel(VendorAndModel vendorAndModel) {
        this.vendorAndModel = vendorAndModel;
    }

    @JsonProperty("repositoryUrl")
    public String getGitHubRepo() {
        return gitHubRepo;
    }

    @JsonProperty("repositoryUrl")
    public void setGitHubRepo(String gitHubRepo) {
        this.gitHubRepo = gitHubRepo;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    public String getVersion() {
        return this.version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Map<String, JsonNode> getExtensions() {
        return extensions;
    }

    public void setExtensions(Map<String, JsonNode> extensions) {
        this.extensions = extensions;
    }

    @Schema(name = "PromptSpecRequest", description = "LLM request payload and runtime parameters")
    public static class Request {
        @Schema(description = "Type discriminator for the request", example = "chat/completion")
        private String type;

        @Schema(description = "LLM vendor identifier", example = "openai")
        private String vendor;

        @Schema(description = "Model name to execute", example = "gpt-4o-mini")
        private String model;

        @Schema(description = "Optional override endpoint for the vendor")
        private String url;

        @JsonProperty("model_snapshot")
        @Schema(description = "Specific snapshot or version of the model to target", example = "2024-05-01")
        private String modelSnapshot;

        @Schema(description = "Fine-tuning parameters for model execution", implementation = PromptSpecCreationRequest.Parameters.class)
        private Parameters parameters = new Parameters();

        @ArraySchema(arraySchema = @Schema(description = "Ordered conversation history supplied to the LLM"), schema = @Schema(implementation = Message.class))
        private List<Message> messages = new ArrayList<>();

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getVendor() {
            return vendor;
        }

        public void setVendor(String vendor) {
            this.vendor = vendor;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getModelSnapshot() {
            return modelSnapshot;
        }

        public void setModelSnapshot(String modelSnapshot) {
            this.modelSnapshot = modelSnapshot;
        }

        public Parameters getParameters() {
            return parameters;
        }

        public void setParameters(Parameters parameters) {
            this.parameters = parameters;
        }

        public List<Message> getMessages() {
            return messages;
        }

        public void setMessages(List<Message> messages) {
            this.messages = messages;
        }
    }

    @Schema(name = "PromptSpecRequestParameters", description = "Fine-grained model inference controls")
    public static class Parameters {
        @Schema(description = "Sampling temperature", minimum = "0", maximum = "2")
        private Double temperature;
        @Schema(description = "Top-p nucleus sampling parameter", minimum = "0", maximum = "1")
        private Double topP;
        @Schema(description = "Maximum number of tokens to generate", minimum = "1")
        private Integer maxTokens;
        @Schema(description = "Penalty for repeated tokens", minimum = "0", maximum = "2")
        private Double frequencyPenalty;
        @Schema(description = "Penalty for introducing new topics", minimum = "0", maximum = "2")
        private Double presencePenalty;
        @Schema(description = "Whether to stream partial responses as they are generated")
        private Boolean stream;

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public Double getTopP() {
            return topP;
        }

        public void setTopP(Double topP) {
            this.topP = topP;
        }

        public Integer getMaxTokens() {
            return maxTokens;
        }

        public void setMaxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
        }

        public Double getFrequencyPenalty() {
            return frequencyPenalty;
        }

        public void setFrequencyPenalty(Double frequencyPenalty) {
            this.frequencyPenalty = frequencyPenalty;
        }

        public Double getPresencePenalty() {
            return presencePenalty;
        }

        public void setPresencePenalty(Double presencePenalty) {
            this.presencePenalty = presencePenalty;
        }

        public Boolean getStream() {
            return stream;
        }

        public void setStream(Boolean stream) {
            this.stream = stream;
        }
    }
}
