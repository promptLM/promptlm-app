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

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;


public class CreateStoreRequest {
    @NotNull
    private String repoDir;
    @NotNull
    private String repoName;
    private String repoGroup;
    private String description;
    private List<Message> messages;
    private Map<String, String> placeholders;

    public CreateStoreRequest() {

    }

    public List<Message> getMessages() {

        return messages;
    }

    public Map<String, String> getPlaceholders() {

        return placeholders;
    }

    public void setPlaceholders(Map<String, String> placeholders) {

        this.placeholders = placeholders;
    }

    public String getRepoDir() {

        return this.repoDir;
    }

    public String getRepoName() {

        return this.repoName;
    }

    public String getRepoGroup() {
        return this.repoGroup;
    }

    public String getDescription() {
        return description;
    }

    public void setRepoDir(String repoDir) {

        this.repoDir = repoDir;
    }

    public void setRepoName(String repoName) {

        this.repoName = repoName;
    }

    public void setRepoGroup(String repoGroup) {

        this.repoGroup = repoGroup;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setMessages(List<Message> messages) {

        this.messages = messages;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof CreateStoreRequest))
            return false;
        final CreateStoreRequest other = (CreateStoreRequest) o;
        if (!other.canEqual((Object) this))
            return false;
        final Object this$repoDir = this.getRepoDir();
        final Object other$repoDir = other.getRepoDir();
        if (this$repoDir == null ? other$repoDir != null : !this$repoDir.equals(other$repoDir))
            return false;
        final Object this$repoName = this.getRepoName();
        final Object other$repoName = other.getRepoName();
        if (this$repoName == null ? other$repoName != null : !this$repoName.equals(other$repoName))
            return false;
        final Object this$repoGroup = this.getRepoGroup();
        final Object other$repoGroup = other.getRepoGroup();
        if (this$repoGroup == null ? other$repoGroup != null : !this$repoGroup.equals(other$repoGroup))
            return false;
        final Object this$messages = this.getMessages();
        final Object other$messages = other.getMessages();
        if (this$messages == null ? other$messages != null : !this$messages.equals(other$messages))
            return false;
        final Object this$placeholders = this.getPlaceholders();
        final Object other$placeholders = other.getPlaceholders();
        if (this$placeholders == null ? other$placeholders != null : !this$placeholders.equals(other$placeholders))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof CreateStoreRequest;
    }

    public int hashCode() {

        final int PRIME = 59;
        int result = 1;
        final Object $repoDir = this.getRepoDir();
        result = result * PRIME + ($repoDir == null ? 43 : $repoDir.hashCode());
        final Object $repoName = this.getRepoName();
        result = result * PRIME + ($repoName == null ? 43 : $repoName.hashCode());
        final Object $repoGroup = this.getRepoGroup();
        result = result * PRIME + ($repoGroup == null ? 43 : $repoGroup.hashCode());
        final Object $messages = this.getMessages();
        result = result * PRIME + ($messages == null ? 43 : $messages.hashCode());
        final Object $placeholders = this.getPlaceholders();
        result = result * PRIME + ($placeholders == null ? 43 : $placeholders.hashCode());
        return result;
    }

    public String toString() {

        return "CreateStoreRequest(repoDir=" + this.getRepoDir() + ", repoName=" + this.getRepoName() + ", repoGroup=" + this.getRepoGroup() + ", messages=" + this.getMessages() + ", placeholders=" + this.getPlaceholders() + ")";
    }
}
