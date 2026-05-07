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

import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.domain.promptspec.PromptSpec;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Pure-data assembler that turns the version history of a single
 * {@link PromptSpec} into a paged {@link RepoHistoryPage} of older
 * executions — i.e. executions captured against revisions other than
 * the latest version's revision.
 *
 * <p>Same-revision-but-shape-divergent executions on the latest
 * version are <em>not</em> returned: per issue #100, the live
 * executions strip applies request-shape diffing client-side, and the
 * server only surfaces what the strip can't already show.
 */
public final class RepoHistoryAssembler {

    public static final int DEFAULT_PAGE_SIZE = 50;
    public static final int MAX_PAGE_SIZE = 200;

    private RepoHistoryAssembler() {
    }

    /**
     * Assemble a page of older executions.
     *
     * @param latest    the current latest version of the prompt — its executions are excluded
     * @param versions  every version returned by {@code PromptStore.listVersions(id)}, in any order
     * @param filter    revision and status filters
     * @param page      1-indexed page number; values &lt; 1 are clamped to 1
     * @param pageSize  values are clamped to [1, {@value #MAX_PAGE_SIZE}]
     */
    public static RepoHistoryPage assemble(
            PromptSpec latest,
            List<PromptSpec> versions,
            RepoHistoryFilter filter,
            int page,
            int pageSize) {

        Objects.requireNonNull(latest, "latest");
        Objects.requireNonNull(versions, "versions");
        Objects.requireNonNull(filter, "filter");

        int safePage = Math.max(page, 1);
        int safePageSize = clampPageSize(pageSize);

        List<Execution> older = collectOlderExecutions(versions, latest);
        applyFilters(older, filter);
        older.sort(Comparator.comparing(Execution::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));

        int total = older.size();
        int fromIndex = Math.min((safePage - 1) * safePageSize, total);
        int toIndex = Math.min(fromIndex + safePageSize, total);
        List<Execution> items = new ArrayList<>(older.subList(fromIndex, toIndex));
        boolean hasMore = toIndex < total;

        return new RepoHistoryPage(items, safePage, safePageSize, total, hasMore);
    }

    /** Clamp a requested page size into the allowed range, defaulting empty / non-positive values. */
    public static int clampPageSize(int requested) {
        if (requested <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requested, MAX_PAGE_SIZE);
    }

    private static List<Execution> collectOlderExecutions(List<PromptSpec> versions, PromptSpec latest) {
        List<Execution> collected = new ArrayList<>();
        for (PromptSpec version : versions) {
            if (version == null || isSameVersion(version, latest)) {
                continue;
            }
            List<Execution> executions = version.getExecutions();
            if (executions == null) {
                continue;
            }
            for (Execution execution : executions) {
                if (execution != null) {
                    collected.add(execution);
                }
            }
        }
        return collected;
    }

    /**
     * Two {@link PromptSpec}s represent the same stored version when they share
     * id, version string, and revision number. Reference equality is the common
     * case (the latest spec is usually the same instance returned by the store
     * for that version), but {@code listVersions} may return fresh instances.
     */
    private static boolean isSameVersion(PromptSpec a, PromptSpec b) {
        if (a == b) {
            return true;
        }
        return Objects.equals(a.getId(), b.getId())
                && Objects.equals(a.getVersion(), b.getVersion())
                && a.getRevision() == b.getRevision();
    }

    private static void applyFilters(List<Execution> executions, RepoHistoryFilter filter) {
        filter.revision().ifPresent(rev ->
                executions.removeIf(e -> !rev.equals(e.getRevision())));
        filter.statusOk().ifPresent(ok ->
                executions.removeIf(e -> e.okOrDefault() != ok));
    }
}
