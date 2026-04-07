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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;

/**
 * Helper utilities for retrieving repository content from Gitea during acceptance tests.
 */
public final class GiteaRepositoryHelper {

    private GiteaRepositoryHelper() {
    }

    /**
     * Fetches a raw file from a repository branch using the standard Gitea raw URL format.
     *
     * @param httpClient  HTTP client to execute the request
     * @param baseRepoUrl Base URL of the repository (e.g. https://gitea.example.com/user/repo)
     * @param branch      Branch to load the file from
     * @param relativePath Relative path within the repository
     * @param token       Personal access token (optional) for authentication
     * @return Optional containing the file contents when found, or empty when the file is not present
     */
    public static Optional<String> fetchRawFile(HttpClient httpClient,
                                                String baseRepoUrl,
                                                String branch,
                                                String relativePath,
                                                String token) {
        String normalizedPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        String rawUrl = baseRepoUrl + "/raw/branch/" + branch + "/" + normalizedPath;

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(rawUrl))
                .GET();
        if (token != null && !token.isBlank()) {
            requestBuilder.header("Authorization", "token " + token);
        }

        try {
            HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return Optional.ofNullable(response.body());
            }
            if (response.statusCode() == 404) {
                return Optional.empty();
            }
            throw new IllegalStateException("Unexpected status " + response.statusCode() + " when fetching repository file: " + rawUrl);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to fetch repository file from Gitea", e);
        }
    }
}
