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

package dev.promptlm.evaluation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.module.SimpleAbstractTypeResolver;
import tools.jackson.databind.module.SimpleModule;
import dev.promptlm.domain.promptspec.Evaluation;
import dev.promptlm.domain.promptspec.EvaluationExtensions;
import dev.promptlm.domain.promptspec.EvaluationResult;
import dev.promptlm.domain.promptspec.EvaluationSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.Response;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EvaluationExtensionSupportTest {

    /**
     * A fake commercial evaluation subtype — has its own field (threshold) beyond
     * the standard PromptEvaluationDefinition shape. Structurally compatible so
     * deserialization from a fresh EvaluationExtensions mapper succeeds even when
     * the FakeEvaluation mapping is active.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class FakeEvaluation implements Evaluation {

        private final String evaluator;
        private final String type;
        private final double threshold;

        @JsonCreator
        FakeEvaluation(
                @JsonProperty("evaluator") String evaluator,
                @JsonProperty("type") String type,
                @JsonProperty("threshold") double threshold) {
            this.evaluator = evaluator;
            this.type = type;
            this.threshold = threshold;
        }

        public String getEvaluator() { return evaluator; }
        public String getType() { return type; }
        public double getThreshold() { return threshold; }

        @Override
        public EvaluationResult evaluate(Response response) {
            return new EvaluationResult(evaluator, type, 1.0, null, null);
        }
    }

    /**
     * Registers a fake commercial subtype, round-trips a PromptSpec through
     * EvaluationExtensionSupport, and asserts no IllegalArgumentException is thrown.
     * Before the fix, canSerializeSpec rejected non-PromptEvaluationDefinition subtypes,
     * so the spec was never written to extensions and the round-trip silently lost data.
     */
    @Test
    void customEvaluation_roundTrips() {
        SimpleAbstractTypeResolver resolver = new SimpleAbstractTypeResolver();
        resolver.addMapping(Evaluation.class, FakeEvaluation.class);
        SimpleModule module = new SimpleModule();
        module.setAbstractTypes(resolver);
        EvaluationExtensions.registerModule(module);

        FakeEvaluation fakeEval = new FakeEvaluation("custom-eval", "threshold-check", 0.8);
        EvaluationSpec spec = new EvaluationSpec(List.of(fakeEval));
        PromptSpec promptSpec = basePromptSpec();

        // Write — canSerializeSpec must return true for FakeEvaluation
        PromptSpec withSpec = EvaluationExtensionSupport.withResults(promptSpec, spec, null);

        // Spec must have been written to extensions
        assertThat(withSpec.getExtensions())
                .containsKey(EvaluationExtensionSupport.EVALUATION_EXTENSION_KEY);

        // Read back — must not throw IllegalArgumentException
        EvaluationSpec readSpec = EvaluationExtensionSupport.extractSpec(withSpec);
        assertThat(readSpec).isNotNull();
        assertThat(readSpec.getEvaluations()).hasSize(1);
    }

    private static PromptSpec basePromptSpec() {
        return PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(dev.promptlm.domain.promptspec.ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4")
                        .withMessages(List.of())
                        .build())
                .build();
    }
}
