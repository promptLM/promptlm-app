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

package dev.promptlm.domain.projectspec;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "Project specification for a prompt store repository")
public class ProjectSpec {
    private UUID id;

    @Schema(hidden = true)
    private String repoUrl;

    @Schema(hidden = true)
    private Path repoDir;

    @Schema(hidden = true)
    private String org;

    private String name;
    private String description;
    private ProjectHealthStatus healthStatus = ProjectHealthStatus.HEALTHY;
    private String healthMessage;

    @Schema(description = "Timestamp when the project was created", format = "date-time")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the project was last updated", format = "date-time")
    private LocalDateTime updatedAt;

    @Schema(description = "Number of prompt specs in this project")
    private Integer promptCount;

    public ProjectSpec() {

    }

    public static ProjectSpec fromRepo(Path repoPath) {
        ProjectSpec spec = new ProjectSpec();
        spec.setRepoDir(repoPath);
        spec.setName(repoPath.getFileName().toString());
        return spec;
    }

    public UUID getId() {

        return this.id;
    }

    @JsonProperty("repositoryUrl")
    @Schema(description = "Remote repository URL", example = "https://github.com/my-org/my-repo")
    public String getRepositoryUrl() {
        return this.repoUrl;
    }

    @JsonProperty("localPath")
    @Schema(description = "Local filesystem path where the repository is checked out", example = "/Users/me/repos/my-repo")
    public String getLocalPath() {
        return this.repoDir != null ? this.repoDir.toString() : null;
    }

    @JsonProperty("createdAt")
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @JsonProperty("updatedAt")
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @JsonProperty("promptCount")
    public Integer getPromptCount() {
        return promptCount;
    }

    @JsonIgnore
    public String getRepoUrl() {

        return this.repoUrl;
    }

    @JsonIgnore
    public Path getRepoDir() {

        return this.repoDir;
    }

    @JsonIgnore
    public String getOrg() {

        return this.org;
    }

    public String getName() {

        return this.name;
    }

    public String getDescription() {

        return this.description;
    }

    public ProjectHealthStatus getHealthStatus() {

        return this.healthStatus;
    }

    public String getHealthMessage() {

        return this.healthMessage;
    }

    public void setId(UUID id) {

        this.id = id;
    }

    public void setRepoUrl(String repoUrl) {

        this.repoUrl = repoUrl;
    }

    @JsonProperty("repositoryUrl")
    public void setRepositoryUrl(String repositoryUrl) {
        this.repoUrl = repositoryUrl;
    }

    @JsonProperty("repoDir")
    public void setRepoDir(Path repoDir) {

        this.repoDir = repoDir;
    }

    @JsonProperty("localPath")
    public void setLocalPath(String localPath) {
        this.repoDir = localPath != null ? Path.of(localPath) : null;
    }

    public void setOrg(String org) {

        this.org = org;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setPromptCount(Integer promptCount) {
        this.promptCount = promptCount;
    }

    public void setName(String name) {

        this.name = name;
    }

    public void setDescription(String description) {

        this.description = description;
    }

    public void setHealthStatus(ProjectHealthStatus healthStatus) {

        this.healthStatus = healthStatus;
    }

    public void setHealthMessage(String healthMessage) {

        this.healthMessage = healthMessage;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof ProjectSpec))
            return false;
        final ProjectSpec other = (ProjectSpec) o;
        if (!other.canEqual((Object) this))
            return false;
        final Object this$id = this.getId();
        final Object other$id = other.getId();
        if (this$id == null ? other$id != null : !this$id.equals(other$id))
            return false;
        final Object this$repoUrl = this.getRepoUrl();
        final Object other$repoUrl = other.getRepoUrl();
        if (this$repoUrl == null ? other$repoUrl != null : !this$repoUrl.equals(other$repoUrl))
            return false;
        final Object this$repoDir = this.getRepoDir();
        final Object other$repoDir = other.getRepoDir();
        if (this$repoDir == null ? other$repoDir != null : !this$repoDir.equals(other$repoDir))
            return false;
        final Object this$org = this.getOrg();
        final Object other$org = other.getOrg();
        if (this$org == null ? other$org != null : !this$org.equals(other$org))
            return false;
        final Object this$name = this.getName();
        final Object other$name = other.getName();
        if (this$name == null ? other$name != null : !this$name.equals(other$name))
            return false;
        final Object this$description = this.getDescription();
        final Object other$description = other.getDescription();
        if (this$description == null ? other$description != null : !this$description.equals(other$description))
            return false;
        final Object this$healthStatus = this.getHealthStatus();
        final Object other$healthStatus = other.getHealthStatus();
        if (this$healthStatus == null ? other$healthStatus != null : !this$healthStatus.equals(other$healthStatus))
            return false;
        final Object this$healthMessage = this.getHealthMessage();
        final Object other$healthMessage = other.getHealthMessage();
        if (this$healthMessage == null ? other$healthMessage != null : !this$healthMessage.equals(other$healthMessage))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof ProjectSpec;
    }

    public int hashCode() {

        final int PRIME = 59;
        int result = 1;
        final Object $id = this.getId();
        result = result * PRIME + ($id == null ? 43 : $id.hashCode());
        final Object $repoUrl = this.getRepoUrl();
        result = result * PRIME + ($repoUrl == null ? 43 : $repoUrl.hashCode());
        final Object $repoDir = this.getRepoDir();
        result = result * PRIME + ($repoDir == null ? 43 : $repoDir.hashCode());
        final Object $org = this.getOrg();
        result = result * PRIME + ($org == null ? 43 : $org.hashCode());
        final Object $name = this.getName();
        result = result * PRIME + ($name == null ? 43 : $name.hashCode());
        final Object $description = this.getDescription();
        result = result * PRIME + ($description == null ? 43 : $description.hashCode());
        final Object $healthStatus = this.getHealthStatus();
        result = result * PRIME + ($healthStatus == null ? 43 : $healthStatus.hashCode());
        final Object $healthMessage = this.getHealthMessage();
        result = result * PRIME + ($healthMessage == null ? 43 : $healthMessage.hashCode());
        return result;
    }

    public String toString() {

        return "ProjectSpec(id=" + this.getId() + ", repoUrl=" + this.getRepoUrl() + ", repoDir=" + this.getRepoDir() + ", org=" + this.getOrg() + ", name=" + this.getName() + ", description=" + this.getDescription() + ", healthStatus=" + this.getHealthStatus() + ", healthMessage=" + this.getHealthMessage() + ")";
    }
}
