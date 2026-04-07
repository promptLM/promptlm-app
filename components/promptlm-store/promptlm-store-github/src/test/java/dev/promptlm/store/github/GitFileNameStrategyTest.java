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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitFileNameStrategyTest {

    private final GitFileNameStrategy strategy = new GitFileNameStrategy();

    @Test
    void buildPromptPathNormalizesToLowercaseSafeSegments() {
        String path = strategy.buildPromptPath("Support-Team", "Quarterly_Report");

        assertThat(path).isEqualTo("prompts/support-team/quarterly_report/promptlm.yml");
    }

    @Test
    void buildPromptPathRejectsTraversalInGroupSegment() {
        assertThatThrownBy(() -> strategy.buildPromptPath("../secrets", "name"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("group contains invalid path segment");
    }

    @Test
    void buildPromptPathRejectsTraversalInNameSegment() {
        assertThatThrownBy(() -> strategy.buildPromptPath("group", "..\\secret"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("name contains invalid path segment");
    }

    @Test
    void buildPromptPathRejectsUnsupportedCharacters() {
        assertThatThrownBy(() -> strategy.buildPromptPath("group one", "name"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("group contains unsupported characters");
    }
}
