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
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.ExecutionKind;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Integration test for #140: a {@link PromptSpec} written with {@code executions[]}
 * survives the YAML write/read cycle through {@link GitHubPromptStore}.
 *
 * <p>The lifecycle-level cap-at-5 and revision-bump reset are covered by
 * {@code DefaultPromptLifecycleServiceTest}; here we only verify that the
 * persistence boundary doesn't drop, reorder, or mangle execution entries —
 * the layer the unit tests had to mock.
 */
class GitHubPromptStoreExecutionsRoundTripTest {

    @Test
    void executionsRoundTripThroughYaml(@TempDir Path repoDir) throws Exception {
        try (org.eclipse.jgit.api.Git jgit = org.eclipse.jgit.api.Git.init()
                .setInitialBranch("main")
                .setDirectory(repoDir.toFile())
                .call()) {
            // Seed an initial commit so the repo has HEAD.
            new org.eclipse.jgit.lib.PersonIdent("Test", "test@example.com");
            jgit.commit()
                    .setAllowEmpty(true)
                    .setMessage("init")
                    .setAuthor("Test", "test@example.com")
                    .setCommitter("Test", "test@example.com")
                    .call();
        }

        GitHubPromptStore store = newStore(repoDir);

        ChatCompletionResponse response = new ChatCompletionResponse(120L, null, "answer-text");
        Execution manualExec = new Execution(
                "exec-manual",
                Instant.parse("2026-05-12T12:30:00Z"),
                response,
                null, null,
                120L, null, null, null, null, "3", null, true, null,
                ExecutionKind.MANUAL, null);
        Execution preReleaseExec = new Execution(
                "exec-pre-release",
                Instant.parse("2026-05-12T13:00:00Z"),
                response,
                null, null,
                118L, null, null, null, "pre-release", "3", null, true, null,
                ExecutionKind.PRE_RELEASE, null);

        PromptSpec spec = PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(3)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of(ChatCompletionRequest.Message.builder()
                                .withRole("user")
                                .withContent("hi")
                                .build()))
                        .build())
                .build()
                .withId("support/welcome")
                .withResponse(response)
                .withExecutions(List.of(manualExec, preReleaseExec));

        PromptSpec stored = store.storePrompt(spec);
        assertThat(stored.getExecutions()).hasSize(2);

        Optional<PromptSpec> loaded = store.getLatestVersion("support/welcome");
        assertThat(loaded).isPresent();
        PromptSpec roundTripped = loaded.get();

        assertThat(roundTripped.getExecutions()).hasSize(2);
        assertThat(roundTripped.getExecutions())
                .extracting(Execution::getId)
                .containsExactly("exec-manual", "exec-pre-release");
        assertThat(roundTripped.getExecutions())
                .extracting(Execution::kindOrManual)
                .containsExactly(ExecutionKind.MANUAL, ExecutionKind.PRE_RELEASE);

        Execution loadedManual = roundTripped.getExecutions().get(0);
        assertThat(loadedManual.getResponse()).isInstanceOf(ChatCompletionResponse.class);
        assertThat(((ChatCompletionResponse) loadedManual.getResponse()).getContent()).isEqualTo("answer-text");
        assertThat(loadedManual.getTimestamp()).isEqualTo(Instant.parse("2026-05-12T12:30:00Z"));
        assertThat(loadedManual.getLatencyMs()).isEqualTo(120L);
        assertThat(loadedManual.getRevision()).isEqualTo("3");
        assertThat(loadedManual.getOk()).isTrue();
    }

    @Test
    void emptyExecutionsListSerializesAndReloadsCleanly(@TempDir Path repoDir) throws Exception {
        try (org.eclipse.jgit.api.Git jgit = org.eclipse.jgit.api.Git.init()
                .setInitialBranch("main")
                .setDirectory(repoDir.toFile())
                .call()) {
            jgit.commit()
                    .setAllowEmpty(true)
                    .setMessage("init")
                    .setAuthor("Test", "test@example.com")
                    .setCommitter("Test", "test@example.com")
                    .call();
        }

        GitHubPromptStore store = newStore(repoDir);

        PromptSpec spec = PromptSpec.builder()
                .withGroup("support")
                .withName("empty-exec")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(4)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of(ChatCompletionRequest.Message.builder()
                                .withRole("user")
                                .withContent("hi")
                                .build()))
                        .build())
                .build()
                .withId("support/empty-exec")
                .withExecutions(List.of());

        store.storePrompt(spec);

        PromptSpec roundTripped = store.getLatestVersion("support/empty-exec").orElseThrow();
        // Per the post-revision-bump invariant in #140: cleared executions must reload as
        // an empty/absent list, never as null-with-different-meaning.
        assertThat(roundTripped.getExecutions() == null || roundTripped.getExecutions().isEmpty())
                .as("cleared executions must round-trip as empty/null")
                .isTrue();
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
