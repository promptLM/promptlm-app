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
                        "activeProject": {
                            "repoDir": "%s"
                        }
                    }
                    """.formatted(repoDir));
            System.setProperty("user.home", userHome.toString());
            assertThat(configPath).exists();
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);
            context.afterPropertiesSet();
            assertThat(context.getActiveProject().getRepoDir().toString()).isEqualTo(repoDir.toString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            System.setProperty("user.home", originalUserHome);
            FileUtils.deleteDirectory(userHome.resolve(".promptlm").toFile());
        }
    }

    @Test
    @DisplayName("ignores unknown fields while reading existing config")
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
                                "localPath": "%s"
                            }
                        ],
                        "activeProject": {
                            "id": "00000000-0000-0000-0000-000000000001",
                            "name": "demo",
                            "repoDir": "%s",
                            "updatedAt": "2026-01-01T00:00:00Z"
                        }
                    }
                    """.formatted(repoDir, repoDir, repoDir));

            System.setProperty("user.home", userHome.toString());
            ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
            SerializingAppContext context = new SerializingAppContext(mapper);

            context.afterPropertiesSet();

            assertThat(context.getActiveProject()).isNotNull();
            assertThat(context.getActiveProject().getName()).isEqualTo("demo");
            assertThat(context.getActiveProject().getRepoDir()).isEqualTo(repoDir.toAbsolutePath().normalize());
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
                        "activeProject": {
                            "id": "00000000-0000-0000-0000-000000000002",
                            "name": "missing",
                            "repoDir": "%s"
                        }
                    }
                    """.formatted(healthyRepoDir, missingRepoDir, missingRepoDir));

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

}
