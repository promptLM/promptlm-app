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

package dev.promptlm.lifecycle.audit;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Default {@link ReleaseAuditContext} used when no environment-specific implementation
 * is provided. Returns {@code null} for caller and execution id, and a fresh UUID per call
 * for the correlation id.
 *
 * <p>Annotated with {@link Component} so it is registered automatically. Downstream Spring
 * configurations may register a {@code @Primary} {@link ReleaseAuditContext} bean to override
 * this default once auth (#124) and the gating-execution flow (#96) land.
 */
@Component
public class NoOpReleaseAuditContext implements ReleaseAuditContext {

    @Override
    public String caller() {
        return null;
    }

    @Override
    public String correlationId() {
        // TODO(#96/#124): once an inbound HTTP filter populates SLF4J MDC with a request id,
        // prefer MDC.get("correlationId") and only fall back to a fresh UUID when MDC is empty.
        // Done via an alternate @Primary ReleaseAuditContext bean once the filter exists.
        return UUID.randomUUID().toString();
    }

    @Override
    public String executionIdFor(String promptSpecId) {
        return null;
    }
}
