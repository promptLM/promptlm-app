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

package dev.promptlm.domain;

import dev.promptlm.domain.projectspec.ProjectSpec;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class BasicAppContextTest {

    @Test
    void addProjectReplacesExistingProjectWithSameRepositoryPath() {
        BasicAppContext context = new BasicAppContext();

        ProjectSpec first = new ProjectSpec();
        first.setName("first");
        first.setRepoDir(Path.of("/tmp/repo-a"));
        context.addProject(first);

        ProjectSpec replacement = new ProjectSpec();
        replacement.setName("replacement");
        replacement.setRepoDir(Path.of("/tmp/repo-a/."));
        context.addProject(replacement);

        assertThat(context.getProjects()).hasSize(1);
        assertThat(context.getProjects().get(0)).isSameAs(replacement);
    }

    @Test
    void setActiveProjectDoesNotCreateDuplicateForSameRepositoryPath() {
        BasicAppContext context = new BasicAppContext();

        ProjectSpec first = new ProjectSpec();
        first.setName("first");
        first.setRepoDir(Path.of("/tmp/repo-b"));
        context.setActiveProject(first);

        ProjectSpec replacement = new ProjectSpec();
        replacement.setName("replacement");
        replacement.setRepoDir(Path.of("/tmp/repo-b/."));
        context.setActiveProject(replacement);

        assertThat(context.getProjects()).hasSize(1);
        assertThat(context.getActiveProject()).isSameAs(replacement);
    }
}
