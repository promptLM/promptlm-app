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

package dev.promptlm.infrastructure.config;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.projectspec.ProjectHealthStatus;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.events.ProjectCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Spring bean initializing and holding the {@link BasicAppContext}.
 * <p>
 * The {@link BasicAppContext} is kept in a hidden file and synced on application start and shutdown.
 */
@Component
public class SerializingAppContext implements AppContext, InitializingBean, DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(SerializingAppContext.class);
    private AppContext configData = new ChangeAwareBasicAppContext(this::serialize);
    private final ObjectMapper objectMapper;
    public Path CONTEXT_FILE = getContextFilePath();
    private boolean serializationInProgress = false;

    public SerializingAppContext(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static Path getContextFilePath() {
        return Path.of(System.getProperty("user.home")).resolve(".promptlm/context.json");
    }

    @Override
    public List<ProjectSpec> getProjects() {
        return configData.getProjects();
    }

    @Override
    public void setProjects(List<ProjectSpec> projects) {
        configData.setProjects(projects);
    }

    @Override
    public ProjectSpec getActiveProject() {
        return configData.getActiveProject();
    }

    @Override
    public void setActiveProject(ProjectSpec activeProject) {
        if (activeProject != null) {
            Path repoDir = activeProject.getRepoDir();
            if (repoDir != null && Files.notExists(repoDir)) {
                throw new IllegalArgumentException("Repository directory %s does not exist".formatted(repoDir));
            }
        }
        configData.setActiveProject(activeProject);
    }

    @Override
    public void addProject(ProjectSpec projectSpec) {
        configData.addProject(projectSpec);
    }

    @Override
    public void destroy() throws Exception {

        serialize();
    }

    @EventListener(ProjectCreatedEvent.class)
    void onProjectCreated(ProjectCreatedEvent event) {
        serialize();
    }

    private synchronized void serialize() {
        if (serializationInProgress) {
            return;
        }
        serializationInProgress = true;
        log.debug("Serializing Context serializes...");
        try {
            if (!Files.exists(getUserConfigPath())) {
                log.debug("Create config path: " + getUserConfigPath());
                Files.createDirectories(getUserConfigPath());
            }
            Path contextFile = getUserConfigPath().resolve(CONTEXT_FILE);
            try (Writer writer = Files.newBufferedWriter(contextFile)) {
                ensureIdentifiers();
                objectMapper.writeValue(writer, toWireFormat(this.configData));
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
            serializationInProgress = false;
        }
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        deserialize();
    }

    private void deserialize() {
        Path configPath = getUserConfigPath();
        Path appDataFile = configPath.resolve(CONTEXT_FILE);
        try {
            createIfNotExists(configPath);
            log.debug("Created dir: " + configPath.toAbsolutePath());
            if (Files.notExists(appDataFile) || Files.readString(appDataFile).isBlank()) {
                createDefaultConfig(appDataFile);
            } else {
                this.configData = readFromTree(appDataFile);
                validateLoadedProjects();
            }
            ensureIdentifiers();
            serialize();
        } catch (IOException e) {
            throw  new RuntimeException("Could not deserialize app context from %s".formatted(appDataFile), e);
        }
    }

    /**
     * Builds the wire-format document written to {@code context.json}: the full project list is kept,
     * but {@code activeProject} is reduced to a reference object containing only the {@code id}.
     */
    private static Map<String, Object> toWireFormat(AppContext source) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("projects", source.getProjects());
        ProjectSpec activeProject = source.getActiveProject();
        if (activeProject == null || activeProject.getId() == null) {
            document.put("activeProject", null);
        } else {
            document.put("activeProject", Map.of("id", activeProject.getId()));
        }
        return document;
    }

    /**
     * Reads {@code context.json} via the Jackson tree API. The {@code activeProject} field is
     * expected as an id-only reference object ({@code {"id": "<uuid>"}}) that points at an entry
     * in {@code projects[]}. The resulting {@link BasicAppContext} has an {@code activeProject}
     * that is identity-equal to the matching entry in its projects list.
     */
    private BasicAppContext readFromTree(Path appDataFile) throws IOException {
        JsonNode root = objectMapper.readTree(appDataFile.toFile());
        BasicAppContext loaded = new BasicAppContext();

        JsonNode projectsNode = root.get("projects");
        if (projectsNode != null && !projectsNode.isNull()) {
            List<ProjectSpec> projects = new ArrayList<>();
            for (JsonNode projectNode : projectsNode) {
                ProjectSpec project = objectMapper.treeToValue(projectNode, ProjectSpec.class);
                if (project != null) {
                    projects.add(project);
                }
            }
            loaded.setProjects(projects);
        }

        JsonNode activeNode = root.get("activeProject");
        if (activeNode == null || activeNode.isNull()) {
            return loaded;
        }

        UUID activeId = parseActiveId(activeNode);
        ProjectSpec resolved = resolveProjectById(activeId, loaded.getProjects());
        if (resolved != null) {
            loaded.setActiveProject(resolved);
        }
        return loaded;
    }

    private static UUID parseActiveId(JsonNode activeNode) {
        JsonNode idNode = activeNode.get("id");
        if (idNode == null || idNode.isNull()) {
            return null;
        }
        return UUID.fromString(idNode.asText());
    }

    private static ProjectSpec resolveProjectById(UUID id, List<ProjectSpec> projects) {
        if (id == null || projects == null) {
            return null;
        }
        for (ProjectSpec project : projects) {
            if (project != null && id.equals(project.getId())) {
                return project;
            }
        }
        return null;
    }

    private static void createDefaultConfig(Path appDataFile) {
        try {
            Files.writeString(appDataFile, """
                    {
                        "projects":[],
                        "activeProject":null
                    }
                    """);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static void createIfNotExists(Path configPath) {
        if (!Files.exists(configPath)) {
            try {
                Files.createDirectories(configPath);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private void validateLoadedProjects() {
        if (configData == null) {
            return;
        }

        List<ProjectSpec> projects = configData.getProjects();
        if (projects != null) {
            for (ProjectSpec project : projects) {
                validateProject(project);
            }
        }

        ProjectSpec activeProject = configData.getActiveProject();
        validateProject(activeProject);
        if (activeProject != null && activeProject.getHealthStatus() == ProjectHealthStatus.BROKEN_LOCAL) {
            // Keep the broken project visible in project listings, but do not keep an invalid active selection.
            configData.addProject(activeProject);
            configData.setActiveProject(null);
        }
    }

    private void validateProject(ProjectSpec project) {
        if (project == null) {
            return;
        }
        Path repoDir = normalizeRepoDir(project.getRepoDir());
        if (repoDir != null && !repoDir.equals(project.getRepoDir())) {
            project.setRepoDir(repoDir);
        }
        if (repoDir != null) {
            try {
                if (Files.notExists(repoDir)) {
                    log.debug("Local repository does not exist: {}", repoDir);
                    project.setHealthStatus(ProjectHealthStatus.BROKEN_LOCAL);
                    project.setHealthMessage("Local repository missing at \"%s\"".formatted(repoDir.toAbsolutePath()));
                }
            } catch (Exception ex) {
                log.warn("Unable to inspect local repository {}", repoDir, ex);
                project.setHealthStatus(ProjectHealthStatus.BROKEN_LOCAL);
                project.setHealthMessage("Unable to access local repository: " + ex.getMessage());
            }
        }
        if (project.getHealthStatus() == null || project.getHealthStatus() == ProjectHealthStatus.HEALTHY) {
            project.setHealthStatus(ProjectHealthStatus.HEALTHY);
            project.setHealthMessage(null);
        }
        ensureProjectId(project);
    }

    public Path getUserConfigPath() {
        return CONTEXT_FILE.getParent();
    }

    private void ensureIdentifiers() {
        if (configData == null) {
            return;
        }
        List<ProjectSpec> projects = configData.getProjects();
        if (projects != null) {
            List<ProjectSpec> sanitized = projects.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toCollection(ArrayList::new));
            List<ProjectSpec> deduplicated = new ArrayList<>();
            for (ProjectSpec project : sanitized) {
                ensureProjectId(project);
                if (deduplicated.stream().noneMatch(existing -> isSameProject(existing, project))) {
                    deduplicated.add(project);
                }
            }
            configData.setProjects(deduplicated);
        }
        ProjectSpec activeProject = configData.getActiveProject();
        if (activeProject != null) {
            ensureProjectId(activeProject);
            List<ProjectSpec> currentProjects = configData.getProjects();
            if (currentProjects == null || currentProjects.stream().noneMatch(project -> isSameProject(project, activeProject))) {
                configData.addProject(activeProject);
            }
        }
    }

    private void ensureProjectId(ProjectSpec project) {
        if (project == null) {
            return;
        }
        if (project.getId() == null) {
            project.setId(deriveProjectId(project));
        }
    }

    private UUID deriveProjectId(ProjectSpec project) {
        String source = Optional.ofNullable(project.getRepoDir())
                .map(Path::toString)
                .orElseGet(() -> Optional.ofNullable(project.getRepoUrl())
                        .orElseGet(() -> Optional.ofNullable(project.getName()).orElse(UUID.randomUUID().toString())));
        return UUID.nameUUIDFromBytes(source.getBytes(StandardCharsets.UTF_8));
    }

    private boolean isSameProject(ProjectSpec first, ProjectSpec second) {
        if (first == null || second == null) {
            return false;
        }
        if (first.getId() != null && second.getId() != null) {
            return Objects.equals(first.getId(), second.getId());
        }
        if (first.getRepoDir() != null && second.getRepoDir() != null) {
            return first.getRepoDir().equals(second.getRepoDir());
        }
        return Objects.equals(first.getRepoUrl(), second.getRepoUrl());
    }

    private Path normalizeRepoDir(Path repoDir) {
        if (repoDir == null) {
            return null;
        }
        String asString = repoDir.toString();
        if (asString.startsWith("file:")) {
            try {
                return Path.of(URI.create(asString)).toAbsolutePath().normalize();
            } catch (IllegalArgumentException ex) {
                log.debug("Failed to normalize file URI path {}", asString, ex);
                return repoDir;
            }
        }
        return repoDir.toAbsolutePath().normalize();
    }

}
