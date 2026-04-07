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
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PromptSpecExecutorRegistry {

    private final List<PromptGateway> gateways;

    public PromptSpecExecutorRegistry(List<PromptGateway> gateways) {
        this.gateways = gateways;
    }

    public PromptGateway findExecutor(PromptSpec promptSpec) {
        String vendor = promptSpec.getRequest().getVendor();
        String model = promptSpec.getRequest().getModel();

        return gateways.stream()
                .filter(g -> g.supports(vendor, model))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No Prompt gateway available for vendor '" + vendor + "' and model '" + model + "'"));
    }

    public GatewayRequest createRequest(PromptSpec promptSpec) {
        return GatewayRequest.from(promptSpec);
    }
}
