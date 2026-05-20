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

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.ObjectMapperFactory;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;

/**
 * Regression tests for {@link GitHubPromptStore#getLatestVersion(String)} —
 * see promptLM/promptlm-app#218: an unknown id, or a repo containing a spec
 * with a null id, must not throw NPE.
 */
class GitHubPromptStoreGetLatestVersionTest {

    @Test
    void getLatestVersionReturnsEmptyForUnknownId(@TempDir Path repoDir) throws Exception {
        Files.createDirectories(repoDir.resolve("prompts"));

        GitHubPromptStore store = newStore(repoDir);

        Optional<PromptSpec> result = store.getLatestVersion("does-not-exist");

        assertThat(result).isEmpty();
    }

    @Test
    void getLatestVersionDoesNotThrowWhenSpecHasNullId(@TempDir Path repoDir) throws Exception {
        // A malformed spec on disk with no id field — must not blow up the
        // search for an unrelated id.
        Path nullIdSpec = repoDir.resolve("prompts/support/broken/promptlm.yml");
        Files.createDirectories(nullIdSpec.getParent());
        Files.writeString(nullIdSpec,
                "name: broken\ngroup: support\nversion: '1.0'\nrevision: 1\n");

        GitHubPromptStore store = newStore(repoDir);

        assertThatCode(() -> store.getLatestVersion("support/something-else"))
                .doesNotThrowAnyException();
        assertThat(store.getLatestVersion("support/something-else")).isEmpty();
    }

    private static GitHubPromptStore newStore(Path repoDir) {
        AppContext appContext = new BasicAppContext();
        appContext.setActiveProject(ProjectSpec.fromRepo(repoDir));
        return new GitHubPromptStore(
                ObjectMapperFactory.createYamlMapper(),
                new GitFileNameStrategy(),
                mock(dev.promptlm.store.github.Git.class),
                appContext,
                new IntVersioningStrategy(),
                new GitRepositoryMetadata(ObjectMapperFactory.createJsonMapper())
        );
    }
}
