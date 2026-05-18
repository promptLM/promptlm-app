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

import dev.promptlm.domain.ObjectMapperFactory;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the Usage block in {@link ChatCompletionResponse} accepts both the canonical
 * {@code input_tokens}/{@code output_tokens} names (Anthropic-style, what we serialise)
 * and the OpenAI-style {@code prompt_tokens}/{@code completion_tokens} aliases that come
 * back from OpenAI directly and from LiteLLM (issue #182).
 */
class ChatCompletionResponseUsageTest {

    private final JsonMapper mapper = ObjectMapperFactory.createJsonMapper();

    @Test
    void usage_accepts_openai_style_token_field_aliases() {
        // LiteLLM and OpenAI return prompt_tokens / completion_tokens. The Usage
        // class declares input_tokens / output_tokens as the canonical names so
        // those are aliases.
        String openAiStyleUsage = """
                {
                  "prompt_tokens": 123,
                  "completion_tokens": 45
                }
                """;

        ChatCompletionResponse.Usage usage =
                mapper.readValue(openAiStyleUsage, ChatCompletionResponse.Usage.class);

        assertThat(usage.getInputTokens()).isEqualTo(123);
        assertThat(usage.getOutputTokens()).isEqualTo(45);
    }

    @Test
    void usage_accepts_canonical_input_output_tokens() {
        String anthropicStyleUsage = """
                {
                  "input_tokens": 200,
                  "output_tokens": 80
                }
                """;

        ChatCompletionResponse.Usage usage =
                mapper.readValue(anthropicStyleUsage, ChatCompletionResponse.Usage.class);

        assertThat(usage.getInputTokens()).isEqualTo(200);
        assertThat(usage.getOutputTokens()).isEqualTo(80);
    }
}
