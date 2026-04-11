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

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IntVersioningStrategyTest {

    private final IntVersioningStrategy strategy = new IntVersioningStrategy();

    @Test
    void nextDevelopmentVersionSupportsLegacyIntegerSnapshots() {
        assertThat(strategy.getNextDevelopmentVersion(spec("1-SNAPSHOT"))).isEqualTo("2-SNAPSHOT");
        assertThat(strategy.getNextDevelopmentVersion(spec("2"))).isEqualTo("3-SNAPSHOT");
    }

    @Test
    void nextDevelopmentVersionSupportsSemverSnapshots() {
        assertThat(strategy.getNextDevelopmentVersion(spec("1.0.0-SNAPSHOT"))).isEqualTo("1.0.1-SNAPSHOT");
        assertThat(strategy.getNextDevelopmentVersion(spec("1.2.3"))).isEqualTo("1.2.4-SNAPSHOT");
    }

    @Test
    void releaseVersionStripsSnapshotSuffix() {
        assertThat(strategy.calculateReleaseVersion(spec("2-SNAPSHOT"))).isEqualTo("2");
        assertThat(strategy.calculateReleaseVersion(spec("1.0.0-SNAPSHOT"))).isEqualTo("1.0.0");
    }

    @Test
    void emptyVersionDefaultsToInitialReleaseAndSnapshot() {
        assertThat(strategy.calculateReleaseVersion(spec(""))).isEqualTo("1");
        assertThat(strategy.getNextDevelopmentVersion(spec(""))).isEqualTo("1-SNAPSHOT");
    }

    @Test
    void unsupportedVersionFormatFailsFast() {
        assertThatThrownBy(() -> strategy.getNextDevelopmentVersion(spec("v1")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported prompt version format");
    }

    private PromptSpec spec(String version) {
        return PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion(version)
                .withRevision(1)
                .withDescription("description")
                .withRequest(ChatCompletionRequest.builder()
                        .withType(ChatCompletionRequest.TYPE)
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of())
                        .build())
                .build();
    }
}
