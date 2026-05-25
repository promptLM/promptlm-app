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

package dev.promptlm.repository.template;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Verifies the bundled {@code promptlm.yml} template defaults to Mode 2
 * (release enabled) per issue #276 and ships the full schema required by
 * issue #161. The Mode-2 default is a stopgap until the progressive-disclosure
 * UX in #275 ships — revert to Mode 1 when that work lands.
 */
class RepositoryTemplatePromptlmYmlTest {

    @Test
    void promptlmYmlIsPackagedInTheTemplateArchive() throws Exception {
        String content = readPromptlmYmlFromTemplateZip();
        assertThat(content)
                .as("promptlm.yml must be bundled in repo-template.zip (issue #161)")
                .isNotNull();
    }

    @Test
    void promptlmYmlDefaultsReleaseEnabledToTrue() throws Exception {
        String content = readPromptlmYmlFromTemplateZip();
        // Stopgap per #276: the template defaults to Mode 2 (release enabled)
        // so newly created repositories ship with the full release pipeline.
        // The durable Mode-1-default + opt-in promotion UX is tracked in #275;
        // when that ships, revert this expectation back to `enabled: false`.
        assertThat(content)
                .as("Default promptlm.yml must set release.enabled to true (issue #276 stopgap; reverts when #275 ships)")
                .containsPattern("(?m)^\\s+enabled:\\s*true\\b");
    }

    @Test
    void promptlmYmlExposesTheFullReleaseSchema() throws Exception {
        String content = readPromptlmYmlFromTemplateZip();
        assertThat(content).contains("release:");
        assertThat(content).contains("provider: github-actions");
        assertThat(content).contains("trigger:");
        assertThat(content).contains("tagPattern:");
        assertThat(content).contains("workflowDispatch:");
        assertThat(content).contains("artifact:");
        assertThat(content).contains("includeManifest:");
        assertThat(content).contains("includeChecksums:");
        assertThat(content).contains("versioning:");
        assertThat(content).contains("strategy: semver");
        assertThat(content).contains("source: git-tag");
        assertThat(content).contains("validation:");
        assertThat(content).contains("failOnEmpty:");
        assertThat(content).contains("failOnMissingMetadata:");
    }

    private String readPromptlmYmlFromTemplateZip() throws Exception {
        try (InputStream resource = getClass().getClassLoader().getResourceAsStream("repo-template.zip")) {
            assertNotNull(resource, "repo-template.zip must be packaged in module resources");
            try (ZipInputStream zip = new ZipInputStream(resource)) {
                ZipEntry entry;
                while ((entry = zip.getNextEntry()) != null) {
                    if (!entry.isDirectory() && "promptlm.yml".equals(entry.getName())) {
                        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                        zip.transferTo(buffer);
                        return buffer.toString(StandardCharsets.UTF_8);
                    }
                }
            }
        }
        throw new AssertionError("promptlm.yml not found in repo-template.zip");
    }
}
