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

package dev.promptlm.cli;

import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.infrastructure.config.SerializingAppContext;
import dev.promptlm.store.api.ProjectService;
import org.junit.jupiter.api.Test;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RepositoryCommandsTest {

    /**
     * Verifies that {@code repo create} correctly splits the {@code --name} option
     * into owner and repository and delegates to {@link ProjectService#newProject}.
     */
    @Test
    void createRepositoryParsesOwnerAndRepoFromName() throws Exception {
        ProjectService projectService = mock(ProjectService.class);
        SerializingAppContext context = mock(SerializingAppContext.class);

        ProjectSpec created = new ProjectSpec();
        created.setRepositoryUrl("https://github.com/promptlm/promptlm-app.git");
        created.setLocalPath("/tmp/repos/promptlm-app");
        when(projectService.newProject(Path.of("/tmp/repos"), "promptlm", "promptlm-app")).thenReturn(created);

        RepositoryCommands commands = new RepositoryCommands(projectService, context);

        String result = commands.createRepository("/tmp/repos", "promptlm/promptlm-app");

        assertEquals("created repository /tmp/repos/promptlm-app remote: https://github.com/promptlm/promptlm-app.git", result);
        verify(projectService).newProject(Path.of("/tmp/repos"), "promptlm", "promptlm-app");
        verify(context).setActiveProject(created);
    }

    /**
     * Verifies that {@code repo create} rejects a {@code --name} value that does
     * not follow the {@code <owner>/<repo>} format.
     */
    @Test
    void createRepositoryRejectsInvalidNameFormat() throws Exception {
        RepositoryCommands commands = new RepositoryCommands(
                mock(ProjectService.class), mock(SerializingAppContext.class));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> commands.createRepository("/tmp/repos", "promptlm"));

        assertTrue(ex.getMessage().contains("--name"));
        assertTrue(ex.getMessage().contains("<owner>/<repo>"));
    }
}
