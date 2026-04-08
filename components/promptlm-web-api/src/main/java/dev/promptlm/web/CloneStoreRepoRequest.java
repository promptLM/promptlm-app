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

import io.swagger.v3.oas.annotations.media.Schema;
import java.net.URI;
import java.nio.file.Path;

public class CloneStoreRepoRequest {
    private String name;
    @Schema(type = "string", description = "Client-generated operation identifier for store status events")
    private String operationId;
    @Schema(type = "string", description = "Target directory for cloning the repository")
    private Path targetDir;
    private URI remoteUrl;

    public CloneStoreRepoRequest() {

    }

    public String getName() {

        return this.name;
    }

    public String getOperationId() {

        return this.operationId;
    }

    public Path getTargetDir() {

        return this.targetDir;
    }

    public URI getRemoteUrl() {

        return this.remoteUrl;
    }

    public void setName(String name) {

        this.name = name;
    }

    public void setOperationId(String operationId) {

        this.operationId = operationId;
    }

    public void setTargetDir(Path targetDir) {

        this.targetDir = targetDir;
    }

    public void setRemoteUrl(URI remoteUrl) {

        this.remoteUrl = remoteUrl;
    }

    public boolean equals(final Object o) {

        if (o == this)
            return true;
        if (!(o instanceof CloneStoreRepoRequest))
            return false;
        final CloneStoreRepoRequest other = (CloneStoreRepoRequest) o;
        if (!other.canEqual((Object) this))
            return false;
        final Object this$name = this.getName();
        final Object other$name = other.getName();
        if (this$name == null ? other$name != null : !this$name.equals(other$name))
            return false;
        final Object this$operationId = this.getOperationId();
        final Object other$operationId = other.getOperationId();
        if (this$operationId == null ? other$operationId != null : !this$operationId.equals(other$operationId))
            return false;
        final Object this$targetDir = this.getTargetDir();
        final Object other$targetDir = other.getTargetDir();
        if (this$targetDir == null ? other$targetDir != null : !this$targetDir.equals(other$targetDir))
            return false;
        final Object this$remoteUrl = this.getRemoteUrl();
        final Object other$remoteUrl = other.getRemoteUrl();
        if (this$remoteUrl == null ? other$remoteUrl != null : !this$remoteUrl.equals(other$remoteUrl))
            return false;
        return true;
    }

    protected boolean canEqual(final Object other) {

        return other instanceof CloneStoreRepoRequest;
    }

    public int hashCode() {

        final int PRIME = 59;
        int result = 1;
        final Object $name = this.getName();
        result = result * PRIME + ($name == null ? 43 : $name.hashCode());
        final Object $operationId = this.getOperationId();
        result = result * PRIME + ($operationId == null ? 43 : $operationId.hashCode());
        final Object $targetDir = this.getTargetDir();
        result = result * PRIME + ($targetDir == null ? 43 : $targetDir.hashCode());
        final Object $remoteUrl = this.getRemoteUrl();
        result = result * PRIME + ($remoteUrl == null ? 43 : $remoteUrl.hashCode());
        return result;
    }

    public String toString() {

        return "CloneStoreRepoRequest(name=" + this.getName() + ", operationId=" + this.getOperationId() + ", targetDir=" + this.getTargetDir() + ", remoteUrl=" + this.getRemoteUrl() + ")";
    }
}
