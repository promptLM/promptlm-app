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
import org.springframework.beans.factory.ObjectProvider;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RepositoryCommandsTest {

    @Test
    void createRepositoryParsesOwnerAndRepoFromName() throws Exception {
        @SuppressWarnings("unchecked")
        ObjectProvider<ProjectService> projectServiceProvider = mock(ObjectProvider.class);
        ProjectService projectService = mock(ProjectService.class);
        when(projectServiceProvider.getIfAvailable()).thenReturn(projectService);

        @SuppressWarnings("unchecked")
        ObjectProvider<SerializingAppContext> contextProvider = mock(ObjectProvider.class);
        SerializingAppContext context = mock(SerializingAppContext.class);
        when(contextProvider.getIfAvailable()).thenReturn(context);

        ProjectSpec created = new ProjectSpec();
        when(projectService.newProject(Path.of("/tmp/repos"), "promptlm", "promptlm-app")).thenReturn(created);

        RepositoryCommands commands = new RepositoryCommands(projectServiceProvider, contextProvider);

        String result = commands.createRepository("/tmp/repos", "promptlm/promptlm-app");

        assertEquals("ok", result);
        verify(projectService).newProject(Path.of("/tmp/repos"), "promptlm", "promptlm-app");
        verify(context).setActiveProject(created);
    }

    @Test
    void createRepositoryRejectsInvalidNameFormat() throws Exception {
        @SuppressWarnings("unchecked")
        ObjectProvider<ProjectService> projectServiceProvider = mock(ObjectProvider.class);
        when(projectServiceProvider.getIfAvailable()).thenReturn(mock(ProjectService.class));

        @SuppressWarnings("unchecked")
        ObjectProvider<SerializingAppContext> contextProvider = mock(ObjectProvider.class);
        when(contextProvider.getIfAvailable()).thenReturn(mock(SerializingAppContext.class));

        RepositoryCommands commands = new RepositoryCommands(projectServiceProvider, contextProvider);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> commands.createRepository("/tmp/repos", "promptlm"));

        assertTrue(ex.getMessage().contains("--name"));
        assertTrue(ex.getMessage().contains("<owner>/<repo>"));
    }
}
