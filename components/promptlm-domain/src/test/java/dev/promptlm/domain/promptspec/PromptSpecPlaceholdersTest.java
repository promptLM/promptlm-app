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

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PromptSpecPlaceholdersTest {

    @Test
    void getDefaultsAllowsNullValues() {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setList(List.of(new PromptSpec.Placeholder("customer_name", null)));

        Map<String, String> defaults = placeholders.getDefaults();

        assertEquals(1, defaults.size());
        assertNull(defaults.get("customer_name"));
    }

    @Test
    void getDefaultsRejectsDuplicatePlaceholderNames() {
        PromptSpec.Placeholders placeholders = new PromptSpec.Placeholders();
        placeholders.setList(List.of(
                new PromptSpec.Placeholder("customer_name", "Alice"),
                new PromptSpec.Placeholder("customer_name", "Bob")
        ));

        assertThrows(IllegalStateException.class, placeholders::getDefaults);
    }
}

