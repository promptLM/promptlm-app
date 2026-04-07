package dev.promptlm.store.github;

import dev.promptlm.domain.BasicAppContext;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.URIish;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class GitCloneDefaultBranchTest {

    @Test
    void cloneRepositoryShouldRespectRemoteDefaultBranchWhenNotMain(@TempDir Path tempDir) throws Exception {
        Path remoteDir = tempDir.resolve("remote.git");
        Path sourceDir = tempDir.resolve("source");
        Path clonesDir = tempDir.resolve("clones");
        Files.createDirectories(clonesDir);

        String remoteUri = remoteDir.toUri().toString();

        try (org.eclipse.jgit.api.Git ignored = org.eclipse.jgit.api.Git.init()
                .setBare(true)
                .setInitialBranch("master")
                .setDirectory(remoteDir.toFile())
                .call()) {
            // remote initialized
        }

        try (org.eclipse.jgit.api.Git source = org.eclipse.jgit.api.Git.init()
                .setInitialBranch("master")
                .setDirectory(sourceDir.toFile())
                .call()) {
            StoredConfig config = source.getRepository().getConfig();
            config.setString("user", null, "name", "test");
            config.setString("user", null, "email", "test@example.com");
            config.save();

            Files.writeString(sourceDir.resolve("README.md"), "hello\n");
            source.add().addFilepattern("README.md").call();
            source.commit().setMessage("initial").call();

            source.remoteAdd().setName("origin").setUri(new URIish(remoteUri)).call();
            source.push()
                    .setRemote("origin")
                    .setRefSpecs(new RefSpec("master:refs/heads/master"))
                    .call();
        }

        GitHubProperties properties = new GitHubProperties();
        properties.setUsername("user");
        properties.setToken("token");
        properties.setBaseUrl("http://localhost");

        Git git = new Git(
                new EnvGitCredentialsProvider(properties),
                new TrustedRemotePolicy(properties),
                new BasicAppContext()
        );
        git.cloneRepository(remoteUri, clonesDir.toFile());

        Path clonedDir = clonesDir.resolve("remote");
        assertThat(clonedDir).isDirectory();

        try (org.eclipse.jgit.api.Git cloned = org.eclipse.jgit.api.Git.open(clonedDir.toFile())) {
            assertThat(cloned.getRepository().getBranch()).isEqualTo("master");
        }
    }
}
