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

package dev.promptlm.cli;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PromptLmUiPathResolverTest {

    @TempDir
    Path tempDir;

    @Test
    void resolvesBundledHostFromAncestorBinDirectory() throws IOException {
        Path helper = tempDir.resolve("bin").resolve(helperName());
        Files.createDirectories(helper.getParent());
        Files.writeString(helper, "placeholder");
        helper.toFile().setExecutable(true);

        PromptLmUiPathResolver resolver = new PromptLmUiPathResolver(tempDir.resolve("nested").resolve("cwd"));
        Files.createDirectories(tempDir.resolve("nested").resolve("cwd"));

        PromptLmUiPathResolver.LaunchTarget target = resolver.resolveBundledHost(8085).orElseThrow();

        assertEquals(tempDir, target.workingDirectory());
        assertEquals(helper.toString(), target.command().get(0));
        assertTrue(target.command().contains("--server.port=8085"));
    }

    @Test
    void throwsWhenBundledHostIsMissing() throws IOException {
        PromptLmUiPathResolver resolver = new PromptLmUiPathResolver(tempDir.resolve("cwd"));
        Files.createDirectories(tempDir.resolve("cwd"));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> resolver.resolve(8092));
        assertTrue(exception.getMessage().contains("promptlm-webapp"));
        assertTrue(exception.getMessage().contains("fallback is disabled"));
    }

    private static String helperName() {
        return isWindows() ? "promptlm-webapp.exe" : "promptlm-webapp";
    }

    private static boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase().contains("win");
    }
}
