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

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ByteArrayResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;

class ZipFileRepositoryRepositoryTemplateExtractorTest {

    @Test
    void extractsTemplateArchive(@TempDir Path tempDir) throws IOException {
        byte[] zipBytes = createTemplateArchive();
        ZipFileRepositoryTemplateExtractor extractor = new ZipFileRepositoryTemplateExtractor(new ByteArrayResource(zipBytes));

        extractor.extractTo(tempDir);

        Path readme = tempDir.resolve("README.md");
        Path nested = tempDir.resolve("docs/info.txt");
        assertThat(readme).exists();
        assertThat(nested).exists();
        assertThat(Files.readString(readme)).isEqualTo("hello world");
        assertThat(Files.readString(nested)).isEqualTo("more info");
    }

    private byte[] createTemplateArchive() throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream)) {
            zipOutputStream.putNextEntry(new ZipEntry("README.md"));
            zipOutputStream.write("hello world".getBytes(StandardCharsets.UTF_8));
            zipOutputStream.closeEntry();

            zipOutputStream.putNextEntry(new ZipEntry("docs/"));
            zipOutputStream.closeEntry();

            zipOutputStream.putNextEntry(new ZipEntry("docs/info.txt"));
            zipOutputStream.write("more info".getBytes(StandardCharsets.UTF_8));
            zipOutputStream.closeEntry();
        }
        return outputStream.toByteArray();
    }
}
