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
 * silent lie the moment a price is corrected. We pass the current price table
 * through {@link ModelPricingService} each time the spec is serialised and
 * attach the derived value as {@code costUsd} on {@link ExecutionView}, an
 * HTTP-only subclass that disk persistence never sees.
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
        PromptSpec projected = withCostOnRead(sorted, pricingService);
        PromptSpecLifecycleState lifecycleState = null;
        String headShortSha = null;
        if (deriver != null) {
            PromptSpecLifecycleDeriver.Result result = deriver.deriveResult(projected);
            if (result != null) {
                lifecycleState = result.state();
                headShortSha = result.headShortSha();
            }
        }
        String releaseTag = releaseTagOrNull(projected);
        return new PromptSpecResponseDto(projected, lifecycleState, headShortSha, releaseTag);
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
     * Replace each {@link Execution} with an {@link ExecutionView} carrying the
     * cost computed from the current pricing table. Executions with unknown
     * models or null token counts get a {@code null} {@code costUsd}, which is
     * omitted from JSON via {@code @JsonInclude(NON_NULL)} — the UI treats the
     * absence as "no price available" and hides the chip rather than rendering
     * a misleading $0.00.
     *
     * <p>{@link ExecutionView} narrows {@link Execution#canEqual} so that
     * {@code ExecutionView.equals(Execution baseInstance)} returns false even
     * when the field values match. Without that, {@link PromptSpec#withExecutions}
     * would short-circuit on {@code Objects.equals(oldList, newList)} and keep
     * the original {@link Execution} instances — wiping the override we need
     * for the virtual {@code getCostUsd()} getter.
     */
    private static PromptSpec withCostOnRead(PromptSpec spec, ModelPricingService pricingService) {
        if (spec == null || pricingService == null) {
            return spec;
        }
        List<Execution> executions = spec.getExecutions();
        if (executions == null || executions.isEmpty()) {
            return spec;
        }
        String model = resolveModel(spec.getRequest());
        List<Execution> projected = new ArrayList<>(executions.size());
        for (Execution execution : executions) {
            projected.add(toExecutionView(execution, model, pricingService));
        }
        return spec.withExecutions(projected);
    }

    private static String resolveModel(Request request) {
        if (request instanceof ChatCompletionRequest chatRequest) {
            return chatRequest.getModel();
        }
        return null;
    }

    private static ExecutionView toExecutionView(Execution source,
                                                 String model,
                                                 ModelPricingService pricingService) {
        Double costUsd = pricingService
                .computeCost(model, source.getTokensIn(), source.getTokensOut())
                .orElse(null);
        return new ExecutionView(source, costUsd);
    }

    private static Instant timestampOrEpoch(Execution execution) {
        Instant timestamp = execution == null ? null : execution.getTimestamp();
        return timestamp == null ? Instant.EPOCH : timestamp;
    }

    /**
     * HTTP-only projection of {@link Execution} that overrides
     * {@link Execution#getCostUsd()} to return the value derived from the
     * current pricing table. Instances are constructed exclusively in this
     * package by {@link PromptSpecApiView#withCostOnRead}; the disk
     * persistence path never sees this type. Virtual dispatch on
     * {@code getCostUsd()} is what makes Jackson emit the {@code costUsd}
     * field even though {@link dev.promptlm.domain.promptspec.PromptSpec}
     * statically types its executions as {@code List<Execution>}.
     */
    static final class ExecutionView extends Execution {

        private final Double costUsd;

        ExecutionView(Execution source, Double costUsd) {
            setId(source.getId());
            setTimestamp(source.getTimestamp());
            setResponse(source.getResponse());
            setPlaceholders(source.getPlaceholders());
            setEvaluations(source.getEvaluations());
            setLatencyMs(source.getLatencyMs());
            setTokensIn(source.getTokensIn());
            setTokensOut(source.getTokensOut());
            setFixturePath(source.getFixturePath());
            setContext(source.getContext());
            setRevision(source.getRevision());
            setAuthor(source.getAuthor());
            setOk(source.getOk());
            setError(source.getError());
            setKind(source.getKind());
            setFailureClass(source.getFailureClass());
            this.costUsd = costUsd;
        }

        @Override
        public Double getCostUsd() {
            return this.costUsd;
        }

        /**
         * Narrow {@link Execution#canEqual} so that an {@code ExecutionView}
         * is never considered equal to a base {@link Execution} with the same
         * field values. This prevents {@link dev.promptlm.domain.promptspec.PromptSpec#withExecutions}
         * from short-circuiting and dropping our projected list — see
         * {@link PromptSpecApiView#withCostOnRead} for the rationale.
         */
        @Override
        protected boolean canEqual(Object other) {
            return other instanceof ExecutionView;
        }

        @Override
        public boolean equals(Object o) {
            if (o == this) return true;
            if (!(o instanceof ExecutionView)) return false;
            if (!super.equals(o)) return false;
            ExecutionView other = (ExecutionView) o;
            return java.util.Objects.equals(this.costUsd, other.costUsd);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(super.hashCode(), this.costUsd);
        }
    }
}
