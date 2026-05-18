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
import dev.promptlm.pricing.ModelPricingService;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pins the load-bearing serialisation contracts behind the
 * {@code costUsd}-on-read projection:
 *
 * <ul>
 *   <li>The base {@link Execution} never emits {@code costUsd} (so persisted
 *       YAML stays clean of pricing-table state).</li>
 *   <li>{@link ExecutionResponseDto} carries {@code costUsd} alongside the
 *       inline-unwrapped execution fields.</li>
 *   <li>{@link PromptSpecResponseDto} suppresses the unwrapped spec's
 *       {@code executions} property and emits the projected DTO list under
 *       the same {@code executions} JSON key — no duplicate field, no
 *       shadowing of the projected cost.</li>
 *   <li>The wire format remains compatible with the legacy executor path:
 *       absent cost yields no {@code costUsd} property at all (omitted via
 *       {@code @JsonInclude(NON_NULL)}).</li>
 * </ul>
 */
class PromptSpecApiViewCostTest {

    private final ObjectMapper mapper = new JsonMapper();

    @Test
    void plainExecutionDoesNotEmitCostUsd() throws Exception {
        Execution execution = new Execution("e1", null, null, null, null);
        String json = mapper.writeValueAsString(execution);
        assertThat(json).doesNotContain("costUsd");
        assertThat(json).doesNotContain("\"cost\"");
    }

    @Test
    void executionResponseDtoEmitsCostUsd() throws Exception {
        Execution execution = new Execution("e1", null, null, null, null);
        ExecutionResponseDto dto = new ExecutionResponseDto(execution, 0.00214);
        String json = mapper.writeValueAsString(dto);
        assertThat(json).contains("\"costUsd\":0.00214");
        // The unwrapped execution's id is emitted inline at the DTO root.
        assertThat(json).contains("\"id\":\"e1\"");
    }

    @Test
    void executionResponseDtoOmitsCostUsdWhenNull() throws Exception {
        Execution execution = new Execution("e1", null, null, null, null);
        ExecutionResponseDto dto = new ExecutionResponseDto(execution, null);
        String json = mapper.writeValueAsString(dto);
        assertThat(json).doesNotContain("costUsd");
    }

    @Test
    void responseDtoEmitsProjectedExecutionsWithCostUsd() throws Exception {
        Execution execution = new Execution("e1", null, null, null, null);
        ExecutionResponseDto projected = new ExecutionResponseDto(execution, 0.00214);
        PromptSpec spec = PromptSpec.builder()
                .withGroup("g")
                .withName("n")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("d")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of())
                        .withParameters(Map.of())
                        .build())
                .build()
                .withExecutions(List.of(execution));
        PromptSpecResponseDto responseDto = new PromptSpecResponseDto(
                spec, List.of(projected), null, null, null);

        String json = mapper.writeValueAsString(responseDto);

        // Exactly one executions array, carrying the projected DTO with costUsd.
        assertThat(json).contains("\"costUsd\":0.00214");
        int firstExecutionsAt = json.indexOf("\"executions\"");
        int lastExecutionsAt = json.lastIndexOf("\"executions\"");
        assertThat(firstExecutionsAt)
                .as("executions JSON property should appear exactly once on the response DTO")
                .isEqualTo(lastExecutionsAt)
                .isGreaterThanOrEqualTo(0);
    }

    @Test
    void apiViewProjectsCostUsdViaPricingService() throws Exception {
        Execution execution = new Execution(
                "e1",
                null,
                null,
                null,
                null,
                100L,
                10,
                20,
                null,
                null,
                "1",
                null,
                true,
                null);
        PromptSpec spec = PromptSpec.builder()
                .withGroup("g")
                .withName("n")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("d")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4o")
                        .withMessages(List.of())
                        .withParameters(Map.of())
                        .build())
                .build()
                .withExecutions(List.of(execution));

        ModelPricingService pricing = mock(ModelPricingService.class);
        when(pricing.computeCost(any(), any(), any())).thenReturn(Optional.of(0.00214));

        PromptSpecResponseDto responseDto = PromptSpecApiView.toApiView(spec, null, pricing);
        String json = mapper.writeValueAsString(responseDto);
        assertThat(json).contains("\"costUsd\":0.00214");
    }
}
