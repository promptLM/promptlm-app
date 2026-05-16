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

import java.nio.charset.StandardCharsets;
import java.util.Objects;

/**
 * A single file produced by a release-template (or other repository generation)
 * provider.
 *
 * <p>The {@code relativePath} is interpreted relative to the root of the
 * generated repository and must use forward slashes; it must not be absolute
 * and must not contain {@code ".."} segments.
 *
 * <p>The {@code content} byte array is treated as immutable by convention —
 * callers must not mutate the array after constructing a {@code GeneratedFile}.
 *
 * @param relativePath repository-relative path (e.g.
 *                     {@code ".github/workflows/build-artifacts.yml"})
 * @param content      raw file contents
 * @param executable   whether the file should be marked executable when
 *                     written to disk (relevant for shell scripts)
 */
public record GeneratedFile(String relativePath, byte[] content, boolean executable) {

    public GeneratedFile {
        Objects.requireNonNull(relativePath, "relativePath must not be null");
        Objects.requireNonNull(content, "content must not be null");
        if (relativePath.isBlank()) {
            throw new IllegalArgumentException("relativePath must not be blank");
        }
        if (relativePath.startsWith("/")) {
            throw new IllegalArgumentException("relativePath must be repository-relative, not absolute: " + relativePath);
        }
        for (String segment : relativePath.split("/")) {
            if (segment.equals("..")) {
                throw new IllegalArgumentException("relativePath must not contain '..' segments: " + relativePath);
            }
        }
    }

    /**
     * Convenience factory for a text file using UTF-8 encoding.
     */
    public static GeneratedFile textFile(String relativePath, String content) {
        return new GeneratedFile(relativePath, content.getBytes(StandardCharsets.UTF_8), false);
    }

    /**
     * Convenience factory for an executable text file using UTF-8 encoding.
     */
    public static GeneratedFile executableTextFile(String relativePath, String content) {
        return new GeneratedFile(relativePath, content.getBytes(StandardCharsets.UTF_8), true);
    }
}
