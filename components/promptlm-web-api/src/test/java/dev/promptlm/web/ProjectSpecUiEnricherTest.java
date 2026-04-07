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

package dev.promptlm.web;

import dev.promptlm.domain.projectspec.ProjectHealthStatus;
import dev.promptlm.domain.projectspec.ProjectSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectSpecUiEnricherTest {

    private final ProjectSpecUiEnricher enricher = new ProjectSpecUiEnricher();

    @Test
    void enrichMarksMissingRepositoryAsBroken(@TempDir Path tempDir) {
        Path missingRepoDir = tempDir.resolve("missing");

        ProjectSpec project = new ProjectSpec();
        project.setRepoDir(missingRepoDir);

        ProjectSpec enriched = enricher.enrich(project);

        assertThat(enriched.getHealthStatus()).isEqualTo(ProjectHealthStatus.BROKEN_LOCAL);
        assertThat(enriched.getHealthMessage()).contains("Local repository missing at");
        assertThat(enriched.getPromptCount()).isEqualTo(0);
    }

    @Test
    void enrichPopulatesPromptCountAndTimestamps(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("repo");
        Files.createDirectories(repoDir);

        LocalDateTime createdAt = LocalDateTime.of(2020, 1, 1, 10, 0, 0);
        LocalDateTime updatedAt = LocalDateTime.of(2020, 1, 2, 12, 30, 0);

        Path promptA = repoDir.resolve("a").resolve("promptlm.yml");
        Files.createDirectories(promptA.getParent());
        Files.writeString(promptA, "id: a\n");
        Files.setLastModifiedTime(promptA, FileTime.from(createdAt.atZone(ZoneId.systemDefault()).toInstant()));

        Path promptB = repoDir.resolve("b").resolve("promptlm.yml");
        Files.createDirectories(promptB.getParent());
        Files.writeString(promptB, "id: b\n");
        Files.setLastModifiedTime(promptB, FileTime.from(updatedAt.atZone(ZoneId.systemDefault()).toInstant()));

        ProjectSpec project = new ProjectSpec();
        project.setRepoDir(repoDir);

        ProjectSpec enriched = enricher.enrich(project);

        assertThat(enriched.getHealthStatus()).isEqualTo(ProjectHealthStatus.HEALTHY);
        assertThat(enriched.getHealthMessage()).isNull();
        assertThat(enriched.getPromptCount()).isEqualTo(2);
        assertThat(enriched.getCreatedAt()).isEqualTo(createdAt);
        assertThat(enriched.getUpdatedAt()).isEqualTo(updatedAt);
    }
}
