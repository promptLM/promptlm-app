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

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.PromptSpecLifecycleState;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * API-boundary response payload for a {@link PromptSpec}. Carries the spec
 * itself (serialized inline via {@link JsonUnwrapped} so the existing JSON
 * field names and shapes are preserved byte-for-byte) plus the three
 * server-derived fields the editor UI reads from {@code GET /api/prompts/*}:
 * lifecycle state, HEAD short SHA, and release tag.
 *
 * <p>The unwrapped spec's {@code executions} field is suppressed via
 * {@link JsonIgnoreProperties} on the unwrap reference; the projected list of
 * {@link ExecutionResponseDto} below carries the executions instead, attaching
 * the view-derived {@code costUsd} without polluting the domain class with
 * pricing-table state.
 *
 * <p>This DTO exists so the domain {@link PromptSpec} stays free of API-only
 * fields. The deriver populates the boundary fields in
 * {@link PromptSpecApiView#toApiView(PromptSpec, PromptSpecLifecycleDeriver, dev.promptlm.pricing.ModelPricingService)};
 * the wire format consumed by the frontend is unchanged.
 *
 * @see PromptSpecApiView
 * @see PromptSpecLifecycleDeriver
 * @see ExecutionResponseDto
 */
@Schema(description = "Prompt specification response payload (domain spec + server-derived UI hints)")
final class PromptSpecResponseDto {

    /**
     * The unwrapped domain spec. {@code executions} is suppressed here so the
     * projected list with {@code costUsd} (declared below) is the sole source
     * of the {@code executions} JSON property. Without this suppression Jackson
     * would emit two competing {@code executions} fields and the projection
     * with cost would be shadowed by the raw domain list.
     */
    @JsonUnwrapped
    @JsonIgnoreProperties({"executions"})
    private final PromptSpec spec;

    @JsonProperty("executions")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Recent executions of the prompt, newest first, with server-derived costUsd attached.",
            accessMode = Schema.AccessMode.READ_ONLY)
    private final List<ExecutionResponseDto> executions;

    @JsonProperty("lifecycleState")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Server-derived lifecycle state of the spec. Omitted when the backend cannot derive it (e.g. no active project).",
            implementation = PromptSpecLifecycleState.class,
            nullable = true,
            accessMode = Schema.AccessMode.READ_ONLY)
    private final PromptSpecLifecycleState lifecycleState;

    @JsonProperty("headShortSha")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Server-derived Git short SHA (7 chars) of HEAD when the working tree matches a commit. Omitted otherwise.",
            nullable = true,
            accessMode = Schema.AccessMode.READ_ONLY,
            example = "a1b2c3d")
    private final String headShortSha;

    @JsonProperty("releaseTag")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Server-derived release tag for the current revision. Omitted when the spec has not been released.",
            nullable = true,
            accessMode = Schema.AccessMode.READ_ONLY,
            example = "v1.4")
    private final String releaseTag;

    PromptSpecResponseDto(PromptSpec spec,
                          List<ExecutionResponseDto> executions,
                          PromptSpecLifecycleState lifecycleState,
                          String headShortSha,
                          String releaseTag) {
        this.spec = spec;
        this.executions = executions;
        this.lifecycleState = lifecycleState;
        this.headShortSha = headShortSha;
        this.releaseTag = releaseTag;
    }

    /** Returns the wrapped spec. Visible to tests and assemblers within the web module. */
    PromptSpec getSpec() {
        return spec;
    }

    List<ExecutionResponseDto> getExecutions() {
        return executions;
    }

    PromptSpecLifecycleState getLifecycleState() {
        return lifecycleState;
    }

    String getHeadShortSha() {
        return headShortSha;
    }

    String getReleaseTag() {
        return releaseTag;
    }
}
