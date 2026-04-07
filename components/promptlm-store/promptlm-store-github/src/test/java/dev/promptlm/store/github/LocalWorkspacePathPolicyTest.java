package dev.promptlm.store.github;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalWorkspacePathPolicyTest {

    @Test
    void shouldNormalizeAndAcceptPathWithinWorkspace(@TempDir Path tempDir) {
        StoreLocalProperties properties = new StoreLocalProperties();
        properties.setWorkspaceRoot(tempDir);
        LocalWorkspacePathPolicy policy = new LocalWorkspacePathPolicy(properties);

        Path normalized = policy.assertWithinWorkspace(
                tempDir.resolve("projects").resolve("..").resolve("projects").resolve("repo"),
                "repoDir"
        );

        assertThat(normalized).isEqualTo(tempDir.resolve("projects/repo").toAbsolutePath().normalize());
    }

    @Test
    void shouldRejectPathOutsideWorkspace(@TempDir Path tempDir) {
        StoreLocalProperties properties = new StoreLocalProperties();
        properties.setWorkspaceRoot(tempDir);
        LocalWorkspacePathPolicy policy = new LocalWorkspacePathPolicy(properties);

        assertThatThrownBy(() -> policy.assertWithinWorkspace(Path.of("/tmp/outside"), "repoDir"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repoDir must be located under workspace root");
    }
}
