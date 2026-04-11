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

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalWorkspacePathPolicyTest {

    @Test
    void shouldNormalizeAndAcceptPathWithinWorkspace(@TempDir Path tempDir) {
        StoreLocalProperties properties = new StoreLocalProperties();
        properties.setWorkspaceRoot(tempDir);
        LocalWorkspacePathPolicy policy = new LocalWorkspacePathPolicy(properties);

        Path normalized = policy.assertWithinWorkspace(
                tempDir.resolve("projects").resolve("..").resolve("projects").resolve("repo"),
                "repoDir"
        );

        assertThat(normalized).isEqualTo(tempDir.resolve("projects/repo").toAbsolutePath().normalize());
    }

    @Test
    void shouldRejectPathOutsideWorkspace(@TempDir Path tempDir) {
        StoreLocalProperties properties = new StoreLocalProperties();
        properties.setWorkspaceRoot(tempDir);
        LocalWorkspacePathPolicy policy = new LocalWorkspacePathPolicy(properties);

        assertThatThrownBy(() -> policy.assertWithinWorkspace(Path.of("/tmp/outside"), "repoDir"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repoDir must be located under workspace root");
    }
}
