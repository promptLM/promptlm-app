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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RepositoryGenerationConfigTest {

    @Test
    void shouldFillDefaultDescriptionWhenBlank() {
        RepositoryGenerationConfig config = new RepositoryGenerationConfig(
                "my-repo", "alice", "  ", "main", false, ReleaseProvider.NONE);

        assertThat(config.description()).isEqualTo(RepositoryGenerationConfig.DEFAULT_DESCRIPTION);
    }

    @Test
    void shouldFillDefaultBranchWhenBlank() {
        RepositoryGenerationConfig config = new RepositoryGenerationConfig(
                "my-repo", "alice", "desc", null, false, ReleaseProvider.NONE);

        assertThat(config.defaultBranch()).isEqualTo("main");
    }

    @Test
    void shouldRejectBlankRepositoryName() {
        assertThatThrownBy(() -> new RepositoryGenerationConfig(
                " ", "alice", "desc", "main", false, ReleaseProvider.NONE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repositoryName");
    }

    @Test
    void shouldRejectBlankOwner() {
        assertThatThrownBy(() -> new RepositoryGenerationConfig(
                "my-repo", null, "desc", "main", false, ReleaseProvider.NONE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ownerName");
    }

    @Test
    void defaultsShouldDisableReleaseAndUseDefaults() {
        RepositoryGenerationConfig config = RepositoryGenerationConfig.defaults("alice", "my-repo");

        assertThat(config.repositoryName()).isEqualTo("my-repo");
        assertThat(config.ownerName()).isEqualTo("alice");
        assertThat(config.description()).isEqualTo("A promptLM store");
        assertThat(config.defaultBranch()).isEqualTo("main");
        assertThat(config.releaseEnabled()).isFalse();
        assertThat(config.releaseProvider()).isEqualTo(ReleaseProvider.NONE);
    }

    @Test
    void shouldDefaultReleaseProviderToGithubActionsWhenReleaseEnabled() {
        RepositoryGenerationConfig config = new RepositoryGenerationConfig(
                "my-repo", "alice", "desc", "main", true, null);

        assertThat(config.releaseProvider()).isEqualTo(ReleaseProvider.GITHUB_ACTIONS);
    }

    @Test
    void shouldDefaultReleaseProviderToNoneWhenReleaseDisabled() {
        RepositoryGenerationConfig config = new RepositoryGenerationConfig(
                "my-repo", "alice", "desc", "main", false, null);

        assertThat(config.releaseProvider()).isEqualTo(ReleaseProvider.NONE);
    }

    @Test
    void withDescriptionShouldReturnUpdatedCopy() {
        RepositoryGenerationConfig original = RepositoryGenerationConfig.defaults("alice", "my-repo");

        RepositoryGenerationConfig updated = original.withDescription("custom");

        assertThat(updated.description()).isEqualTo("custom");
        assertThat(original.description()).isEqualTo("A promptLM store");
    }

    @Test
    void withDefaultBranchShouldReturnUpdatedCopy() {
        RepositoryGenerationConfig original = RepositoryGenerationConfig.defaults("alice", "my-repo");

        RepositoryGenerationConfig updated = original.withDefaultBranch("trunk");

        assertThat(updated.defaultBranch()).isEqualTo("trunk");
        assertThat(original.defaultBranch()).isEqualTo("main");
    }
}
