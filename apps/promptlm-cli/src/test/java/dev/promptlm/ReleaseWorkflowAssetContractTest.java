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

package dev.promptlm;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReleaseWorkflowAssetContractTest {

    @Test
    void releaseWorkflowPublishesCliNativeAssetsOnly() throws IOException {
        Path releaseWorkflow = Path.of("..", "..", ".github", "workflows", "release.yml")
                .toAbsolutePath()
                .normalize();
        String content = Files.readString(releaseWorkflow);

        assertTrue(content.contains("target/native/promptlm-cli-linux-*.tar.gz"));
        assertTrue(content.contains("target/native/promptlm-cli-macos-*.tar.gz"));
        assertTrue(content.contains("target/native/promptlm-cli-windows-*.zip"));

        assertFalse(content.contains("target/native/promptlm-webapp-linux-*.tar.gz"));
        assertFalse(content.contains("target/native/promptlm-webapp-macos-*.tar.gz"));
        assertFalse(content.contains("target/native/promptlm-webapp-windows-*.zip"));
    }
}
