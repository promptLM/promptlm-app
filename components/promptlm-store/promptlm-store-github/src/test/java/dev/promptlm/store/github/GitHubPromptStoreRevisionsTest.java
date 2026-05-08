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
import dev.promptlm.store.api.Revision;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.revwalk.RevCommit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

/**
 * Integration tests for {@link GitHubPromptStore#listRevisions(String, String)}
 * exercised against a real local JGit repository seeded per-test.
 */
class GitHubPromptStoreRevisionsTest {

    @Test
    void listRevisionsReturnsAddEditEditNewestFirst(@TempDir Path repoDir) throws Exception {
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            commitPromptYaml(jgit, repoDir, "support", "welcome",
                    "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.0'\nrevision: 1\ndescription: 'first'\n",
                    "Add welcome prompt", Instant.parse("2026-03-01T10:00:00Z"));

            commitPromptYaml(jgit, repoDir, "support", "welcome",
                    "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.1'\nrevision: 2\ndescription: 'tweak'\n",
                    "Tweak welcome copy", Instant.parse("2026-03-15T11:00:00Z"));

            commitPromptYaml(jgit, repoDir, "support", "welcome",
                    "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.2'\nrevision: 3\ndescription: 'final'\n",
                    "Polish welcome copy", Instant.parse("2026-04-02T12:00:00Z"));
        }

        GitHubPromptStore store = newStore(repoDir);
        List<Revision> revisions = store.listRevisions("support", "welcome");

        assertThat(revisions).hasSize(3);
        assertThat(revisions).extracting(Revision::rev).containsExactly("r3", "r2", "r1");
        assertThat(revisions).extracting(Revision::kind)
                .containsExactly(Revision.Kind.EDIT, Revision.Kind.EDIT, Revision.Kind.ADD);
        assertThat(revisions).extracting(Revision::msg)
                .containsExactly("Polish welcome copy", "Tweak welcome copy", "Add welcome prompt");
        assertThat(revisions).extracting(Revision::author).allMatch("PromptLM Test"::equals);
        assertThat(revisions.get(0).when()).isEqualTo(Instant.parse("2026-04-02T12:00:00Z"));
        assertThat(revisions.get(2).when()).isEqualTo(Instant.parse("2026-03-01T10:00:00Z"));

        // Snapshots deserialize against the current schema for valid YAML.
        assertThat(revisions.get(0).spec()).isNotNull();
        assertThat(revisions.get(0).spec().getDescription()).isEqualTo("final");
        assertThat(revisions.get(2).spec().getDescription()).isEqualTo("first");
    }

    @Test
    void listRevisionsReportsRemoveWhenSpecFileIsDeleted(@TempDir Path repoDir) throws Exception {
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            commitPromptYaml(jgit, repoDir, "support", "old-prompt",
                    "id: support/old-prompt\nname: old-prompt\ngroup: support\nversion: '1.0'\nrevision: 1\ndescription: 'gone soon'\n",
                    "Add old-prompt", Instant.parse("2026-02-01T10:00:00Z"));

            // Delete the file in a follow-up commit.
            Path promptFile = repoDir.resolve("prompts/support/old-prompt/promptlm.yml");
            Files.delete(promptFile);
            jgit.add().addFilepattern("prompts/support/old-prompt/promptlm.yml").setUpdate(true).call();
            commit(jgit, "Retire old-prompt", Instant.parse("2026-02-15T10:00:00Z"));
        }

        GitHubPromptStore store = newStore(repoDir);
        List<Revision> revisions = store.listRevisions("support", "old-prompt");

        assertThat(revisions).hasSize(2);
        assertThat(revisions).extracting(Revision::kind)
                .containsExactly(Revision.Kind.REMOVE, Revision.Kind.ADD);
        // The REMOVE commit doesn't carry a parseable spec because the file is gone.
        assertThat(revisions.get(0).spec()).isNull();
        assertThat(revisions.get(1).spec()).isNotNull();
    }

    @Test
    void listRevisionsDetectsRenameWithIdenticalContent(@TempDir Path repoDir) throws Exception {
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            String originalYaml = "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.0'\nrevision: 1\ndescription: 'rename me'\n";
            commitPromptYaml(jgit, repoDir, "support", "welcome",
                    originalYaml,
                    "Add welcome prompt", Instant.parse("2026-01-10T10:00:00Z"));

            // Rename: delete old path, write the same content at the new path
            // — exact rename detection picks this up via blob-SHA match.
            Path oldFile = repoDir.resolve("prompts/support/welcome/promptlm.yml");
            Files.delete(oldFile);
            jgit.add().addFilepattern("prompts/support/welcome/promptlm.yml").setUpdate(true).call();

            Path newFile = repoDir.resolve("prompts/support/greeting/promptlm.yml");
            Files.createDirectories(newFile.getParent());
            Files.writeString(newFile, originalYaml);
            jgit.add().addFilepattern("prompts/support/greeting/promptlm.yml").call();
            commit(jgit, "Rename welcome -> greeting", Instant.parse("2026-01-20T11:00:00Z"));
        }

        GitHubPromptStore store = newStore(repoDir);

        // From the new path's perspective: the rename commit shows up as the
        // single revision and is classified as RENAME (the same blob existed
        // at the old path in the parent and is gone at that path now).
        List<Revision> fromNewPath = store.listRevisions("support", "greeting");
        assertThat(fromNewPath).hasSize(1);
        assertThat(fromNewPath.get(0).kind()).isEqualTo(Revision.Kind.RENAME);

        // From the old path's perspective: the same commit is also classified
        // as RENAME (the blob reappeared at the new path).
        List<Revision> fromOldPath = store.listRevisions("support", "welcome");
        assertThat(fromOldPath).extracting(Revision::kind)
                .first()
                .isEqualTo(Revision.Kind.RENAME);
    }

    @Test
    void listRevisionsTreatsRenameWithEditAsAddOnNewPath(@TempDir Path repoDir) throws Exception {
        // Exact rename detection only catches identical-content renames.
        // A rename + edit is intentionally classified as ADD/REMOVE so we
        // don't false-positive on similar-but-not-equal content.
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            String originalYaml = "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.0'\nrevision: 1\ndescription: 'before'\n";
            commitPromptYaml(jgit, repoDir, "support", "welcome",
                    originalYaml,
                    "Add welcome", Instant.parse("2026-02-01T10:00:00Z"));

            Path oldFile = repoDir.resolve("prompts/support/welcome/promptlm.yml");
            Files.delete(oldFile);
            jgit.add().addFilepattern("prompts/support/welcome/promptlm.yml").setUpdate(true).call();

            Path newFile = repoDir.resolve("prompts/support/greeting/promptlm.yml");
            Files.createDirectories(newFile.getParent());
            Files.writeString(newFile,
                    "id: support/greeting\nname: greeting\ngroup: support\nversion: '1.1'\nrevision: 2\ndescription: 'after'\n");
            jgit.add().addFilepattern("prompts/support/greeting/promptlm.yml").call();
            commit(jgit, "Rename + tweak", Instant.parse("2026-02-15T10:00:00Z"));
        }

        GitHubPromptStore store = newStore(repoDir);
        List<Revision> fromNewPath = store.listRevisions("support", "greeting");
        assertThat(fromNewPath).hasSize(1);
        assertThat(fromNewPath.get(0).kind()).isEqualTo(Revision.Kind.ADD);
    }

    @Test
    void listRevisionsReturnsEmptyWhenPromptHasNoHistory(@TempDir Path repoDir) throws Exception {
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            commitPromptYaml(jgit, repoDir, "support", "welcome",
                    "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.0'\nrevision: 1\n",
                    "Add welcome", Instant.parse("2026-03-01T10:00:00Z"));
        }

        GitHubPromptStore store = newStore(repoDir);
        List<Revision> revisions = store.listRevisions("support", "does-not-exist");
        assertThat(revisions).isEmpty();
    }

    @Test
    void listRevisionsRejectsUnsafeSegments(@TempDir Path repoDir) {
        GitHubPromptStore store = newStore(repoDir);
        assertThatThrownBy(() -> store.listRevisions("support", ".."))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("name");
        assertThatThrownBy(() -> store.listRevisions("support", "../escape"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void listRevisionsSoftFailsOnUnparseableYaml(@TempDir Path repoDir) throws Exception {
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            // First commit: garbage YAML that won't deserialize into PromptSpec.
            Path promptFile = repoDir.resolve("prompts/support/welcome/promptlm.yml");
            Files.createDirectories(promptFile.getParent());
            Files.writeString(promptFile,
                    "this is not valid promptspec yaml: [\n: oops\n");
            jgit.add().addFilepattern("prompts/support/welcome/promptlm.yml").call();
            commit(jgit, "Add bogus", Instant.parse("2026-03-01T10:00:00Z"));

            // Second commit: valid YAML.
            Files.writeString(promptFile,
                    "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.0'\nrevision: 2\ndescription: 'fixed'\n");
            jgit.add().addFilepattern("prompts/support/welcome/promptlm.yml").call();
            commit(jgit, "Fix yaml", Instant.parse("2026-03-02T10:00:00Z"));
        }

        GitHubPromptStore store = newStore(repoDir);
        List<Revision> revisions = store.listRevisions("support", "welcome");

        assertThat(revisions).hasSize(2);
        assertThat(revisions.get(0).spec()).isNotNull();
        assertThat(revisions.get(0).spec().getDescription()).isEqualTo("fixed");
        // Older commit has unparseable YAML — soft-fail to spec=null but keep metadata.
        assertThat(revisions.get(1).spec()).isNull();
        assertThat(revisions.get(1).msg()).isEqualTo("Add bogus");
        assertThat(revisions.get(1).kind()).isEqualTo(Revision.Kind.ADD);
    }

    @Test
    void listRevisionsExposesSemverTag(@TempDir Path repoDir) throws Exception {
        RevCommit tagged;
        try (Git jgit = Git.init().setInitialBranch("main").setDirectory(repoDir.toFile()).call()) {
            tagged = commitPromptYaml(jgit, repoDir, "support", "welcome",
                    "id: support/welcome\nname: welcome\ngroup: support\nversion: '1.0.0'\nrevision: 1\n",
                    "Add welcome", Instant.parse("2026-03-01T10:00:00Z"));
            jgit.tag().setName("v1.0.0").setObjectId(tagged).call();
            jgit.tag().setName("not-semver").setObjectId(tagged).call();
        }

        GitHubPromptStore store = newStore(repoDir);
        List<Revision> revisions = store.listRevisions("support", "welcome");

        assertThat(revisions).hasSize(1);
        assertThat(revisions.get(0).tag()).isEqualTo("v1.0.0");
        assertThat(revisions.get(0).sha()).isEqualTo(tagged.name());
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

    private static RevCommit commitPromptYaml(Git jgit,
                                              Path repoDir,
                                              String group,
                                              String name,
                                              String yaml,
                                              String message,
                                              Instant when) throws Exception {
        Path file = repoDir.resolve("prompts").resolve(group).resolve(name).resolve("promptlm.yml");
        Files.createDirectories(file.getParent());
        Files.writeString(file, yaml);
        jgit.add().addFilepattern("prompts/" + group + "/" + name + "/promptlm.yml").call();
        return commit(jgit, message, when);
    }

    private static RevCommit commit(Git jgit, String message, Instant when) throws Exception {
        PersonIdent ident = new PersonIdent(
                "PromptLM Test",
                "promptlm@example.com",
                Date.from(when),
                TimeZone.getTimeZone("UTC"));
        return jgit.commit()
                .setMessage(message)
                .setAuthor(ident)
                .setCommitter(ident)
                .call();
    }
}
