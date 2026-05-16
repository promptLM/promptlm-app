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

package dev.promptlm.lifecycle.failure;

import dev.promptlm.domain.promptspec.FailureClass;
import dev.promptlm.domain.promptspec.FailureClassification;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.Optional;

/**
 * Built-in fallback classifier — preserves verbatim the heuristic that previously lived in
 * {@code PreReleaseExecuteGate.classify(Throwable)}, lifted to the SPI and enriched with
 * curated user messages.
 *
 * <p>Registered at {@link Ordered#LOWEST_PRECEDENCE} so adapter-specific classifiers always
 * run first; this implementation is the safety net.
 *
 * <p>Recognises:
 * <ul>
 *   <li>{@link SocketTimeoutException} → {@code TIMEOUT} (infrastructure)</li>
 *   <li>{@link IOException} → {@code NETWORK} (infrastructure)</li>
 *   <li>Spring {@code ResourceAccessException} → {@code NETWORK} (infrastructure)</li>
 *   <li>5xx-shaped HTTP exceptions (server error, bad gateway, service unavailable,
 *       gateway timeout) → {@code VENDOR_5XX} (infrastructure)</li>
 * </ul>
 *
 * <p>Returns {@link Optional#empty()} when nothing in the cause chain matches; the resolver
 * then applies its fail-closed default (PROMPT class).
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class DefaultPromptExecutorFailureClassifier implements PromptExecutorFailureClassifier {

    @Override
    public Optional<FailureClassification> classify(Throwable cause) {
        Throwable cursor = cause;
        while (cursor != null) {
            if (cursor instanceof SocketTimeoutException) {
                return Optional.of(new FailureClassification(
                        FailureClass.INFRASTRUCTURE, "TIMEOUT", "Vendor request timed out"));
            }
            if (cursor instanceof IOException) {
                return Optional.of(new FailureClassification(
                        FailureClass.INFRASTRUCTURE, "NETWORK", "Vendor network error"));
            }
            String name = cursor.getClass().getName();
            if (name.equals("org.springframework.web.client.ResourceAccessException")) {
                return Optional.of(new FailureClassification(
                        FailureClass.INFRASTRUCTURE, "NETWORK", "Vendor unreachable"));
            }
            // Spring's HttpServerErrorException.create() returns inner subclasses
            // (HttpServerErrorException$InternalServerError, $BadGateway, etc.) — match
            // both the bare class and the $-suffixed family.
            if (name.endsWith("HttpServerErrorException")
                    || name.contains("HttpServerErrorException$")
                    || name.endsWith("WebClientResponseException$InternalServerError")
                    || name.endsWith("WebClientResponseException$BadGateway")
                    || name.endsWith("WebClientResponseException$ServiceUnavailable")
                    || name.endsWith("WebClientResponseException$GatewayTimeout")) {
                return Optional.of(new FailureClassification(
                        FailureClass.INFRASTRUCTURE, "VENDOR_5XX", "Vendor service error"));
            }
            cursor = cursor.getCause();
        }
        return Optional.empty();
    }
}
