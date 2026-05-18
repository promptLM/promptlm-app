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
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import dev.promptlm.domain.promptspec.Execution;
import dev.promptlm.pricing.ModelPricingService;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * API-boundary response payload for a single {@link Execution}. Carries the
 * domain execution itself (serialised inline via {@link JsonUnwrapped} so the
 * existing JSON field names and shapes stay byte-for-byte identical) plus the
 * view-derived {@code costUsd} field projected from the current pricing table.
 *
 * <p>Cost is intentionally derived at the API boundary rather than persisted on
 * {@link Execution}. The per-model pricing table is mutable external state
 * (operator-managed {@code application.yml}) — freezing cost on the domain
 * object would turn every historical value into a silent lie the moment a
 * price is corrected. Tokens are vendor-reported and immutable post-call, so
 * they remain on the domain and feed the on-read computation here.
 *
 * @see PromptSpecApiView
 * @see PromptSpecResponseDto
 */
@Schema(description = "Recorded execution response payload (domain execution + server-derived USD cost)")
final class ExecutionResponseDto {

    @JsonUnwrapped
    private final Execution execution;

    @JsonProperty("costUsd")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "USD cost derived from the current per-model pricing table at read time; absent for unknown models or null tokens",
            nullable = true,
            accessMode = Schema.AccessMode.READ_ONLY,
            example = "0.00214")
    private final Double costUsd;

    ExecutionResponseDto(Execution execution, Double costUsd) {
        this.execution = execution;
        this.costUsd = costUsd;
    }

    /**
     * Projects {@code source} into a DTO using {@code pricingService} to derive
     * {@code costUsd}. {@code pricingService} may be {@code null} (e.g. unit
     * tests) in which case the cost field is omitted from the wire format.
     */
    static ExecutionResponseDto from(Execution source, String model, ModelPricingService pricingService) {
        Double costUsd = null;
        if (pricingService != null) {
            costUsd = pricingService
                    .computeCost(model, source.getTokensIn(), source.getTokensOut())
                    .orElse(null);
        }
        return new ExecutionResponseDto(source, costUsd);
    }

    /** Returns the wrapped execution. Visible to tests within the web module. */
    Execution getExecution() {
        return execution;
    }

    Double getCostUsd() {
        return costUsd;
    }
}
