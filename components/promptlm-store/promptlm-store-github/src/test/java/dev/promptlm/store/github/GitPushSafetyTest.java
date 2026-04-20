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
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.StoredConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
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

    /**
     * Verifies that when credentials are configured but the repository's remote points to an HTTP/HTTPS
     * host that does not match the configured backend, pushAll fails with a clear GitException
     * explaining the mismatch — instead of the cryptic JGit "no CredentialsProvider" error.
     */
    @Test
    void pushAllShouldThrowMeaningfulExceptionWhenHttpRemoteIsUntrustedAndCredentialsAreConfigured(@TempDir Path tempDir) throws Exception {
        Path repoDir = tempDir.resolve("repo");

        GitHubProperties properties = new GitHubProperties();
        properties.setUsername("user");
        properties.setToken("secret");
        properties.setBaseUrl("http://localhost:3000");

        Git git = new Git(new EnvGitCredentialsProvider(properties), new TrustedRemotePolicy(properties), new BasicAppContext());

        git.createRepository(repoDir, "http://different-host:8080/owner/repo");
        configureIdentity(repoDir);
        Files.writeString(repoDir.resolve("README.md"), "hello\n");
        git.addAllAndCommit(repoDir.toFile(), "initial commit");

        assertThatThrownBy(() -> git.pushAll(repoDir.toFile()))
                .isInstanceOf(GitException.class)
                .hasMessageContaining("remote host does not match");
    }

    /**
     * Verifies that checkoutOrCreateBranch detects an already-existing local branch and triggers a
     * fetch to pick up remote changes, rather than skipping the fetch due to an incorrect branch
     * name comparison. The assertion checks that refs/remotes/origin/main in repo1 is updated to
     * the commit pushed by a second clone, which can only happen if fetch was actually executed.
     */
    @Test
    void checkoutOrCreateBranchShouldFetchRemoteChangesWhenBranchAlreadyExists(@TempDir Path tempDir) throws Exception {
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

        Git git = new Git(new EnvGitCredentialsProvider(properties), new TrustedRemotePolicy(properties), new BasicAppContext());

        git.createRepository(repo1Dir, remoteUri);
        configureIdentity(repo1Dir);
        Files.writeString(repo1Dir.resolve("README.md"), "v1\n");
        git.addAllAndCommit(repo1Dir.toFile(), "c1");
        git.pushAll(repo1Dir.toFile());

        // Advance the remote: a second clone pushes a new commit
        try (org.eclipse.jgit.api.Git ignored = org.eclipse.jgit.api.Git.cloneRepository()
                .setURI(remoteUri)
                .setBranch("main")
                .setDirectory(repo2Dir.toFile())
                .call()) {
            // clone created
        }
        configureIdentity(repo2Dir);
        Files.writeString(repo2Dir.resolve("update.txt"), "remote change\n");
        git.addAllAndCommit(repo2Dir.toFile(), "c2");
        git.pushAll(repo2Dir.toFile());

        ObjectId c2CommitId;
        try (org.eclipse.jgit.api.Git remote = org.eclipse.jgit.api.Git.open(remoteDir.toFile())) {
            c2CommitId = remote.getRepository().resolve("refs/heads/main");
        }

        // Branch "main" already exists in repo1; checkoutOrCreateBranch should detect it and fetch
        git.checkoutOrCreateBranch("main", repo1Dir.toFile());

        // refs/remotes/origin/main is only updated by fetch, so it must now point to c2
        try (org.eclipse.jgit.api.Git repo1 = org.eclipse.jgit.api.Git.open(repo1Dir.toFile())) {
            ObjectId remoteTracking = repo1.getRepository().resolve("refs/remotes/origin/main");
            assertThat(remoteTracking).isEqualTo(c2CommitId);
        }
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
