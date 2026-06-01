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

package dev.promptlm.test.support;

import tools.jackson.databind.JsonNode;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.testutils.artifactory.ArtifactoryContainer;

import java.io.IOException;
import java.net.http.HttpClient;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * Centralized release artifact contract assertions for acceptance tests.
 */
public final class ReleaseArtifactContractDelegate {

    private static final Duration ARTIFACT_READY_TIMEOUT = Duration.ofMinutes(12);
    private static final Duration ARTIFACT_READY_POLL_INTERVAL = Duration.ofSeconds(5);

    private ReleaseArtifactContractDelegate() {
    }

    /**
     * Downloads the first published archive from Artifactory and validates the release artifact contract.
     *
     * <p>This convenience method couples the Artifactory-specific download step to the
     * container-free contract assertion in {@link #assertReleaseArtifactContract(Path)}.
     * For release flows that do not publish to Artifactory (e.g. a GitHub Releases harness
     * test), download the archive separately and call
     * {@link #assertReleaseArtifactContract(Path)} directly.
     *
     * @return extracted archive directory
     */
    public static Path assertPublishedReleaseArtifactContract(HttpClient httpClient,
                                                              ArtifactoryContainer artifactoryContainer) {
        waitForPublishedArchiveMetadata(httpClient, artifactoryContainer);
        Path extractedDir = ArtifactoryStorageHelper.downloadFirstArtifactArchive(httpClient, artifactoryContainer);
        assertReleaseArtifactContract(extractedDir);
        return extractedDir;
    }

    private static JsonNode waitForPublishedArchiveMetadata(HttpClient httpClient,
                                                            ArtifactoryContainer artifactoryContainer) {
        AtomicReference<JsonNode> result = new AtomicReference<>();
        await("archive artifact metadata in Artifactory")
                .atMost(ARTIFACT_READY_TIMEOUT)
                .pollInterval(ARTIFACT_READY_POLL_INTERVAL)
                .untilAsserted(() -> {
                    JsonNode metadata = ArtifactoryStorageHelper.findFirstArtifactArchiveMetadata(httpClient, artifactoryContainer);
                    assertThat(metadata).as("archive artifact metadata").isNotNull();
                    result.set(metadata);
                });
        return result.get();
    }

    /**
     * Validates the required release artifact structure and metadata files.
     *
     * <p>Intentionally decoupled from {@link ArtifactoryContainer}: this method operates
     * solely on an extracted archive directory and is the reusable contract validator for
     * alternate release flows (e.g. a future GitHub Releases harness test that downloads
     * the artifact directly from Gitea and extracts it locally before asserting the
     * contract). The Artifactory-bound entry point lives at
     * {@link #assertPublishedReleaseArtifactContract(HttpClient, ArtifactoryContainer)}.
     */
    public static void assertReleaseArtifactContract(Path extractedDir) {
        Path metadataFile = extractedDir.resolve("META-INF/metadata.json");
        Path promptsMetaFile = extractedDir.resolve("META-INF/prompts-meta.json");
        Path promptsDir = extractedDir.resolve("prompts");

        assertThat(metadataFile)
                .as("release archive must include META-INF/metadata.json")
                .isRegularFile();
        assertThat(promptsMetaFile)
                .as("release archive must include META-INF/prompts-meta.json")
                .isRegularFile();
        assertThat(promptsDir)
                .as("release archive must include prompts directory")
                .isDirectory();

        JsonNode metadata = readJson(metadataFile);
        assertThat(metadata.path("repository").isObject())
                .as("metadata.json must contain object field 'repository'")
                .isTrue();
        assertThat(metadata.path("prompts").isArray())
                .as("metadata.json must contain array field 'prompts'")
                .isTrue();
        assertThat(metadata.path("metadata").isObject())
                .as("metadata.json must contain object field 'metadata'")
                .isTrue();
        assertThat(metadata.path("repository").path("name").asText())
                .as("metadata.json repository.name must not be blank")
                .isNotBlank();
        assertThat(metadata.path("repository").path("version").asText())
                .as("metadata.json repository.version must not be blank")
                .isNotBlank();
        assertThat(metadata.path("metadata").path("format_version").asText())
                .as("metadata.json metadata.format_version must not be blank")
                .isNotBlank();
        assertThat(metadata.path("metadata").path("generator").asText())
                .as("metadata.json metadata.generator must not be blank")
                .isNotBlank();
        assertThat(metadata.path("metadata").path("generator_version").asText())
                .as("metadata.json metadata.generator_version must not be blank")
                .isNotBlank();

        assertPromptMetadataEntries(metadata.path("prompts"));

        JsonNode promptsMeta = readJson(promptsMetaFile);
        assertThat(promptsMeta.path("version").asText())
                .as("prompts-meta.json must contain non-blank 'version'")
                .isNotBlank();

        try (Stream<Path> files = Files.walk(promptsDir)) {
            long promptFileCount = files.filter(Files::isRegularFile).count();
            assertThat(promptFileCount)
                    .as("prompts directory must contain at least one file")
                    .isGreaterThan(0);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to inspect prompts directory in extracted release artifact", e);
        }

        assertPromptFilesHaveContent(extractedDir, promptsDir);
    }

    private static void assertPromptMetadataEntries(JsonNode promptsNode) {
        assertThat(promptsNode.isArray())
                .as("metadata.json prompts must be an array")
                .isTrue();

        // Issue #309: a freshly provisioned repo starts blank, so an empty
        // prompts[] is a valid release state. (prompts[] is seed/derived
        // metadata the app does not maintain on prompt create — release
        // history is tracked via versions[].) Validate each entry's shape only
        // when entries are present.
        promptsNode.forEach(prompt -> {
            assertThat(prompt.path("id").asText()).as("prompt metadata id must not be blank").isNotBlank();
            assertThat(prompt.path("name").asText()).as("prompt metadata name must not be blank").isNotBlank();
            assertThat(prompt.path("group").asText()).as("prompt metadata group must not be blank").isNotBlank();
            assertThat(prompt.path("version").asText()).as("prompt metadata version must not be blank").isNotBlank();
            assertThat(prompt.path("file").asText()).as("prompt metadata file must not be blank").isNotBlank();
            assertThat(prompt.path("status").asText()).as("prompt metadata status must not be blank").isNotBlank();
            String normalizedStatus = prompt.path("status").asText().toLowerCase(Locale.ROOT);
            assertThat(normalizedStatus)
                    .as("prompt metadata status must be active or retired")
                    .isIn("active", "retired");
        });
    }

    private static void assertPromptFilesHaveContent(Path extractedDir, Path promptsDir) {
        try (Stream<Path> files = Files.walk(promptsDir).filter(Files::isRegularFile)) {
            files.forEach(path -> {
                String filename = path.getFileName().toString();
                if (".gitignore".equals(filename)) {
                    return;
                }

                String content = readText(path);
                assertThat(content.trim())
                        .as("prompt file %s must not be empty", extractedDir.relativize(path))
                        .isNotBlank();

                if ("promptlm.yml".equals(filename) || "promptlm.yaml".equals(filename)) {
                    try {
                        PromptSpec parsed = ObjectMapperFactory.createYamlMapper().readValue(content, PromptSpec.class);
                        assertThat(parsed.getId()).as("prompt spec id must not be blank").isNotBlank();
                        assertThat(parsed.getName()).as("prompt spec name must not be blank").isNotBlank();
                        assertThat(parsed.getGroup()).as("prompt spec group must not be blank").isNotBlank();
                        assertThat(parsed.getVersion()).as("prompt spec version must not be blank").isNotBlank();
                        assertThat(parsed.getRequest()).as("prompt spec request must be present").isNotNull();
                    } catch (RuntimeException e) {
                        throw new IllegalStateException("Failed to parse prompt spec YAML: " + path, e);
                    }
                }
            });
        } catch (IOException e) {
            throw new IllegalStateException("Failed to inspect prompt files in extracted release artifact", e);
        }
    }

    private static JsonNode readJson(Path path) {
        try {
            return ObjectMapperFactory.createJsonMapper().readTree(Files.readString(path));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse JSON file: " + path, e);
        }
    }

    private static String readText(Path path) {
        try {
            return Files.readString(path);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read release artifact file: " + path, e);
        }
    }
}
