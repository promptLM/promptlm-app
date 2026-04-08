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

import dev.promptlm.domain.BasicAppContext;
import org.eclipse.jgit.lib.StoredConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitPushSafetyTest {

    /**
     * Ensures normal store operations never force-push: if the remote advanced, pushing from an out-of-date clone
     * must fail with a non-fast-forward rejection so remote history cannot be rewritten.
     */
    @Test
    void pushAllShouldFailOnNonFastForwardInsteadOfForcePushing(@TempDir Path tempDir) throws Exception {
        Path remoteDir = tempDir.resolve("remote.git");
        Path repo1Dir = tempDir.resolve("repo1");
        Path repo2Dir = tempDir.resolve("repo2");

        String remoteUri = remoteDir.toUri().toString();

        try (org.eclipse.jgit.api.Git ignored = org.eclipse.jgit.api.Git.init()
                .setBare(true)
                .setDirectory(remoteDir.toFile())
                .call()) {
            // bare remote created
        }

        GitHubProperties properties = new GitHubProperties();
        properties.setUsername("user");
        properties.setToken("token");
        properties.setBaseUrl("http://localhost");

        EnvGitCredentialsProvider credentialsProvider = new EnvGitCredentialsProvider(properties);
        Git git = new Git(credentialsProvider, new TrustedRemotePolicy(properties), new BasicAppContext());

        git.createRepository(repo1Dir, remoteUri);
        configureIdentity(repo1Dir);

        Files.writeString(repo1Dir.resolve("README.md"), "v1\n");

        git.addAllAndCommit(repo1Dir.toFile(), "c1");
        git.pushAll(repo1Dir.toFile());

        try (org.eclipse.jgit.api.Git ignored = org.eclipse.jgit.api.Git.cloneRepository()
                .setURI(remoteUri)
                .setBranch("main")
                .setDirectory(repo2Dir.toFile())
                .call()) {
            // clone created
        }

        configureIdentity(repo2Dir);

        Files.writeString(repo1Dir.resolve("README.md"), "v2\n");
        git.addAllAndCommit(repo1Dir.toFile(), "c2");
        git.pushAll(repo1Dir.toFile());

        Files.writeString(repo2Dir.resolve("README.md"), "v3\n");
        git.addAllAndCommit(repo2Dir.toFile(), "c3");

        assertThatThrownBy(() -> git.pushAll(repo2Dir.toFile()))
                .isInstanceOf(GitException.class)
                .hasMessageContaining("non-fast-forward");
    }

    private static void configureIdentity(Path repoDir) throws Exception {
        try (org.eclipse.jgit.api.Git repo = org.eclipse.jgit.api.Git.open(repoDir.toFile())) {
            StoredConfig config = repo.getRepository().getConfig();
            config.setString("user", null, "name", "test");
            config.setString("user", null, "email", "test@example.com");
            config.save();
        }
    }
}
