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

package dev.promptlm.lifecycle;

import dev.promptlm.domain.events.PromptEvaluatedEvent;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.lifecycle.application.PromptLifecycleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PromptPersistenceListenerTest {

    @Mock
    private PromptLifecycleService promptLifecycleService;

    @Test
    void onPromptEvaluatedDelegatesPersistenceToLifecycleService() {
        PromptPersistenceListener listener = new PromptPersistenceListener(promptLifecycleService);
        PromptSpec promptSpec = mock(PromptSpec.class);

        listener.onPromptEvaluated(new PromptEvaluatedEvent(promptSpec));

        verify(promptLifecycleService).persistEvaluatedPrompt(promptSpec);
    }
}
