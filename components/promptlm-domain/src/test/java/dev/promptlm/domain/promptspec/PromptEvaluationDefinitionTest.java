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

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PromptEvaluationDefinitionTest {

    @Test
    void regexMatchesResponseContent() {
        PromptEvaluationDefinition definition = new PromptEvaluationDefinition("regex", "regex", "happy");
        EvaluationResult result = definition.evaluate(response("I am happy today."));

        assertThat(result.getScore()).isEqualTo(1.0);
        assertThat(result.success()).isTrue();
        assertThat(result.getReasoning()).contains("matched");
    }

    @Test
    void regexFailsWhenNoMatch() {
        PromptEvaluationDefinition definition = new PromptEvaluationDefinition("regex", "regex", "happy");
        EvaluationResult result = definition.evaluate(response("I am sad today."));

        assertThat(result.getScore()).isEqualTo(0.0);
        assertThat(result.success()).isFalse();
        assertThat(result.getReasoning()).contains("did not match");
    }

    @Test
    void regexFailsWhenPatternMissing() {
        PromptEvaluationDefinition definition = new PromptEvaluationDefinition("regex", "regex", "   ");
        EvaluationResult result = definition.evaluate(response("I am happy today."));

        assertThat(result.getScore()).isEqualTo(0.0);
        assertThat(result.success()).isFalse();
        assertThat(result.getReasoning()).isEqualTo("Missing regex pattern");
    }

    @Test
    void regexFailsWhenPatternInvalid() {
        PromptEvaluationDefinition definition = new PromptEvaluationDefinition("regex", "regex", "*");
        EvaluationResult result = definition.evaluate(response("I am happy today."));

        assertThat(result.getScore()).isEqualTo(0.0);
        assertThat(result.success()).isFalse();
        assertThat(result.getReasoning()).startsWith("Invalid regex pattern");
    }

    @Test
    void nonRegexEvaluationRetainsPlaceholderBehavior() {
        PromptEvaluationDefinition definition = new PromptEvaluationDefinition(
                "semantic-match",
                "rubric",
                "score relevance"
        );
        EvaluationResult result = definition.evaluate(response("Any response."));

        assertThat(result.getScore()).isNull();
        assertThat(result.getComments()).isEqualTo("score relevance");
    }

    private static Response response(String content) {
        return new ChatCompletionResponse(null, null, content);
    }
}
