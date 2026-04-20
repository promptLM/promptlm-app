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

package dev.promptlm.execution;

import dev.promptlm.domain.events.PromptCreatedEvent;
import dev.promptlm.domain.events.PromptExecutedEvent;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
class PromptExecutionListener {

    private final PromptExecutor promptExecutor;
    private final ApplicationEventPublisher eventPublisher;

    PromptExecutionListener(PromptExecutor promptExecutor, ApplicationEventPublisher eventPublisher) {
        this.promptExecutor = promptExecutor;
        this.eventPublisher = eventPublisher;
    }

    @ApplicationModuleListener
    void onPromptCreated(PromptCreatedEvent event) {
        PromptSpec executed = promptExecutor.runPromptAndAttachResponse(event.promptSpec());
        eventPublisher.publishEvent(new PromptExecutedEvent(executed));
    }
}
