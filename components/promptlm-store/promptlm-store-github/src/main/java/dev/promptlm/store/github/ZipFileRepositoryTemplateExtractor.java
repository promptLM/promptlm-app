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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class ZipFileRepositoryTemplateExtractor implements RepositoryTemplateExtractor {

    private static final Logger log = LoggerFactory.getLogger(ZipFileRepositoryTemplateExtractor.class);
    private static final String DEFAULT_TEMPLATE_ARCHIVE = "repo-template.zip";
    private static final String CONFIG_FILE_NAME = "promptlm.yml";

    /**
     * Entries that are only relevant in Mode 2 (release-enabled). When
     * {@code release.enabled} is {@code false} in the generated repository's
     * {@value #CONFIG_FILE_NAME}, these files are skipped during extraction so
     * that the produced repository is a plain prompt-management store with no
     * CI/CD or build pipeline noise.
     *
     * @see <a href="https://github.com/promptLM/promptlm-app/issues/161">Issue #161</a>
     */
    private static final List<Pattern> RELEASE_ONLY_PATH_PATTERNS = List.of(
            Pattern.compile("^\\.github/.*"),
            Pattern.compile("^tools/.*"),
            Pattern.compile("^scripts/.*"),
            Pattern.compile("^pom\\.xml$"),
            Pattern.compile("^\\.promptlm/artifacts\\.toml$")
    );

    private final Resource templateArchive;

    public ZipFileRepositoryTemplateExtractor() {
        this(new ClassPathResource(DEFAULT_TEMPLATE_ARCHIVE));
    }

    ZipFileRepositoryTemplateExtractor(Resource templateArchive) {
        this.templateArchive = templateArchive;
    }

    public void extractTo(Path repoPath) {
        Map<String, byte[]> entries = readAllEntries();
        boolean releaseEnabled = isReleaseEnabled(entries.get(CONFIG_FILE_NAME));
        log.debug("Repository template release.enabled resolved to {}", releaseEnabled);

        try {
            for (Map.Entry<String, byte[]> entry : entries.entrySet()) {
                String name = entry.getKey();
                if (!releaseEnabled && isReleaseOnly(name)) {
                    log.debug("Skipping release-only template entry (release.enabled=false): {}", name);
                    continue;
                }
                Path targetPath = repoPath.resolve(name);
                Files.createDirectories(targetPath.getParent());
                Files.copy(new ByteArrayInputStream(entry.getValue()), targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
            log.debug("Successfully extracted repository template to: {}", repoPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to extract repository template", e);
        }
    }

    private Map<String, byte[]> readAllEntries() {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        try (InputStream zipInputStream = templateArchive.getInputStream();
             ZipInputStream zis = new ZipInputStream(zipInputStream)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    zis.closeEntry();
                    continue;
                }
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                zis.transferTo(buffer);
                entries.put(entry.getName(), buffer.toByteArray());
                zis.closeEntry();
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read repository template archive", e);
        }
        return entries;
    }

    private static boolean isReleaseOnly(String entryName) {
        for (Pattern pattern : RELEASE_ONLY_PATH_PATTERNS) {
            if (pattern.matcher(entryName).matches()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parse {@code release.enabled} from the template's {@code promptlm.yml}.
     * Defaults to {@code false} when the file is missing or the flag cannot be
     * read so that the safer Mode 1 (prompt management) layout is produced.
     *
     * <p>The parsing intentionally avoids pulling in a full YAML library here:
     * only one flag is consulted and it sits at a fixed location in the
     * template. A regex over the indented {@code release.enabled} key is
     * sufficient and keeps this low-level component dependency-free.
     */
    static boolean isReleaseEnabled(byte[] configBytes) {
        if (configBytes == null || configBytes.length == 0) {
            return false;
        }
        String yaml = new String(configBytes, StandardCharsets.UTF_8);
        Matcher matcher = Pattern
                .compile("(?m)^\\s+enabled:\\s*(true|false)\\b")
                .matcher(stripCommentsAndIsolateReleaseBlock(yaml));
        if (matcher.find()) {
            return Boolean.parseBoolean(matcher.group(1));
        }
        return false;
    }

    private static String stripCommentsAndIsolateReleaseBlock(String yaml) {
        List<String> lines = new ArrayList<>();
        boolean inReleaseBlock = false;
        for (String rawLine : yaml.split("\\R", -1)) {
            String line = stripInlineComment(rawLine);
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (line.startsWith("release:")) {
                inReleaseBlock = true;
                continue;
            }
            if (inReleaseBlock) {
                if (!Character.isWhitespace(line.charAt(0))) {
                    break;
                }
                lines.add(line);
            }
        }
        return String.join("\n", lines);
    }

    private static String stripInlineComment(String line) {
        int hashIndex = line.indexOf('#');
        if (hashIndex < 0) {
            return line;
        }
        return line.substring(0, hashIndex);
    }
}
