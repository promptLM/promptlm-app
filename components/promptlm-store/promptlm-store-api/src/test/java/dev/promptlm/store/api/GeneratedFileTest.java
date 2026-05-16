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

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeneratedFileTest {

    @Test
    void shouldRejectAbsolutePath() {
        assertThatThrownBy(() -> new GeneratedFile("/absolute/path", new byte[0], false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repository-relative");
    }

    @Test
    void shouldRejectTraversalSegment() {
        assertThatThrownBy(() -> new GeneratedFile("foo/../bar", new byte[0], false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("'..'");
    }

    @Test
    void shouldRejectBlankPath() {
        assertThatThrownBy(() -> new GeneratedFile("   ", new byte[0], false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("blank");
    }

    @Test
    void textFileShouldUseUtf8AndNonExecutable() {
        GeneratedFile file = GeneratedFile.textFile("readme.md", "hello");

        assertThat(file.relativePath()).isEqualTo("readme.md");
        assertThat(new String(file.content(), StandardCharsets.UTF_8)).isEqualTo("hello");
        assertThat(file.executable()).isFalse();
    }

    @Test
    void executableTextFileShouldMarkExecutable() {
        GeneratedFile file = GeneratedFile.executableTextFile("tools/run.sh", "#!/bin/sh");

        assertThat(file.executable()).isTrue();
    }
}
