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
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the load-bearing serialisation contracts behind the
 * {@code costUsd}-on-read refactor:
 *
 * <ul>
 *   <li>The base {@link Execution} never emits {@code costUsd} (so persisted
 *       YAML stays clean).</li>
 *   <li>{@link PromptSpecApiView.ExecutionView} emits {@code costUsd} even when
 *       the static element type of a list is {@code Execution} — virtual
 *       dispatch on {@code getCostUsd()} survives Jackson's collection
 *       content-serializer cache.</li>
 *   <li>{@link PromptSpec#withExecutions} does not short-circuit when the new
 *       list contains {@link PromptSpecApiView.ExecutionView} instances whose
 *       field values match the old base-class instances. The view layer narrows
 *       {@code canEqual} to keep the swap visible.</li>
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
    void executionViewEmitsCostUsdViaVirtualGetter() throws Exception {
        Execution execution = new Execution("e1", null, null, null, null);
        PromptSpecApiView.ExecutionView view = new PromptSpecApiView.ExecutionView(execution, 0.00214);
        String json = mapper.writeValueAsString(view);
        assertThat(json).contains("\"costUsd\":0.00214");
    }

    @Test
    void executionViewEmitsCostUsdEvenWhenReferencedAsBaseType() throws Exception {
        // Spring's HttpMessageConverter walks PromptSpec.executions as
        // List<Execution>; this test pins that virtual dispatch on
        // getCostUsd() keeps the override visible.
        Execution execution = new Execution("e1", null, null, null, null);
        Execution view = new PromptSpecApiView.ExecutionView(execution, 0.00214);
        String json = mapper.writeValueAsString(view);
        assertThat(json).contains("\"costUsd\":0.00214");
    }

    @Test
    void executionViewIsNotEqualToBaseExecutionWithMatchingFields() {
        // PromptSpec.withExecutions(...) short-circuits on Objects.equals.
        // ExecutionView must report itself unequal to a base Execution with
        // the same field values so the swap actually takes effect — otherwise
        // the projected costUsd silently disappears from the response.
        Execution base = new Execution("e1", null, null, null, null);
        Execution view = new PromptSpecApiView.ExecutionView(base, 0.00214);
        assertThat(view).isNotEqualTo(base);
        assertThat(base).isNotEqualTo(view);
        assertThat(List.of(base)).isNotEqualTo(List.of(view));
    }

    @Test
    void promptSpecExecutionsRoundTripEmitsCostUsd() throws Exception {
        Execution execution = new Execution("e1", null, null, null, null);
        Execution view = new PromptSpecApiView.ExecutionView(execution, 0.00214);
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
                .withExecutions(List.of(view));
        String json = mapper.writeValueAsString(spec);
        assertThat(json).contains("\"costUsd\":0.00214");
    }
}
