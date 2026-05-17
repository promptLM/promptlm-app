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
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.projectspec.ProjectHealthStatus;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.infrastructure.config.SerializingAppContext;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SerializingAppContextTest {

    @TempDir
    static Path userHome;
    static String originalUserHome;

    @BeforeAll
    static void beforeAll() {
        originalUserHome = System.getProperty("user.home");
        System.setProperty("user.home", userHome.toString());
    }

    @AfterAll
    static void afterAll() {
        System.setProperty("user.home", originalUserHome);
    }


    @Test
    @DisplayName("creates default config if none exists")
    void createsDefaultConfigIfNoneExists() throws Exception {
        Path configPath = userHome.resolve(".promptlm/context.json");
        try {
            assertThat(configPath).doesNotExist();
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);
            context.afterPropertiesSet();
            assertThat(configPath).exists();
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

    @Test
    @DisplayName("reads config if found")
    void readsConfigIfFound(@TempDir Path tempDir) throws IOException {
        String originalUserHome = System.getProperty("user.home");
        Path userHome = tempDir.resolve("user.fake");
        try {
            Path configPath = userHome.resolve(".promptlm/context.json");
            Files.createDirectories(configPath.getParent());
            Path repoDir = tempDir.resolve("some-repo-dir");
            Files.createDirectories(repoDir);
            Files.writeString(configPath, """
                    {
                        "projects": [
                            {
                                "id": "00000000-0000-0000-0000-000000000001",
                                "name": "demo",
                                "repoDir": "%s"
                            }
                        ],
                        "activeProject": { "id": "00000000-0000-0000-0000-000000000001" }
                    }
                    """.formatted(repoDir));
            System.setProperty("user.home", userHome.toString());
            assertThat(configPath).exists();
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);
            context.afterPropertiesSet();
            assertThat(context.getActiveProject().getRepoDir()).isEqualTo(repoDir.toAbsolutePath().normalize());
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

    @Test
    @DisplayName("ignores unknown fields on projects while reading existing config")
    void ignoresUnknownFieldsWhileReadingExistingConfig(@TempDir Path tempDir) throws IOException {
        String originalUserHome = System.getProperty("user.home");
        Path userHome = tempDir.resolve("user.unknown");
        try {
            Path configPath = userHome.resolve(".promptlm/context.json");
            Files.createDirectories(configPath.getParent());
            Path repoDir = tempDir.resolve("repo-dir");
            Files.createDirectories(repoDir);
            Files.writeString(configPath, """
                    {
                        "projects": [
                            {
                                "id": "00000000-0000-0000-0000-000000000001",
                                "name": "demo",
                                "repoDir": "%s",
                                "createdAt": "2026-01-01T00:00:00Z",
                                "localPath": "%s",
                                "futureField": "ignored"
                            }
                        ],
                        "activeProject": { "id": "00000000-0000-0000-0000-000000000001" }
                    }
                    """.formatted(repoDir, repoDir));

            System.setProperty("user.home", userHome.toString());
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);

            context.afterPropertiesSet();

            assertThat(context.getActiveProject()).isNotNull();
            assertThat(context.getActiveProject().getName()).isEqualTo("demo");
            assertThat(context.getActiveProject().getRepoDir()).isEqualTo(repoDir.toAbsolutePath().normalize());
            // The returned activeProject must be the same instance as the matching entry in projects[].
            ProjectSpec matchingProject = context.getProjects().stream()
                    .filter(project -> "demo".equals(project.getName()))
                    .findFirst()
                    .orElseThrow();
            assertThat(context.getActiveProject()).isSameAs(matchingProject);
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

    @Test
    @DisplayName("clears active project when persisted local repository is missing")
    void clearsActiveProjectWhenPersistedLocalRepositoryIsMissing(@TempDir Path tempDir) throws IOException {
        String originalUserHome = System.getProperty("user.home");
        Path userHome = tempDir.resolve("user.missing.active");
        try {
            Path configPath = userHome.resolve(".promptlm/context.json");
            Files.createDirectories(configPath.getParent());

            Path healthyRepoDir = tempDir.resolve("healthy-repo");
            Files.createDirectories(healthyRepoDir);
            Path missingRepoDir = tempDir.resolve("missing-repo");

            Files.writeString(configPath, """
                    {
                        "projects": [
                            {
                                "id": "00000000-0000-0000-0000-000000000001",
                                "name": "healthy",
                                "repoDir": "%s"
                            },
                            {
                                "id": "00000000-0000-0000-0000-000000000002",
                                "name": "missing",
                                "repoDir": "%s"
                            }
                        ],
                        "activeProject": { "id": "00000000-0000-0000-0000-000000000002" }
                    }
                    """.formatted(healthyRepoDir, missingRepoDir));

            System.setProperty("user.home", userHome.toString());
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);

            context.afterPropertiesSet();

            assertThat(context.getActiveProject()).isNull();

            ProjectSpec missingProject = context.getProjects().stream()
                    .filter(project -> "missing".equals(project.getName()))
                    .findFirst()
                    .orElseThrow();
            assertThat(missingProject.getHealthStatus()).isEqualTo(ProjectHealthStatus.BROKEN_LOCAL);
            assertThat(missingProject.getHealthMessage()).contains("Local repository missing at");
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

    @Test
    @DisplayName("writes activeProject as an id-only reference and keeps full ProjectSpec in projects[]")
    void writesActiveProjectAsIdOnlyReference(@TempDir Path tempDir) throws Exception {
        String originalUserHome = System.getProperty("user.home");
        Path userHome = tempDir.resolve("user.idonly");
        try {
            Path repoDir = tempDir.resolve("alpha-repo");
            Files.createDirectories(repoDir);
            System.setProperty("user.home", userHome.toString());

            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);
            context.afterPropertiesSet();

            ProjectSpec project = new ProjectSpec();
            project.setName("alpha");
            project.setRepoDir(repoDir);
            context.setActiveProject(project);
            context.destroy();

            Path configPath = userHome.resolve(".promptlm/context.json");
            JsonNode root = mapper.readTree(configPath.toFile());

            JsonNode activeNode = root.get("activeProject");
            assertThat(activeNode).isNotNull();
            assertThat(activeNode.isObject()).isTrue();
            assertThat(activeNode.size()).isEqualTo(1);
            assertThat(activeNode.has("id")).isTrue();
            UUID writtenId = UUID.fromString(activeNode.get("id").asText());
            assertThat(writtenId).isEqualTo(context.getActiveProject().getId());

            JsonNode projectsNode = root.get("projects");
            assertThat(projectsNode.isArray()).isTrue();
            assertThat(projectsNode.size()).isEqualTo(1);
            assertThat(projectsNode.get(0).get("name").asText()).isEqualTo("alpha");
            assertThat(projectsNode.get(0).get("id").asText()).isEqualTo(writtenId.toString());
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

    @Test
    @DisplayName("reads id-only activeProject and resolves it to the same instance as the projects entry")
    void readsIdOnlyActiveProjectPreservingInstanceIdentity(@TempDir Path tempDir) throws IOException {
        String originalUserHome = System.getProperty("user.home");
        Path userHome = tempDir.resolve("user.read-idonly");
        try {
            Path configPath = userHome.resolve(".promptlm/context.json");
            Files.createDirectories(configPath.getParent());
            Path repoDir = tempDir.resolve("alpha-repo");
            Files.createDirectories(repoDir);
            Files.writeString(configPath, """
                    {
                        "projects": [
                            {
                                "id": "00000000-0000-0000-0000-000000000010",
                                "name": "alpha",
                                "repoDir": "%s"
                            }
                        ],
                        "activeProject": { "id": "00000000-0000-0000-0000-000000000010" }
                    }
                    """.formatted(repoDir));

            System.setProperty("user.home", userHome.toString());
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);
            context.afterPropertiesSet();

            ProjectSpec activeProject = context.getActiveProject();
            assertThat(activeProject).isNotNull();
            assertThat(activeProject.getId()).isEqualTo(UUID.fromString("00000000-0000-0000-0000-000000000010"));
            assertThat(activeProject.getName()).isEqualTo("alpha");
            ProjectSpec fromList = context.getProjects().stream()
                    .filter(project -> activeProject.getId().equals(project.getId()))
                    .findFirst()
                    .orElseThrow();
            assertThat(activeProject).isSameAs(fromList);
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

}
