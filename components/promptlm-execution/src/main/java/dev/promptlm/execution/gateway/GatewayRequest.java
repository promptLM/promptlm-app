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

package dev.promptlm.execution.gateway;


import dev.promptlm.domain.promptspec.PromptSpec;

/**
 * Wrapper for dispatching prompt executions through a gateway implementation.
 */
public final class GatewayRequest {

    private final PromptSpec promptSpec;

    private GatewayRequest(PromptSpec promptSpec) {
        this.promptSpec = promptSpec;
    }

    public static GatewayRequest from(PromptSpec promptSpec) {
        if (promptSpec == null) {
            throw new IllegalArgumentException("promptSpec must not be null");
        }
        return new GatewayRequest(promptSpec);
    }

    public PromptSpec promptSpec() {
        return promptSpec;
    }

    public String vendor() {
        return promptSpec.getRequest() != null ? promptSpec.getRequest().getVendor() : null;
    }

    public String model() {
        return promptSpec.getRequest() != null ? promptSpec.getRequest().getModel() : null;
    }
}
