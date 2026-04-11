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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Stream;

@Component
class ProjectSpecUiEnricher {

    private static final Logger log = LoggerFactory.getLogger(ProjectSpecUiEnricher.class);

    ProjectSpec enrich(ProjectSpec projectSpec) {
        if (projectSpec == null || projectSpec.getRepoDir() == null) {
            return projectSpec;
        }

        Path repoDir = projectSpec.getRepoDir();
        if (!Files.exists(repoDir)) {
            projectSpec.setHealthStatus(ProjectHealthStatus.BROKEN_LOCAL);
            projectSpec.setHealthMessage("Local repository missing at \"%s\"".formatted(repoDir.toAbsolutePath()));
            if (projectSpec.getPromptCount() == null) {
                projectSpec.setPromptCount(0);
            }
            return projectSpec;
        }

        try (Stream<Path> walk = Files.walk(repoDir)) {
            List<FileTime> promptFileTimes = walk
                    .filter(Files::isRegularFile)
                    .filter(path -> "promptlm.yml".equals(path.getFileName().toString()))
                    .map(path -> {
                        try {
                            return Files.getLastModifiedTime(path);
                        } catch (IOException ex) {
                            log.debug("Unable to read modified time for {}", path, ex);
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .toList();

            projectSpec.setPromptCount(promptFileTimes.size());
            promptFileTimes.stream().min(FileTime::compareTo).ifPresent(min ->
                    projectSpec.setCreatedAt(LocalDateTime.ofInstant(min.toInstant(), ZoneId.systemDefault())));
            promptFileTimes.stream().max(FileTime::compareTo).ifPresent(max ->
                    projectSpec.setUpdatedAt(LocalDateTime.ofInstant(max.toInstant(), ZoneId.systemDefault())));
            projectSpec.setHealthStatus(ProjectHealthStatus.HEALTHY);
            projectSpec.setHealthMessage(null);
        } catch (IOException ex) {
            log.debug("Unable to compute prompt metadata for project {}", projectSpec.getName(), ex);
            if (projectSpec.getPromptCount() == null) {
                projectSpec.setPromptCount(0);
            }
            projectSpec.setHealthStatus(ProjectHealthStatus.BROKEN_LOCAL);
            if (StringUtils.hasText(ex.getMessage())) {
                projectSpec.setHealthMessage("Unable to access local repository: " + ex.getMessage());
            } else {
                projectSpec.setHealthMessage("Unable to access local repository.");
            }
        }

        if (projectSpec.getPromptCount() == null) {
            projectSpec.setPromptCount(0);
        }

        return projectSpec;
    }
}
