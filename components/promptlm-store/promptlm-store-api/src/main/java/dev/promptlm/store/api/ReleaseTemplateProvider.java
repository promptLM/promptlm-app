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

import java.util.List;

/**
 * SPI for contributing CI/CD release-workflow files into a generated promptLM
 * store repository.
 *
 * <p>Each implementation targets one {@link ReleaseProvider} value (GitHub
 * Actions, GitLab CI, etc.). The selection happens at provisioning time, based
 * on the {@code releaseProvider} field of the supplied
 * {@link RepositoryGenerationConfig}.
 *
 * <p>Implementations must be <em>pure</em>: they return the files that should
 * be added to the repository and must not perform IO on the target filesystem
 * themselves. Writing the files is the caller's responsibility.
 *
 * <p>Adding a new CI/CD platform (for example GitLab) is therefore a matter of
 * adding a new enum value to {@link ReleaseProvider} and a new
 * {@code ReleaseTemplateProvider} implementation — no changes to the
 * provisioning core are required.
 */
public interface ReleaseTemplateProvider {

    /**
     * @return the release provider this implementation targets.
     */
    ReleaseProvider provider();

    /**
     * Returns the set of files to add to the generated repository when release
     * capability is enabled for the given configuration.
     *
     * <p>Implementations may return an empty list when release files are not
     * required (for example {@code NoReleaseTemplateProvider} or a future
     * provider that bundles its assets through some other mechanism).
     *
     * @param config the repository generation configuration; never {@code null}
     * @return an immutable list of files to add; never {@code null}
     */
    List<GeneratedFile> generateFiles(RepositoryGenerationConfig config);
}
