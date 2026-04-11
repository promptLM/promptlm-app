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

import java.nio.file.Path;
import io.swagger.v3.oas.annotations.media.Schema;

public class ConnectRepositoryRequest {
    @Schema(type = "string", description = "Absolute path to the repository on disk")
    private Path repoPath;
    private String displayName;

    public ConnectRepositoryRequest() {

    }

    public Path getRepoPath() {
        return repoPath;
    }

    public void setRepoPath(Path repoPath) {
        this.repoPath = repoPath;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}
