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

package dev.promptlm.webapp;

import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.execution.PromptGateway;
import dev.promptlm.execution.gateway.GatewayRequest;
import dev.promptlm.execution.gateway.GatewayResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Deterministic {@link PromptGateway} for the {@code acceptance} Spring profile. Returns a
 * canned {@link ChatCompletionResponse} for any vendor/model without making a network
 * call, so end-to-end tests can exercise the dev-run and pre-release-execute paths
 * without an LLM API key.
 *
 * <p>Activated by {@code -Dspring.profiles.active=acceptance} when the acceptance test
 * suite forks the webapp jar. {@link Order#value()} is {@link Ordered#HIGHEST_PRECEDENCE}
 * so this gateway is selected first by {@code PromptSpecExecutorRegistry#findExecutor},
 * shadowing the real vendor gateways.
 */
@Component
@Profile("acceptance")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AcceptanceTestStubGateway implements PromptGateway {

    /** Canned content returned for every request. Stable so tests can assert on it. */
    public static final String STUB_RESPONSE_CONTENT = "stub-response";

    @Override
    public boolean supports(String vendor, String model) {
        return true;
    }

    @Override
    public GatewayResponse execute(GatewayRequest request) {
        return GatewayResponse.of(new ChatCompletionResponse(50L, null, STUB_RESPONSE_CONTENT));
    }
}
