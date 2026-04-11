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

import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.domain.promptspec.PromptSpec;

/**
 * Adapter that bridges a specific vendor supported by Spring AI.
 */
public interface SpringAiVendorClient {

    /**
     * @return normalized vendor identifier (e.g. "openai")
     */
    String vendor();

    /**
     * Whether this vendor client can handle the provided model identifier.
     *
     * @param model model identifier from the prompt specification
     * @return true when executable
     */
    boolean supportsModel(String model);

    /**
     * @return catalog-friendly list of models for UI selection.
     */
    default java.util.Set<String> catalogModels() {
        return java.util.Set.of();
    }

    /**
     * Execute the prompt specification via Spring AI and return a gateway response.
     */
    GatewayResponse execute(PromptSpec promptSpec);
}
