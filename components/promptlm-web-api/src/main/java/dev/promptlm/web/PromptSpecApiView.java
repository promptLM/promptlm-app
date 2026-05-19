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
import dev.promptlm.domain.promptspec.PromptSpecLifecycleState;
import dev.promptlm.domain.promptspec.ReleaseMetadata;
import dev.promptlm.domain.promptspec.Request;
import dev.promptlm.pricing.ModelPricingService;

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
 *
 * <p><b>Cost-on-read.</b> USD cost is intentionally derived in this view layer
 * rather than persisted on {@link Execution}. The per-model pricing table is
 * mutable external state (operator-managed {@code application.yml}) — if cost
 * were frozen on the domain object, every historical value would become a
 * silent lie the moment a price is corrected. Each execution is projected to
 * an {@link ExecutionResponseDto} that pairs the domain object with the cost
 * derived from the current pricing table; the domain class never sees the
 * pricing service.
 */
final class PromptSpecApiView {

    private static final Comparator<Execution> NEWEST_FIRST = Comparator
            .comparing(PromptSpecApiView::timestampOrEpoch, Comparator.reverseOrder());

    private PromptSpecApiView() {
    }

    static PromptSpecResponseDto toApiView(PromptSpec spec) {
        return toApiView(spec, null, null);
    }

    /**
     * Returns the spec mapped for HTTP output (executions newest-first) with
     * the derived lifecycle state, HEAD short SHA, and release tag attached
     * to the DTO. Pass {@code null} for {@code deriver} when the caller has
     * no lifecycle context (e.g. internal mappings or tests of unrelated
     * code paths) — the lifecycle and SHA fields are then omitted from JSON.
     * Pass {@code null} for {@code pricingService} to skip cost projection
     * (the {@code costUsd} field is then omitted on each execution).
     */
    static PromptSpecResponseDto toApiView(PromptSpec spec,
                                           PromptSpecLifecycleDeriver deriver,
                                           ModelPricingService pricingService) {
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
        List<ExecutionResponseDto> projectedExecutions = projectExecutions(sorted, pricingService);
        return new PromptSpecResponseDto(sorted, projectedExecutions, lifecycleState, headShortSha, releaseTag);
    }

    static List<PromptSpecResponseDto> toApiView(List<PromptSpec> specs) {
        return toApiView(specs, null, null);
    }

    static List<PromptSpecResponseDto> toApiView(List<PromptSpec> specs,
                                                 PromptSpecLifecycleDeriver deriver,
                                                 ModelPricingService pricingService) {
        if (specs == null) {
            return null;
        }
        List<PromptSpecResponseDto> mapped = new ArrayList<>(specs.size());
        for (PromptSpec spec : specs) {
            mapped.add(toApiView(spec, deriver, pricingService));
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

    /**
     * Project the spec's executions into {@link ExecutionResponseDto} instances,
     * deriving {@code costUsd} from the current pricing table when available.
     * Returns {@code null} when the spec has no executions so the JSON field is
     * omitted via {@code @JsonInclude(NON_NULL)} on the DTO field.
     */
    private static List<ExecutionResponseDto> projectExecutions(PromptSpec spec, ModelPricingService pricingService) {
        List<Execution> executions = spec.getExecutions();
        if (executions == null) {
            return null;
        }
        String model = resolveModel(spec.getRequest());
        List<ExecutionResponseDto> projected = new ArrayList<>(executions.size());
        for (Execution execution : executions) {
            projected.add(ExecutionResponseDto.from(execution, model, pricingService));
        }
        return projected;
    }

    private static String resolveModel(Request request) {
        if (request instanceof ChatCompletionRequest chatRequest) {
            return chatRequest.getModel();
        }
        return null;
    }

    private static Instant timestampOrEpoch(Execution execution) {
        Instant timestamp = execution == null ? null : execution.getTimestamp();
        return timestamp == null ? Instant.EPOCH : timestamp;
    }
}
