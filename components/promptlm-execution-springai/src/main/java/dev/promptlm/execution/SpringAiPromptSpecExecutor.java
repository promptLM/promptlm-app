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

import dev.promptlm.execution.gateway.GatewayRequest;
import dev.promptlm.execution.gateway.GatewayResponse;
//import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class SpringAiPromptSpecExecutor implements PromptGateway {

    private final Map<String, SpringAiVendorClient> clients;

    public SpringAiPromptSpecExecutor(List<SpringAiVendorClient> vendorClients) {
        Map<String, SpringAiVendorClient> mappedClients = new LinkedHashMap<>();
        for (SpringAiVendorClient client : vendorClients) {
            if (client.vendor() == null || client.vendor().isBlank()) {
                continue;
            }
            mappedClients.putIfAbsent(normalize(client.vendor()), client);
        }
        this.clients = Map.copyOf(mappedClients);
    }

    @Override
    public boolean supports(String vendor, String model) {
        SpringAiVendorClient client = clients.get(normalize(vendor));
        return client != null && client.supportsModel(model);
    }

    @Override
    public GatewayResponse execute(GatewayRequest request) {
        SpringAiVendorClient client = clients.get(normalize(request.vendor()));
        if (client == null || !client.supportsModel(request.model())) {
            throw new IllegalStateException("Unsupported vendor/model: " + request.vendor() + "/" + request.model());
        }
        return client.execute(request.promptSpec());
    }

    private String normalize(String vendor) {
        return vendor == null ? "" : vendor.toLowerCase(Locale.ROOT);
    }
}
