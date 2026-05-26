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
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class PromptSpecLifecycleStateTest {

    private final ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();

    @Test
    void serializesEachValueAsLowercaseJsonString() {
        for (PromptSpecLifecycleState value : PromptSpecLifecycleState.values()) {
            String json = mapper.writeValueAsString(value);
            assertThat(json).isEqualTo("\"" + value.name().toLowerCase() + "\"");
        }
    }

    @Test
    void deserializesLowercaseAndUppercase() {
        assertThat(mapper.readValue("\"draft\"", PromptSpecLifecycleState.class))
                .isEqualTo(PromptSpecLifecycleState.DRAFT);
        assertThat(mapper.readValue("\"SAVED\"", PromptSpecLifecycleState.class))
                .isEqualTo(PromptSpecLifecycleState.SAVED);
        assertThat(mapper.readValue("\"Committed\"", PromptSpecLifecycleState.class))
                .isEqualTo(PromptSpecLifecycleState.COMMITTED);
        assertThat(mapper.readValue("\"pushed\"", PromptSpecLifecycleState.class))
                .isEqualTo(PromptSpecLifecycleState.PUSHED);
    }

    @Test
    void enumHasAllFourCanonicalValuesFromIssue189() {
        // Issue #189 fixes the four canonical states. Any change to this enum
        // is a contract change with the dependent issues (#183-#188); fail
        // hard if a value is added or removed without revisiting the model.
        assertThat(PromptSpecLifecycleState.values())
                .containsExactly(
                        PromptSpecLifecycleState.DRAFT,
                        PromptSpecLifecycleState.SAVED,
                        PromptSpecLifecycleState.COMMITTED,
                        PromptSpecLifecycleState.PUSHED);
    }
}
