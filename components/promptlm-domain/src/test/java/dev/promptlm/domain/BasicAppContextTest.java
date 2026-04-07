package dev.promptlm.domain;

import dev.promptlm.domain.projectspec.ProjectSpec;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class BasicAppContextTest {

    @Test
    void addProjectReplacesExistingProjectWithSameRepositoryPath() {
        BasicAppContext context = new BasicAppContext();

        ProjectSpec first = new ProjectSpec();
        first.setName("first");
        first.setRepoDir(Path.of("/tmp/repo-a"));
        context.addProject(first);

        ProjectSpec replacement = new ProjectSpec();
        replacement.setName("replacement");
        replacement.setRepoDir(Path.of("/tmp/repo-a/."));
        context.addProject(replacement);

        assertThat(context.getProjects()).hasSize(1);
        assertThat(context.getProjects().get(0)).isSameAs(replacement);
    }

    @Test
    void setActiveProjectDoesNotCreateDuplicateForSameRepositoryPath() {
        BasicAppContext context = new BasicAppContext();

        ProjectSpec first = new ProjectSpec();
        first.setName("first");
        first.setRepoDir(Path.of("/tmp/repo-b"));
        context.setActiveProject(first);

        ProjectSpec replacement = new ProjectSpec();
        replacement.setName("replacement");
        replacement.setRepoDir(Path.of("/tmp/repo-b/."));
        context.setActiveProject(replacement);

        assertThat(context.getProjects()).hasSize(1);
        assertThat(context.getActiveProject()).isSameAs(replacement);
    }
}
