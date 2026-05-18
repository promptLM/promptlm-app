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
import dev.promptlm.domain.promptspec.PromptSpecLifecycleState;
import dev.promptlm.domain.promptspec.ReleaseMetadata;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * API-boundary assembler that turns a domain {@link PromptSpec} into the
 * dedicated {@link PromptSpecResponseDto} returned by the HTTP controllers.
 *
 * <p>The DTO holds the server-derived UI hints (lifecycle state, HEAD short
 * SHA, release tag) that used to be stamped onto {@link PromptSpec} via
 * withers. Keeping them on the DTO means the domain type stays free of
 * API-only fields while the JSON wire format consumed by the frontend stays
 * byte-identical.
 *
 * <p>Apply at every controller return path that surfaces a {@link PromptSpec}
 * so the frontend can rely on {@code executions[0]} being the most recent
 * run and on the boundary hints being present when derivable.
 */
final class PromptSpecApiView {

    private static final Comparator<Execution> NEWEST_FIRST = Comparator
            .comparing(PromptSpecApiView::timestampOrEpoch, Comparator.reverseOrder());

    private PromptSpecApiView() {
    }

    static PromptSpecResponseDto toApiView(PromptSpec spec) {
        return toApiView(spec, null);
    }

    /**
     * Returns the spec mapped for HTTP output (executions newest-first) with
     * the derived lifecycle state, HEAD short SHA, and release tag attached
     * to the DTO. Pass {@code null} for {@code deriver} when the caller has
     * no lifecycle context (e.g. internal mappings or tests of unrelated
     * code paths) — the lifecycle and SHA fields are then omitted from JSON.
     */
    static PromptSpecResponseDto toApiView(PromptSpec spec, PromptSpecLifecycleDeriver deriver) {
        if (spec == null) {
            return null;
        }
        PromptSpec sorted = sortExecutionsNewestFirst(spec);
        PromptSpecLifecycleState lifecycleState = null;
        String headShortSha = null;
        if (deriver != null) {
            PromptSpecLifecycleDeriver.Result result = deriver.deriveResult(sorted);
            if (result != null) {
                lifecycleState = result.state();
                headShortSha = result.headShortSha();
            }
        }
        String releaseTag = releaseTagOrNull(sorted);
        return new PromptSpecResponseDto(sorted, lifecycleState, headShortSha, releaseTag);
    }

    static List<PromptSpecResponseDto> toApiView(List<PromptSpec> specs) {
        return toApiView(specs, null);
    }

    static List<PromptSpecResponseDto> toApiView(List<PromptSpec> specs, PromptSpecLifecycleDeriver deriver) {
        if (specs == null) {
            return null;
        }
        List<PromptSpecResponseDto> mapped = new ArrayList<>(specs.size());
        for (PromptSpec spec : specs) {
            mapped.add(toApiView(spec, deriver));
        }
        return mapped;
    }

    private static PromptSpec sortExecutionsNewestFirst(PromptSpec spec) {
        List<Execution> executions = spec.getExecutions();
        if (executions == null || executions.size() < 2) {
            return spec;
        }
        List<Execution> sorted = new ArrayList<>(executions);
        sorted.sort(NEWEST_FIRST);
        return spec.withExecutions(sorted);
    }

    private static String releaseTagOrNull(PromptSpec spec) {
        ReleaseMetadata release = spec.getReleaseMetadata();
        if (release == null) {
            return null;
        }
        String tag = release.tag();
        if (tag == null || tag.isBlank()) {
            return null;
        }
        return tag;
    }

    private static Instant timestampOrEpoch(Execution execution) {
        Instant timestamp = execution == null ? null : execution.getTimestamp();
        return timestamp == null ? Instant.EPOCH : timestamp;
    }
}
