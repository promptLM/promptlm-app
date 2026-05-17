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

import java.nio.file.Path;

/**
 * Extracts repository template resources into a target directory, substituting
 * template tokens (e.g. {@code {{REPO_NAME}}}) using the supplied {@link TemplateContext}.
 */
public interface RepositoryTemplateExtractor {

    /**
     * Extract the repository template archive to the provided directory, substituting template
     * tokens in text files using {@code context}. Binary files are copied unchanged.
     *
     * @param targetDirectory directory to populate with template contents
     * @param context         values to substitute into template tokens; must not be {@code null}
     */
    void extractTo(Path targetDirectory, TemplateContext context);
}
