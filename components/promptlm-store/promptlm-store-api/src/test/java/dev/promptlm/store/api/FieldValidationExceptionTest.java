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

package dev.promptlm.store.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class FieldValidationExceptionTest {

    @Test
    void exposesFieldCodeAndMessageAndIsIllegalArgument() {
        FieldValidationException exception =
                new FieldValidationException("repoDir", "store.path.outsideWorkspace", "repoDir must be inside the workspace");

        assertEquals("repoDir", exception.getField());
        assertEquals("store.path.outsideWorkspace", exception.getCode());
        assertEquals("repoDir must be inside the workspace", exception.getMessage());
        assertInstanceOf(IllegalArgumentException.class, exception);
    }
}
