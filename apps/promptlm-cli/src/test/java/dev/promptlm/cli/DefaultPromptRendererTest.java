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

package dev.promptlm.cli;

import tools.jackson.core.exc.StreamWriteException;
import tools.jackson.databind.ObjectMapper;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DefaultPromptRendererTest {

    @Test
    void rendersUsingProvidedObjectMapper() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        DefaultPromptRenderer renderer = new DefaultPromptRenderer(mapper);
        PromptSpec promptSpec = mock(PromptSpec.class);

        when(mapper.writeValueAsString(promptSpec)).thenReturn("yaml-content");

        String rendered = renderer.render(promptSpec);

        assertEquals("yaml-content", rendered);
    }

    @Test
    void wrapsJacksonException() throws Exception {
        ObjectMapper mapper = mock(ObjectMapper.class);
        DefaultPromptRenderer renderer = new DefaultPromptRenderer(mapper);
        PromptSpec promptSpec = mock(PromptSpec.class);

        when(mapper.writeValueAsString(promptSpec))
                .thenThrow(new StreamWriteException(null, "boom"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> renderer.render(promptSpec));
        assertTrue(exception.getCause().getMessage().contains("boom"));
    }
}
