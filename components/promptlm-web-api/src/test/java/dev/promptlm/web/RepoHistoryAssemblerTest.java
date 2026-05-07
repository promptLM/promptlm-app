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

package dev.promptlm.web;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class RepoHistoryAssemblerTest {

    @Test
    void assembleReturnsEmptyPageWhenOnlyLatestVersionExists() {
        PromptSpec latest = version(2, "r2", List.of(execution("e1", "r2", true)));

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(latest), RepoHistoryFilter.none(), 1, 50);

        assertThat(page.items()).isEmpty();
        assertThat(page.total()).isZero();
        assertThat(page.hasMore()).isFalse();
        assertThat(page.page()).isEqualTo(1);
        assertThat(page.pageSize()).isEqualTo(50);
    }

    @Test
    void assembleExcludesLatestVersionsExecutions() {
        Execution oldRun = execution("old-1", "r1", true);
        Execution latestRun = execution("latest-1", "r2", true);
        PromptSpec older = version(1, "r1", List.of(oldRun));
        PromptSpec latest = version(2, "r2", List.of(latestRun));

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest), RepoHistoryFilter.none(), 1, 50);

        assertThat(page.items()).extracting(Execution::getId).containsExactly("old-1");
    }

    @Test
    void assembleSortsExecutionsNewestFirstWithNullsLast() {
        Execution withTs = execution("with-ts", "r1", true, Instant.parse("2026-04-01T00:00:00Z"));
        Execution newer = execution("newer", "r1", true, Instant.parse("2026-04-02T00:00:00Z"));
        Execution noTs = execution("no-ts", "r1", true, null);
        PromptSpec older = version(1, "r1", List.of(withTs, noTs, newer));
        PromptSpec latest = version(2, "r2", List.of());

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest), RepoHistoryFilter.none(), 1, 50);

        assertThat(page.items()).extracting(Execution::getId)
                .containsExactly("newer", "with-ts", "no-ts");
    }

    @Test
    void assembleFiltersByRevision() {
        Execution r1 = execution("e1", "r1", true);
        Execution r2 = execution("e2", "r2", true);
        Execution otherR1 = execution("e3", "r1", true);
        PromptSpec v1 = version(1, "r1", List.of(r1, otherR1));
        PromptSpec v2 = version(2, "r2", List.of(r2));
        PromptSpec latest = version(3, "r3", List.of());

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(v1, v2, latest),
                new RepoHistoryFilter(Optional.of("r1"), Optional.empty()),
                1, 50);

        assertThat(page.items()).extracting(Execution::getId).containsExactlyInAnyOrder("e1", "e3");
        assertThat(page.total()).isEqualTo(2);
    }

    @Test
    void assembleFiltersByStatusOk() {
        Execution ok1 = execution("ok-1", "r1", true);
        Execution fail1 = execution("fail-1", "r1", false);
        Execution ok2 = execution("ok-2", "r1", true);
        PromptSpec older = version(1, "r1", List.of(ok1, fail1, ok2));
        PromptSpec latest = version(2, "r2", List.of());

        RepoHistoryPage okPage = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest),
                new RepoHistoryFilter(Optional.empty(), Optional.of(true)),
                1, 50);

        assertThat(okPage.items()).extracting(Execution::getId).containsExactlyInAnyOrder("ok-1", "ok-2");

        RepoHistoryPage failPage = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest),
                new RepoHistoryFilter(Optional.empty(), Optional.of(false)),
                1, 50);

        assertThat(failPage.items()).extracting(Execution::getId).containsExactly("fail-1");
    }

    @Test
    void assembleTreatsNullOkAsSuccessForFilteringPurposes() {
        Execution legacy = execution("legacy", "r1", null);
        PromptSpec older = version(1, "r1", List.of(legacy));
        PromptSpec latest = version(2, "r2", List.of());

        RepoHistoryPage okPage = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest),
                new RepoHistoryFilter(Optional.empty(), Optional.of(true)),
                1, 50);

        assertThat(okPage.items()).extracting(Execution::getId).containsExactly("legacy");
    }

    @Test
    void assembleHonoursPaginationAtBoundaries() {
        List<Execution> seventyFive = new java.util.ArrayList<>();
        for (int i = 0; i < 75; i++) {
            seventyFive.add(execution("e-" + i, "r1", true,
                    Instant.parse("2026-04-01T00:00:00Z").plusSeconds(i)));
        }
        PromptSpec older = version(1, "r1", seventyFive);
        PromptSpec latest = version(2, "r2", List.of());
        List<PromptSpec> versions = List.of(older, latest);

        RepoHistoryPage first = RepoHistoryAssembler.assemble(
                latest, versions, RepoHistoryFilter.none(), 1, 50);
        assertThat(first.items()).hasSize(50);
        assertThat(first.total()).isEqualTo(75);
        assertThat(first.hasMore()).isTrue();

        RepoHistoryPage second = RepoHistoryAssembler.assemble(
                latest, versions, RepoHistoryFilter.none(), 2, 50);
        assertThat(second.items()).hasSize(25);
        assertThat(second.hasMore()).isFalse();

        RepoHistoryPage beyond = RepoHistoryAssembler.assemble(
                latest, versions, RepoHistoryFilter.none(), 3, 50);
        assertThat(beyond.items()).isEmpty();
        assertThat(beyond.total()).isEqualTo(75);
        assertThat(beyond.hasMore()).isFalse();
    }

    @Test
    void assembleClampsPageSizeAboveMaximum() {
        PromptSpec older = version(1, "r1", List.of(execution("e", "r1", true)));
        PromptSpec latest = version(2, "r2", List.of());

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest), RepoHistoryFilter.none(), 1, 999);

        assertThat(page.pageSize()).isEqualTo(RepoHistoryAssembler.MAX_PAGE_SIZE);
    }

    @Test
    void assembleAppliesDefaultPageSizeForNonPositiveValues() {
        PromptSpec older = version(1, "r1", List.of(execution("e", "r1", true)));
        PromptSpec latest = version(2, "r2", List.of());

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest), RepoHistoryFilter.none(), 1, 0);

        assertThat(page.pageSize()).isEqualTo(RepoHistoryAssembler.DEFAULT_PAGE_SIZE);
    }

    @Test
    void assembleTreatsPageBelowOneAsFirstPage() {
        Execution e = execution("e", "r1", true);
        PromptSpec older = version(1, "r1", List.of(e));
        PromptSpec latest = version(2, "r2", List.of());

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest), RepoHistoryFilter.none(), -3, 50);

        assertThat(page.page()).isEqualTo(1);
        assertThat(page.items()).extracting(Execution::getId).containsExactly("e");
    }

    @Test
    void assembleSkipsNullVersionsAndExecutionsDefensively() {
        Execution kept = execution("kept", "r1", true);
        PromptSpec olderWithNullExec = PromptSpec.builder()
                .withGroup("support").withName("welcome").withVersion("1")
                .withRevision(1).withDescription("desc")
                .withRequest(emptyRequest())
                .withExecutions(java.util.Arrays.asList(null, kept))
                .build();
        PromptSpec latest = version(2, "r2", List.of());
        java.util.List<PromptSpec> versions = java.util.Arrays.asList(null, olderWithNullExec, latest);

        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, versions, RepoHistoryFilter.none(), 1, 50);

        assertThat(page.items()).extracting(Execution::getId).containsExactly("kept");
    }

    @Test
    @Tag("performance-smoke")
    void assemblePerformanceSmokeForLargeDataset() {
        int count = 10_000;
        List<Execution> many = new java.util.ArrayList<>(count);
        Instant base = Instant.parse("2026-01-01T00:00:00Z");
        for (int i = 0; i < count; i++) {
            many.add(execution("e-" + i, "r1", i % 2 == 0, base.plusSeconds(i)));
        }
        PromptSpec older = version(1, "r1", many);
        PromptSpec latest = version(2, "r2", List.of());

        long start = System.nanoTime();
        RepoHistoryPage page = RepoHistoryAssembler.assemble(
                latest, List.of(older, latest),
                new RepoHistoryFilter(Optional.empty(), Optional.of(true)),
                1, 50);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000L;

        assertThat(page.items()).hasSize(50);
        assertThat(page.total()).isEqualTo(count / 2);
        assertThat(elapsedMs).as("assemble should complete within 1s for 10k executions").isLessThan(1_000);
    }

    private static PromptSpec version(int revision, String versionString, List<Execution> executions) {
        return PromptSpec.builder()
                .withGroup("support")
                .withName("welcome")
                .withVersion(versionString)
                .withRevision(revision)
                .withDescription("desc")
                .withRequest(emptyRequest())
                .withExecutions(executions)
                .build();
    }

    private static ChatCompletionRequest emptyRequest() {
        return ChatCompletionRequest.builder()
                .withVendor("openai")
                .withModel("gpt-4o")
                .withMessages(List.of())
                .build();
    }

    private static Execution execution(String id, String revision, Boolean ok) {
        return execution(id, revision, ok, Instant.parse("2026-04-01T00:00:00Z"));
    }

    private static Execution execution(String id, String revision, Boolean ok, Instant timestamp) {
        Execution e = new Execution();
        e.setId(id);
        e.setRevision(revision);
        e.setOk(ok);
        e.setTimestamp(timestamp);
        return e;
    }
}
