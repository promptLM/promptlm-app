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

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * API-boundary view of {@link PromptSpec}. The domain object stays order-agnostic for
 * {@code executions[]}; this helper presents them newest-first when the spec is
 * returned to HTTP callers, matching the {@link RepoHistoryAssembler} contract.
 *
 * <p>Apply at every controller return path that surfaces a {@link PromptSpec} so the
 * frontend can rely on {@code executions[0]} being the most recent run.
 */
final class PromptSpecApiView {

    private static final Comparator<Execution> NEWEST_FIRST = Comparator
            .comparing(PromptSpecApiView::timestampOrEpoch, Comparator.reverseOrder());

    private PromptSpecApiView() {
    }

    static PromptSpec toApiView(PromptSpec spec) {
        if (spec == null) {
            return null;
        }
        List<Execution> executions = spec.getExecutions();
        if (executions == null || executions.size() < 2) {
            return spec;
        }
        List<Execution> sorted = new ArrayList<>(executions);
        sorted.sort(NEWEST_FIRST);
        return spec.withExecutions(sorted);
    }

    static List<PromptSpec> toApiView(List<PromptSpec> specs) {
        if (specs == null) {
            return null;
        }
        List<PromptSpec> mapped = new ArrayList<>(specs.size());
        for (PromptSpec spec : specs) {
            mapped.add(toApiView(spec));
        }
        return mapped;
    }

    private static Instant timestampOrEpoch(Execution execution) {
        Instant timestamp = execution == null ? null : execution.getTimestamp();
        return timestamp == null ? Instant.EPOCH : timestamp;
    }
}
