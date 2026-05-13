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

package dev.promptlm.domain.promptspec;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class EvaluationResultTest {

    private final ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();

    /**
     * A v2-schema EvaluationResult row (extra fields: outcome, threshold, metadata,
     * subScores, comparison, diagnostics, schemaVersion) must deserialize into the v1
     * EvaluationResult without throwing, and the v1 fields must be extracted correctly.
     */
    @Test
    void v2RowOnV1Reader_doesNotThrow() {
        ObjectNode v2Node = mapper.createObjectNode()
                .put("evaluator", "semantic-match")
                .put("type", "rubric")
                .put("score", 0.9)
                .put("reasoning", "Response is highly relevant")
                .put("comments", "Meets all rubric criteria")
                // v2-only fields — must be silently ignored
                .put("outcome", "pass")
                .put("threshold", 0.7)
                .put("comparison", "gte")
                .put("schemaVersion", 2);
        v2Node.putObject("metadata").put("model", "gpt-4o");
        v2Node.putArray("subScores").add(0.85).add(0.95);
        v2Node.putObject("diagnostics").put("latencyMs", 340);

        EvaluationResult result = assertDoesNotThrow(
                () -> mapper.convertValue(v2Node, EvaluationResult.class));

        assertThat(result.getEvaluator()).isEqualTo("semantic-match");
        assertThat(result.getType()).isEqualTo("rubric");
        assertThat(result.getScore()).isEqualTo(0.9);
        assertThat(result.getReasoning()).isEqualTo("Response is highly relevant");
        assertThat(result.getComments()).isEqualTo("Meets all rubric criteria");
    }
}
