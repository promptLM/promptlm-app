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

import dev.promptlm.repository.template.TemplateContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for {@link ZipFileRepositoryTemplateExtractor} against the real
 * {@code repo-template.zip} packaged on the classpath. Exercises the addressed acceptance
 * criteria of issue #160:
 *
 * <ul>
 *     <li>AC-7: no {@code {{...}}} tokens remain in any text file after extraction.</li>
 *     <li>AC-8: {@code metadata.json} reflects runtime timestamp and generator version.</li>
 *     <li>AC-9: {@code README.md} has no literal {@code {{REPO_NAME}}} / {@code {{PROJECT_DESCRIPTION}}} tokens.</li>
 * </ul>
 */
class ZipFileRepositoryTemplateExtractorSubstitutionTest {

    private static final List<String> TEXT_FILE_EXTENSIONS = List.of(
            ".md", ".json", ".toml", ".yml", ".yaml", ".txt", ".xml", ".properties");

    /**
     * Matches our template-token convention: {@code {{UPPER_SNAKE}}}. Crucially, this is NOT
     * preceded by {@code $}, so it does not match GitHub Actions expressions like
     * {@code ${{ github.event.inputs.x }}} which are intended to survive extraction.
     */
    private static final Pattern UNRESOLVED_TOKEN_PATTERN =
            Pattern.compile("(?<![$])\\{\\{\\s*[A-Z][A-Z0-9_]*\\s*}}");

    @Test
    void extractedRepoHasNoUnresolvedTemplateTokens(@TempDir Path tempDir) throws IOException {
        ZipFileRepositoryTemplateExtractor extractor = new ZipFileRepositoryTemplateExtractor();
        TemplateContext context = new TemplateContext(
                "issue-160-demo",
                "promptLM",
                "issue-160 acceptance prompts",
                Instant.parse("2026-05-17T01:23:45Z"),
                "9.9.9");

        extractor.extractTo(tempDir, context);

        List<Path> textFiles = collectTextFiles(tempDir);
        assertThat(textFiles).isNotEmpty();
        for (Path file : textFiles) {
            String content = Files.readString(file, StandardCharsets.UTF_8);
            Matcher matcher = UNRESOLVED_TOKEN_PATTERN.matcher(content);
            if (matcher.find()) {
                throw new AssertionError("Unresolved template token '" + matcher.group()
                        + "' remains in " + tempDir.relativize(file));
            }
        }
    }

    @Test
    void readmeContainsSubstitutedRepoNameAndDescription(@TempDir Path tempDir) throws IOException {
        ZipFileRepositoryTemplateExtractor extractor = new ZipFileRepositoryTemplateExtractor();
        TemplateContext context = new TemplateContext(
                "issue-160-demo",
                "promptLM",
                "issue-160 acceptance prompts",
                Instant.parse("2026-05-17T01:23:45Z"),
                "9.9.9");

        extractor.extractTo(tempDir, context);

        String readme = Files.readString(tempDir.resolve("README.md"), StandardCharsets.UTF_8);
        assertThat(readme).contains("# issue-160-demo");
        assertThat(readme).contains("issue-160 acceptance prompts");
        assertThat(readme).doesNotContain("{{REPO_NAME}}");
        assertThat(readme).doesNotContain("{{PROJECT_DESCRIPTION}}");
    }

    @Test
    void metadataJsonHasRuntimeTimestampAndGeneratorVersion(@TempDir Path tempDir) throws IOException {
        ZipFileRepositoryTemplateExtractor extractor = new ZipFileRepositoryTemplateExtractor();
        TemplateContext context = new TemplateContext(
                "issue-160-demo",
                "promptLM",
                "issue-160 acceptance prompts",
                Instant.parse("2026-05-17T01:23:45Z"),
                "9.9.9");

        extractor.extractTo(tempDir, context);

        String metadata = Files.readString(tempDir.resolve(".promptlm/metadata.json"), StandardCharsets.UTF_8);
        assertThat(metadata).contains("\"name\": \"issue-160-demo\"");
        assertThat(metadata).contains("\"created\": \"2026-05-17T01:23:45Z\"");
        assertThat(metadata).contains("\"updated\": \"2026-05-17T01:23:45Z\"");
        assertThat(metadata).contains("\"generator_version\": \"9.9.9\"");
        assertThat(metadata).doesNotContain("2025-01-19T22:42:35Z");
        assertThat(metadata).doesNotContain("0.1.0-SNAPSHOT");
        assertThat(metadata).doesNotContain("{{");
    }

    private static List<Path> collectTextFiles(Path root) throws IOException {
        List<Path> files = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(root)) {
            walk.filter(Files::isRegularFile)
                    .sorted(Comparator.naturalOrder())
                    .forEach(p -> {
                        String name = p.getFileName().toString().toLowerCase();
                        for (String ext : TEXT_FILE_EXTENSIONS) {
                            if (name.endsWith(ext)) {
                                files.add(p);
                                return;
                            }
                        }
                        // Also pick up the unextensioned release scripts that we substitute.
                        Path relative = root.relativize(p);
                        if (relative.toString().replace('\\', '/').startsWith("tools/release/")) {
                            files.add(p);
                        }
                    });
        }
        return files;
    }
}
