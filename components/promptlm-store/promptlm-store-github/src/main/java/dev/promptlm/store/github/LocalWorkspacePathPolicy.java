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

package dev.promptlm.store.github;

import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
class LocalWorkspacePathPolicy {

    private final StoreLocalProperties storeLocalProperties;

    LocalWorkspacePathPolicy(StoreLocalProperties storeLocalProperties) {
        this.storeLocalProperties = storeLocalProperties;
    }

    public Path assertWithinWorkspace(Path candidatePath, String fieldName) {
        if (candidatePath == null) {
            throw new IllegalArgumentException(fieldName + " must not be null");
        }

        Path workspaceRoot = resolveWorkspaceRoot();
        Path normalizedCandidate = candidatePath.toAbsolutePath().normalize();
        if (!normalizedCandidate.startsWith(workspaceRoot)) {
            throw new IllegalArgumentException(
                    "%s must be located under workspace root %s, but was %s"
                            .formatted(fieldName, workspaceRoot, normalizedCandidate)
            );
        }

        return normalizedCandidate;
    }

    private Path resolveWorkspaceRoot() {
        Path workspaceRoot = storeLocalProperties.getWorkspaceRoot();
        if (workspaceRoot == null) {
            throw new IllegalStateException("promptlm.store.local.workspace-root must be configured");
        }
        return workspaceRoot.toAbsolutePath().normalize();
    }
}
