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
import dev.promptlm.execution.gateway.GatewayRequest;
import dev.promptlm.execution.gateway.GatewayResponse;
import org.springframework.stereotype.Component;

/**
 * Immediate execution of prompts as specified in provided {@link PromptSpec}.
 */
@Component
public class PromptExecutor {

    private final PromptSpecExecutorRegistry registry;

    public PromptExecutor(PromptSpecExecutorRegistry registry) {
        this.registry = registry;
    }

    /**
     * Execute a prompt.
     *
     * @param promptSpec the prompt spec
     * @return the result
     */
    public PromptSpec runPromptAndAttachResponse(PromptSpec promptSpec) {
        PromptGateway gateway = registry.findExecutor(promptSpec);
        GatewayRequest request = GatewayRequest.from(promptSpec);

        GatewayResponse response = gateway.execute(request);
        return promptSpec.withResponse(response.response());
    }

}
