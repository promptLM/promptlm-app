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

import java.time.Instant;
import java.util.Objects;

/**
 * Values that the repository template extractor substitutes into the generated repository at
 * extraction time. Carries the canonical token sources for {@code {{REPO_NAME}}},
 * {@code {{REPO_OWNER}}}, {@code {{PROJECT_DESCRIPTION}}}, {@code {{CREATED_AT}}} and
 * {@code {{GENERATOR_VERSION}}}.
 *
 * <p>{@code createdAt} is rendered as ISO-8601 UTC (e.g. {@code 2026-05-17T01:23:45Z}).
 *
 * <p>This is an immutable, equality-by-value record; callers should construct one per repository
 * generation.
 */
public record TemplateContext(
        String repositoryName,
        String ownerName,
        String projectDescription,
        Instant createdAt,
        String generatorVersion) {

    public TemplateContext {
        Objects.requireNonNull(repositoryName, "repositoryName");
        Objects.requireNonNull(ownerName, "ownerName");
        Objects.requireNonNull(projectDescription, "projectDescription");
        Objects.requireNonNull(createdAt, "createdAt");
        Objects.requireNonNull(generatorVersion, "generatorVersion");
    }
}
