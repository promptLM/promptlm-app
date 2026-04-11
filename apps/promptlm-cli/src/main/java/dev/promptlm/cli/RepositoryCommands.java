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
import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import dev.promptlm.infrastructure.config.SerializingAppContext;
import dev.promptlm.store.api.ProjectService;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.shell.core.command.annotation.Option;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.InvalidPathException;

/**
 * Spring Shell commands for managing promptLM repositories.
 * Provides {@code repo create}, {@code repo clone}, and {@code repo use} commands.
 */
@Component
public class RepositoryCommands {

    private final ProjectService projectService;
    private final SerializingAppContext context;

    public RepositoryCommands(ProjectService projectService,
                              SerializingAppContext context) {
        this.projectService = projectService;
        this.context = context;
    }

    @Command(name = "repo create")
    public String createRepository(
            @Option(longName = "dir", required = true) String repoDir,
            @Option(longName = "name", required = true, description = "Repository name in format <owner>/<repo>, for example 'promptlm/promptlm-app'") String name
    ) {
        ProjectSpec response = null;
        try {
            RepositoryCoordinates coordinates = parseRepositoryName(name);
            response = projectService.newProject(parsePath(repoDir, "dir"), coordinates.owner(), coordinates.repo());
            context.setActiveProject(response);
            return "created repository %s remote: %s".formatted(response.getLocalPath(), response.getRepositoryUrl());
        } catch (RemoteRepositoryAlreadyExistsException e) {
            return "Remote repository '%s' already exists".formatted(e.getBaseUrl() + "/" + e.getRepositoryName());
        }
    }

    @Command(name = "repo clone")
    public String cloneRepository(
            @Option(longName = "repo", required = true, description = "The url of the remote Git store to clone") String repoUrl,
            @Option(longName = "target", required = true, description = "The dir into which the store will be cloned") String targetDir
    ) {
        ProjectSpec repoPath = projectService.importProject(repoUrl, parsePath(targetDir, "target"));
        return use(repoPath.getRepoDir().toString());
    }

    @Command(name = "repo use")
    public String use(
            @Option(longName = "path", required = true) String path
    ) {
        Path repoPath = parsePath(path, "path").toAbsolutePath().normalize();
        try {
            projectService.switchProject(repoPath);
            return "using repo %s now".formatted(repoPath);
        } catch (Exception e) {
            return "%s is not a valid promptlm repo".formatted(repoPath);
        }
    }

    private static Path parsePath(String value, String optionName) {
        try {
            return Path.of(value);
        } catch (InvalidPathException ex) {
            throw new IllegalArgumentException("Option '--%s' contains an invalid path: %s".formatted(optionName, value));
        }
    }

    private static RepositoryCoordinates parseRepositoryName(String value) {
        String normalized = value == null ? "" : value.trim();
        int firstSlash = normalized.indexOf('/');
        int lastSlash = normalized.lastIndexOf('/');
        if (firstSlash <= 0 || firstSlash != lastSlash || firstSlash == normalized.length() - 1) {
            throw invalidRepositoryName(value);
        }

        String owner = normalized.substring(0, firstSlash);
        String repo = normalized.substring(firstSlash + 1);
        if (owner.isBlank() || repo.isBlank()) {
            throw invalidRepositoryName(value);
        }
        if (owner.contains(" ") || repo.contains(" ")) {
            throw new IllegalArgumentException("Option '--name' must not contain spaces. Expected '<owner>/<repo>', for example 'promptlm/promptlm-app'.");
        }
        return new RepositoryCoordinates(owner, repo);
    }

    private static IllegalArgumentException invalidRepositoryName(String value) {
        return new IllegalArgumentException("Invalid value for option '--name': '%s'. Expected '<owner>/<repo>', for example 'promptlm/promptlm-app'."
                .formatted(value));
    }

    private record RepositoryCoordinates(String owner, String repo) {
    }

}
