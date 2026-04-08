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

package dev.promptlm.execution;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Request;
import dev.promptlm.execution.gateway.GatewayRequest;
import dev.promptlm.execution.gateway.GatewayResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PromptSpecExecutorRegistryTest {

    static class DummyExecutor implements PromptGateway {
        private final String vendor;
        private final Set<String> models;

        DummyExecutor(String vendor, Set<String> models) {
            this.vendor = vendor;
            this.models = models;
        }

        @Override
        public GatewayResponse execute(GatewayRequest request) {
            return GatewayResponse.of(null);
        }

        @Override
        public boolean supports(String vendor, String model) {
            return this.vendor.equalsIgnoreCase(vendor) && models.contains(model);
        }
    }

    @Test
    @DisplayName("finds executor matching vendor and model")
    void findsMatchingExecutor() {
        DummyExecutor openai = new DummyExecutor("openai", Set.of("gpt-3.5"));
        DummyExecutor hf = new DummyExecutor("huggingface", Set.of("flan-t5"));
        PromptSpecExecutorRegistry registry = new PromptSpecExecutorRegistry(List.of(openai, hf));

        PromptSpec spec1 = promptSpec("openai", "gpt-3.5");
        PromptSpec spec2 = promptSpec("huggingface", "flan-t5");

        assertThat(registry.findExecutor(spec1)).isSameAs(openai);
        assertThat(registry.findExecutor(spec2)).isSameAs(hf);
    }

    @Test
    @DisplayName("throws when no executor matches")
    void throwsWhenNoMatch() {
        DummyExecutor openai = new DummyExecutor("openai", Set.of("gpt-3.5"));
        PromptSpecExecutorRegistry registry = new PromptSpecExecutorRegistry(List.of(openai));

        PromptSpec spec = promptSpec("huggingface", "flan-t5");

        assertThrows(IllegalStateException.class, () -> registry.findExecutor(spec));
    }

    @Test
    @DisplayName("routes requests to the correct gateway by vendor")
    void routesByVendor() {
        DummyExecutor openai = new DummyExecutor("openai", Set.of("gpt-4o"));
        DummyExecutor litellm = new DummyExecutor("litellm", Set.of("gpt-4o"));
        PromptSpecExecutorRegistry registry = new PromptSpecExecutorRegistry(List.of(litellm, openai));

        PromptSpec openAiSpec = promptSpec("openai", "gpt-4o");
        PromptSpec liteLlmSpec = promptSpec("litellm", "gpt-4o");

        assertThat(registry.findExecutor(openAiSpec)).isSameAs(openai);
        assertThat(registry.findExecutor(liteLlmSpec)).isSameAs(litellm);
    }

    @Test
    @DisplayName("fails when vendor matches but model is not supported")
    void failsWhenModelUnsupported() {
        DummyExecutor litellm = new DummyExecutor("litellm", Set.of("gpt-4o"));
        PromptSpecExecutorRegistry registry = new PromptSpecExecutorRegistry(List.of(litellm));

        PromptSpec spec = promptSpec("litellm", "unknown-model");

        assertThrows(IllegalStateException.class, () -> registry.findExecutor(spec));
    }

    private PromptSpec promptSpec(String vendor, String model) {
        Request request = ChatCompletionRequest.builder()
                .withVendor(vendor)
                .withModel(model)
                .withUrl("http://example")
                .build();
        return PromptSpec.builder()
                .withName("name")
                .withVersion("1")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(request)
                .build()
                .withId("id");
    }
}
