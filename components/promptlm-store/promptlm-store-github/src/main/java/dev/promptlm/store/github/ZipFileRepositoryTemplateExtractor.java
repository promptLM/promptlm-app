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

package dev.promptlm.store.github;

import dev.promptlm.repository.template.RepositoryTemplateExtractor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class ZipFileRepositoryTemplateExtractor implements RepositoryTemplateExtractor {

    private static final Logger log = LoggerFactory.getLogger(ZipFileRepositoryTemplateExtractor.class);
    private static final String DEFAULT_TEMPLATE_ARCHIVE = "repo-template.zip";

    private final Resource templateArchive;

    public ZipFileRepositoryTemplateExtractor() {
        this(new ClassPathResource(DEFAULT_TEMPLATE_ARCHIVE));
    }

    ZipFileRepositoryTemplateExtractor(Resource templateArchive) {
        this.templateArchive = templateArchive;
    }

    public void extractTo(Path repoPath) {
        try (InputStream zipInputStream = templateArchive.getInputStream();
             ZipInputStream zis = new ZipInputStream(zipInputStream)) {

            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path targetPath = repoPath.resolve(entry.getName());

                if (entry.isDirectory()) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.createDirectories(targetPath.getParent());
                    Files.copy(zis, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }

                zis.closeEntry();
            }

            log.debug("Successfully extracted repository template to: {}", repoPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to extract repository template", e);
        }
    }
}
