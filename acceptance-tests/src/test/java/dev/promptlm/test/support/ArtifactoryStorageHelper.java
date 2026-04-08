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
import dev.promptlm.test.util.ZipTestUtils;
import dev.promptlm.testutils.artifactory.ArtifactoryContainer;
import org.assertj.core.api.Assertions;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Utility methods for interacting with Artifactory during acceptance tests.
 */
public final class ArtifactoryStorageHelper {

    private ArtifactoryStorageHelper() {
    }

    public static JsonNode findFirstArtifactArchiveMetadata(HttpClient httpClient,
                                                            ArtifactoryContainer artifactoryContainer) {
        try {
            return locateFirstArtifactArchiveMetadata(httpClient, artifactoryContainer, "");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to locate artifact archive metadata", e);
        }
    }

    public static Path downloadFirstArtifactArchive(HttpClient httpClient,
                                                    ArtifactoryContainer artifactoryContainer) {
        try {
            JsonNode fileMetadata = findFirstArtifactArchiveMetadata(httpClient, artifactoryContainer);
            Assertions.assertThat(fileMetadata)
                    .as("Artifact file metadata should be present")
                    .isNotNull();

            String pathValue = fileMetadata.path("path").asText();
            String fileName = Paths.get(pathValue).getFileName() != null
                    ? Paths.get(pathValue).getFileName().toString()
                    : "artifact.jar";

            String preferredDownloadUrl = fileMetadata.path("downloadUri").asText(null);
            if (preferredDownloadUrl == null || preferredDownloadUrl.isBlank()) {
                preferredDownloadUrl = buildDownloadUrl(artifactoryContainer, pathValue);
            }

            Path tempDir = Files.createTempDirectory("promptlm-artifact-");
            Path archivePath = tempDir.resolve(fileName);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(preferredDownloadUrl))
                    .header("Authorization", artifactoryContainer.getDeployerAuthHeader())
                    .GET()
                    .build();

            HttpResponse<Path> response = httpClient.send(request, HttpResponse.BodyHandlers.ofFile(archivePath));
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Failed to download artifact archive: status=" + response.statusCode());
            }

            Path extractDir = Files.createTempDirectory(tempDir, "unzipped-");
            ZipTestUtils.unzip(archivePath, extractDir);
            return extractDir;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to download artifact archive", e);
        }
    }

    public static JsonNode fetchArtifactoryDeployments(HttpClient httpClient,
                                                       ArtifactoryContainer artifactoryContainer) {
        return fetchArtifactoryStorage(httpClient, artifactoryContainer, "");
    }

    public static JsonNode fetchArtifactoryStorage(HttpClient httpClient,
                                                   ArtifactoryContainer artifactoryContainer,
                                                   String relativePath) {
        try {
            String repo = artifactoryContainer.getMavenRepositoryName();
            String normalizedPath = relativePath.startsWith("/") ? relativePath : (relativePath.isEmpty() ? "" : "/" + relativePath);
            String url = artifactoryContainer.getApiUrl() + "/api/storage/" + repo + normalizedPath;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", artifactoryContainer.getDeployerAuthHeader())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Failed to fetch Artifactory storage: status=" + response.statusCode()
                        + " body=" + response.body());
            }

            return ObjectMapperFactory.createJsonMapper().readTree(response.body());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to fetch Artifactory deployments", e);
        }
    }

    private static JsonNode locateFirstArtifactArchiveMetadata(HttpClient httpClient,
                                                               ArtifactoryContainer artifactoryContainer,
                                                               String relativePath) throws IOException, InterruptedException {
        JsonNode current = fetchArtifactoryStorage(httpClient, artifactoryContainer, relativePath);
        JsonNode children = current.path("children");
        if (!children.isArray()) {
            if (current.path("downloadUri").isMissingNode()) {
                return null;
            }
            String path = current.path("path").asText();
            if (isMetadataFile(path)) {
                return null;
            }
            return isArchiveFile(path) ? current : null;
        }

        for (var child : children) {
            String childUri = child.path("uri").asText();
            boolean isFolder = child.path("folder").asBoolean();
            String nextPath = relativePath + childUri;
            if (isFolder) {
                JsonNode result = locateFirstArtifactArchiveMetadata(httpClient, artifactoryContainer, nextPath);
                if (result != null) {
                    return result;
                }
            } else {
                JsonNode file = fetchArtifactoryStorage(httpClient, artifactoryContainer, nextPath);
                if (file != null && !isMetadataFile(file.path("path").asText())) {
                    String path = file.path("path").asText();
                    if (isArchiveFile(path)) {
                        return file;
                    }
                }
            }
        }
        return null;
    }

    private static String buildDownloadUrl(ArtifactoryContainer artifactoryContainer, String artifactPath) {
        String repositoryBase = artifactoryContainer.getMavenRepositoryUrl();
        String normalizedPath = artifactPath.startsWith("/") ? artifactPath.substring(1) : artifactPath;
        if (normalizedPath.isBlank()) {
            return repositoryBase;
        }
        return repositoryBase + "/" + normalizedPath;
    }

    private static boolean isMetadataFile(String path) {
        if (path == null || path.isBlank()) {
            return true;
        }
        String filename = Paths.get(path).getFileName().toString();
        return filename.equalsIgnoreCase("maven-metadata.xml")
                || filename.endsWith(".sha1")
                || filename.endsWith(".sha256")
                || filename.endsWith(".sha512")
                || filename.endsWith(".md5");
    }

    private static boolean isArchiveFile(String path) {
        if (path == null || path.isBlank()) {
            return false;
        }
        String filename = Paths.get(path).getFileName().toString().toLowerCase();
        return filename.endsWith(".jar") || filename.endsWith(".zip");
    }

}
