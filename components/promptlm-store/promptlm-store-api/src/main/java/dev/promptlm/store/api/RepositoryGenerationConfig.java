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

package dev.promptlm.store.api;

/**
 * Configuration value object passed through the repository generation pipeline.
 * <p>
 * It carries the parameters required to provision a remote repository and to
 * select the appropriate {@code ReleaseTemplateProvider} implementation.
 *
 * <p>This type is intentionally provider-agnostic — it does <em>not</em> contain
 * any GitHub-specific fields. Provider-specific behaviour is encapsulated behind
 * the {@code ReleaseTemplateProvider} SPI.
 *
 * @param repositoryName  the short name of the repository (must not be blank)
 * @param ownerName       the owner login / organisation (must not be blank)
 * @param description     human-readable description applied to the remote
 *                        repository; defaults to {@link #DEFAULT_DESCRIPTION}
 * @param defaultBranch   the default branch used for the initial commit;
 *                        defaults to {@link #DEFAULT_BRANCH}
 * @param releaseEnabled  whether release workflow files should be generated
 * @param releaseProvider which release provider implementation to dispatch to;
 *                        ignored when {@code releaseEnabled} is {@code false}
 */
public record RepositoryGenerationConfig(
        String repositoryName,
        String ownerName,
        String description,
        String defaultBranch,
        boolean releaseEnabled,
        ReleaseProvider releaseProvider
) {

    /** Default repository description used when none is supplied. */
    public static final String DEFAULT_DESCRIPTION = "A promptLM store";

    /** Default branch name used when none is supplied. */
    public static final String DEFAULT_BRANCH = "main";

    public RepositoryGenerationConfig {
        if (repositoryName == null || repositoryName.isBlank()) {
            throw new IllegalArgumentException("repositoryName must not be blank");
        }
        if (ownerName == null || ownerName.isBlank()) {
            throw new IllegalArgumentException("ownerName must not be blank");
        }
        if (description == null || description.isBlank()) {
            description = DEFAULT_DESCRIPTION;
        }
        if (defaultBranch == null || defaultBranch.isBlank()) {
            defaultBranch = DEFAULT_BRANCH;
        }
        if (releaseProvider == null) {
            releaseProvider = releaseEnabled ? ReleaseProvider.GITHUB_ACTIONS : ReleaseProvider.NONE;
        }
    }

    /**
     * Convenience factory for the common "no release / defaults" case used by
     * Mode 1 configurations and by callers that have not yet been migrated to
     * pass an explicit configuration.
     */
    public static RepositoryGenerationConfig defaults(String ownerName, String repositoryName) {
        return new RepositoryGenerationConfig(
                repositoryName,
                ownerName,
                DEFAULT_DESCRIPTION,
                DEFAULT_BRANCH,
                false,
                ReleaseProvider.NONE
        );
    }

    /**
     * Returns a copy of this configuration with the given description.
     */
    public RepositoryGenerationConfig withDescription(String newDescription) {
        return new RepositoryGenerationConfig(
                repositoryName,
                ownerName,
                newDescription,
                defaultBranch,
                releaseEnabled,
                releaseProvider
        );
    }

    /**
     * Returns a copy of this configuration with the given default branch.
     */
    public RepositoryGenerationConfig withDefaultBranch(String newDefaultBranch) {
        return new RepositoryGenerationConfig(
                repositoryName,
                ownerName,
                description,
                newDefaultBranch,
                releaseEnabled,
                releaseProvider
        );
    }
}
