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

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import dev.promptlm.infrastructure.config.SerializingAppContext;
import dev.promptlm.store.api.ProjectService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.shell.core.command.annotation.Option;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

/**
 * Spring Shell commands for managing promptLM repositories.
 * Provides {@code repo create}, {@code repo clone}, and {@code repo use} commands.
 */
@Component
public class RepositoryCommands {

    private final ObjectProvider<ProjectService> projectServiceProvider;
    private final ObjectProvider<SerializingAppContext> contextProvider;

    public RepositoryCommands(ObjectProvider<ProjectService> projectServiceProvider,
                              ObjectProvider<SerializingAppContext> contextProvider) {
        this.projectServiceProvider = projectServiceProvider;
        this.contextProvider = contextProvider;
    }

    @Command(name = "repo create")
    public String createRepository(
            @Option(longName = "dir", required = true) Path repoDir,
            @Option(longName = "name", required = true) String name
    ) {
        ProjectSpec response = null;
        try {
            String[] split = name.split("/");
            String owner = split[0];
            String repo = split[1];
            response = projectService().newProject(repoDir, owner, repo);
            context().setActiveProject(response);
            return "ok";
        } catch (RemoteRepositoryAlreadyExistsException e) {
            return "Remote repository '%s' already exists".formatted(e.getBaseUrl() + "/" + e.getRepositoryName());
        }
    }

    @Command(name = "repo clone")
    public String cloneRepository(
            @Option(longName = "repo", required = true, description = "The url of the remote Git store to clone") String repoUrl,
            @Option(longName = "target", required = true, description = "The dir into which the store will be cloned") Path targetDir
    ) {
        ProjectSpec repoPath = projectService().importProject(repoUrl, targetDir);
        return use(repoPath.getRepoDir());
    }

    @Command(name = "repo use")
    public String use(
            @Option(longName = "path", required = true) Path path
    ) {
        Path repoPath = path.toAbsolutePath().normalize();
        try {
            projectService().switchProject(repoPath);
            return "using repo %s now".formatted(repoPath);
        } catch (Exception e) {
            return "%s is not a valid promptlm repo".formatted(repoPath);
        }
    }

    private ProjectService projectService() {
        ProjectService projectService = projectServiceProvider.getIfAvailable();
        if (projectService != null) {
            return projectService;
        }
        throw new IllegalStateException("The requested repository command is unavailable because the project service is not configured in this CLI runtime.");
    }

    private AppContext context() {
        AppContext context = contextProvider.getIfAvailable();
        if (context != null) {
            return context;
        }
        throw new IllegalStateException("The requested repository command is unavailable because the CLI context is not configured in this CLI runtime.");
    }
}
