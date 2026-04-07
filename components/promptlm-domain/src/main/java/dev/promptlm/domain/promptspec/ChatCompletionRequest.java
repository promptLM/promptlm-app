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

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import tools.jackson.core.JacksonException;
import dev.promptlm.domain.ObjectMapperFactory;
import io.swagger.v3.oas.annotations.media.Schema;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("chat/completion")
public class ChatCompletionRequest extends BaseRequest {
    public static final String TYPE = "chat/completion";

    @JsonProperty("vendor")
    private String vendor;

    @JsonProperty("model")
    private String model;

    @JsonProperty("url")
    private String url;

    @JsonProperty("type")
    private String type;

    @JsonProperty("model_snapshot")
    private String modelSnapshot;

    @JsonProperty("parameters")
    private Map<String, Object> parameters;

    @JsonProperty("messages")
    private List<Message> messages;

    public ChatCompletionRequest(String vendor, String model, String url, String type, String modelSnapshot, Map<String, Object> parameters, List<Message> messages) {

        this.vendor = vendor;
        this.model = model;
        this.url = url;
        this.type = type;
        this.modelSnapshot = modelSnapshot;
        this.parameters = parameters;
        this.messages = messages;
    }

    public ChatCompletionRequest() {

    }

    public static ChatCompletionRequestBuilder builder() {

        return new ChatCompletionRequestBuilder();
    }

    @Override
    public String renderBody() {
        try {
            return ObjectMapperFactory.createJsonMapper().writeValueAsString(this);
        }
        catch (JacksonException e) {
            throw new RuntimeException(e);
        }
    }

    public String getVendor() {

        return this.vendor;
    }

    public String getModel() {

        return this.model;
    }

    public String getUrl() {

        return this.url;
    }

    public String getType() {

        return this.type;
    }

    public String getModelSnapshot() {

        return this.modelSnapshot;
    }

    public Map<String, Object> getParameters() {

        return this.parameters;
    }

    public List<Message> getMessages() {

        return this.messages;
    }

    @JsonProperty("vendor")
    public void setVendor(String vendor) {

        this.vendor = vendor;
    }

    @JsonProperty("model")
    public void setModel(String model) {

        this.model = model;
    }

    @JsonProperty("url")
    public void setUrl(String url) {

        this.url = url;
    }

    @JsonProperty("type")
    @Schema(allowableValues = TYPE, example = TYPE)
    public void setType(String type) {

        this.type = type;
    }

    @JsonProperty("model_snapshot")
    public void setModelSnapshot(String modelSnapshot) {

        this.modelSnapshot = modelSnapshot;
    }

    @JsonProperty("parameters")
    public void setParameters(Map<String, Object> parameters) {

        this.parameters = parameters;
    }

    @JsonProperty("messages")
    public void setMessages(List<Message> messages) {

        this.messages = messages;
    }

    public ChatCompletionRequest withVendor(String vendor) {

        return this.vendor == vendor ? this : new ChatCompletionRequest(vendor, this.model, this.url, this.type, this.modelSnapshot, this.parameters, this.messages);
    }

    public ChatCompletionRequest withModel(String model) {

        return this.model == model ? this : new ChatCompletionRequest(this.vendor, model, this.url, this.type, this.modelSnapshot, this.parameters, this.messages);
    }

    public ChatCompletionRequest withUrl(String url) {

        return this.url == url ? this : new ChatCompletionRequest(this.vendor, this.model, url, this.type, this.modelSnapshot, this.parameters, this.messages);
    }

    public ChatCompletionRequest withType(String type) {

        return this.type == type ? this : new ChatCompletionRequest(this.vendor, this.model, this.url, type, this.modelSnapshot, this.parameters, this.messages);
    }

    public ChatCompletionRequest withModelSnapshot(String modelSnapshot) {

        return this.modelSnapshot == modelSnapshot ? this : new ChatCompletionRequest(this.vendor, this.model, this.url, this.type, modelSnapshot, this.parameters, this.messages);
    }

    public ChatCompletionRequest withMessages(List<Message> messages) {

        return this.messages == messages ? this : new ChatCompletionRequest(this.vendor, this.model, this.url, this.type, this.modelSnapshot, this.parameters, messages);
    }

    public static class Message {
        private String content;
        private String role;
        private String name;

        public Message(String content, String role, String name) {

            this.content = content;
            this.role = role;
            this.name = name;
        }

        public Message() {

        }

        public static MessageBuilder builder() {

            return new MessageBuilder();
        }

        public String getContent() {

            return this.content;
        }

        public String getRole() {

            return this.role;
        }

        public String getName() {

            return this.name;
        }

        public void setContent(String content) {

            this.content = content;
        }

        public void setRole(String role) {

            this.role = role;
        }

        public void setName(String name) {

            this.name = name;
        }

        public boolean equals(final Object o) {

            if (o == this)
                return true;
            if (!(o instanceof Message))
                return false;
            final Message other = (Message) o;
            if (!other.canEqual((Object) this))
                return false;
            final Object this$content = this.getContent();
            final Object other$content = other.getContent();
            if (this$content == null ? other$content != null : !this$content.equals(other$content))
                return false;
            final Object this$role = this.getRole();
            final Object other$role = other.getRole();
            if (this$role == null ? other$role != null : !this$role.equals(other$role))
                return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name))
                return false;
            return true;
        }

        protected boolean canEqual(final Object other) {

            return other instanceof Message;
        }

        public int hashCode() {

            final int PRIME = 59;
            int result = 1;
            final Object $content = this.getContent();
            result = result * PRIME + ($content == null ? 43 : $content.hashCode());
            final Object $role = this.getRole();
            result = result * PRIME + ($role == null ? 43 : $role.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            return result;
        }

        public String toString() {

            return "ChatCompletionRequest.Message(content=" + this.getContent() + ", role=" + this.getRole() + ", name=" + this.getName() + ")";
        }

        public Message withContent(String content) {

            return this.content == content ? this : new Message(content, this.role, this.name);
        }

        public Message withRole(String role) {

            return this.role == role ? this : new Message(this.content, role, this.name);
        }

        public Message withName(String name) {

            return this.name == name ? this : new Message(this.content, this.role, name);
        }

        public static class MessageBuilder {
            private String content;
            private String role;
            private String name;

            MessageBuilder() {

            }

            public MessageBuilder withContent(String content) {

                this.content = content;
                return this;
            }

            public MessageBuilder withRole(String role) {

                this.role = role;
                return this;
            }

            public MessageBuilder withName(String name) {

                this.name = name;
                return this;
            }

            public Message build() {

                return new Message(this.content, this.role, this.name);
            }

            public String toString() {

                return "ChatCompletionRequest.Message.MessageBuilder(content=" + this.content + ", role=" + this.role + ", name=" + this.name + ")";
            }
        }
    }

    public static class ChatCompletionRequestBuilder {
        private String vendor;
        private String model;
        private String url;
        private String type;
        private String modelSnapshot;
        private Map<String, Object> parameters;
        private List<Message> messages;

        ChatCompletionRequestBuilder() {

        }

        @JsonProperty("vendor")
        public ChatCompletionRequestBuilder withVendor(String vendor) {

            this.vendor = vendor;
            return this;
        }

        @JsonProperty("model")
        public ChatCompletionRequestBuilder withModel(String model) {

            this.model = model;
            return this;
        }

        @JsonProperty("url")
        public ChatCompletionRequestBuilder withUrl(String url) {

            this.url = url;
            return this;
        }

        @JsonProperty("type")
        public ChatCompletionRequestBuilder withType(String type) {

            this.type = type;
            return this;
        }

        @JsonProperty("model_snapshot")
        public ChatCompletionRequestBuilder withModelSnapshot(String modelSnapshot) {

            this.modelSnapshot = modelSnapshot;
            return this;
        }

        @JsonProperty("parameters")
        public ChatCompletionRequestBuilder withParameters(Map<String, Object> parameters) {

            this.parameters = parameters;
            return this;
        }

        @JsonProperty("messages")
        public ChatCompletionRequestBuilder withMessages(List<Message> messages) {

            this.messages = messages;
            return this;
        }

        public ChatCompletionRequest build() {

            return new ChatCompletionRequest(this.vendor, this.model, this.url, this.type, this.modelSnapshot, this.parameters, this.messages);
        }

        public String toString() {

            return "ChatCompletionRequest.ChatCompletionRequestBuilder(vendor=" + this.vendor + ", model=" + this.model + ", url=" + this.url + ", type=" + this.type + ", modelSnapshot=" + this.modelSnapshot + ", parameters=" + this.parameters + ", messages=" + this.messages + ")";
        }
    }
}
