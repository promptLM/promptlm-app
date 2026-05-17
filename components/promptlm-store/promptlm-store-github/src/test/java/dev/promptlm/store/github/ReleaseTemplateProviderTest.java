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

import dev.promptlm.store.api.GeneratedFile;
import dev.promptlm.store.api.ReleaseProvider;
import dev.promptlm.store.api.ReleaseTemplateProvider;
import dev.promptlm.store.api.RepositoryGenerationConfig;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReleaseTemplateProviderTest {

    private final RepositoryGenerationConfig config =
            RepositoryGenerationConfig.defaults("alice", "my-repo");

    @Test
    void noReleaseProviderTargetsNoneAndProducesNoFiles() {
        NoReleaseTemplateProvider provider = new NoReleaseTemplateProvider();

        assertThat(provider.provider()).isEqualTo(ReleaseProvider.NONE);
        assertThat(provider.generateFiles(config)).isEmpty();
    }

    @Test
    void gitHubActionsProviderTargetsGithubActions() {
        GitHubActionsReleaseTemplateProvider provider = new GitHubActionsReleaseTemplateProvider();

        assertThat(provider.provider()).isEqualTo(ReleaseProvider.GITHUB_ACTIONS);
        // Transitional: today the workflow files still ship via the
        // repository-template zip, so this provider returns no files. The
        // assertion documents the contract — see class javadoc.
        assertThat(provider.generateFiles(config)).isEmpty();
    }

    @Test
    void registryShouldResolveProviderByKey() {
        ReleaseTemplateProviderRegistry registry = new ReleaseTemplateProviderRegistry(
                List.of(new NoReleaseTemplateProvider(), new GitHubActionsReleaseTemplateProvider()));

        assertThat(registry.get(ReleaseProvider.NONE)).isInstanceOf(NoReleaseTemplateProvider.class);
        assertThat(registry.get(ReleaseProvider.GITHUB_ACTIONS)).isInstanceOf(GitHubActionsReleaseTemplateProvider.class);
    }

    @Test
    void registryShouldRejectDuplicateProvidersForSameKey() {
        ReleaseTemplateProvider duplicate = new ReleaseTemplateProvider() {
            @Override
            public ReleaseProvider provider() {
                return ReleaseProvider.NONE;
            }

            @Override
            public List<GeneratedFile> generateFiles(RepositoryGenerationConfig config) {
                return List.of();
            }
        };

        assertThatThrownBy(() -> new ReleaseTemplateProviderRegistry(
                List.of(new NoReleaseTemplateProvider(), duplicate)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate");
    }

    @Test
    void registryShouldThrowWhenProviderMissing() {
        ReleaseTemplateProviderRegistry registry = new ReleaseTemplateProviderRegistry(
                List.of(new NoReleaseTemplateProvider()));

        assertThatThrownBy(() -> registry.get(ReleaseProvider.GITHUB_ACTIONS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No ReleaseTemplateProvider");
    }
}
