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

import dev.promptlm.domain.events.PromptEvaluatedEvent;
import dev.promptlm.domain.events.PromptExecutedEvent;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromptEvaluationListenerTest {

    @Mock
    private PromptEvaluator evaluator;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Test
    void publishesPromptEvaluatedEventWithEvaluatedPromptSpec() {
        PromptSpec executed = basePromptSpec();
        PromptSpec evaluated = executed.withDescription("evaluated");

        when(evaluator.evaluateAndAttachResults(executed)).thenReturn(evaluated);

        PromptEvaluationListener listener = new PromptEvaluationListener(evaluator, eventPublisher);
        listener.onPromptExecuted(new PromptExecutedEvent(executed));

        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue()).isInstanceOf(PromptEvaluatedEvent.class);

        PromptEvaluatedEvent event = (PromptEvaluatedEvent) eventCaptor.getValue();
        assertThat(event.promptSpec()).isEqualTo(evaluated);
    }

    private static PromptSpec basePromptSpec() {
        return PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion("1.0.0-SNAPSHOT")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withVendor("openai")
                        .withModel("gpt-4")
                        .withMessages(List.of())
                        .build())
                .build();
    }
}
