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

import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.lifecycle.application.PromptExecutionPort;
import org.springframework.stereotype.Component;

/**
 * Bridges {@link PromptExecutionPort} (declared in the lifecycle module) to the
 * {@link PromptExecutor} so the lifecycle layer can run a spec without depending on the
 * execution module — preserving the execution → lifecycle dependency direction.
 */
@Component
public class PromptExecutionAdapter implements PromptExecutionPort {

    private final PromptExecutor promptExecutor;

    public PromptExecutionAdapter(PromptExecutor promptExecutor) {
        this.promptExecutor = promptExecutor;
    }

    @Override
    public PromptSpec runAndAttachResponse(PromptSpec promptSpec) {
        return promptExecutor.runPromptAndAttachResponse(promptSpec);
    }
}
