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

package dev.promptlm.execution.litellm;

import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.Callable;

/**
 * Polls the LiteLLM HTTP endpoint until it responds with a non-error status.
 */
public class LiteLlmReadinessProbe {

    private static final Logger LOGGER = LoggerFactory.getLogger(LiteLlmReadinessProbe.class);

    private static final Duration POLL_INTERVAL = Duration.ofSeconds(1);

    private final HttpClient httpClient;

    public LiteLlmReadinessProbe() {
        this(HttpClient.newHttpClient());
    }

    LiteLlmReadinessProbe(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public boolean waitUntilReady(String readinessUrl, Duration timeout) {
        int maxAttempts = calculateAttempts(timeout);

        RetryConfig retryConfig = RetryConfig.<Boolean>custom()
                .maxAttempts(maxAttempts)
                .waitDuration(POLL_INTERVAL)
                .retryOnException(ex -> {
                    if (ex instanceof InterruptedException) {
                        Thread.currentThread().interrupt();
                        return false;
                    }
                    LOGGER.debug("LiteLLM readiness attempt failed: {}", ex.getMessage());
                    return true;
                })
                .build();

        Retry retry = Retry.of("liteLlm-readiness", retryConfig);
        retry.getEventPublisher().onRetry(event -> LOGGER.debug("Retrying LiteLLM readiness check: attempt {} of {}", event.getNumberOfRetryAttempts(), maxAttempts));

        Callable<Boolean> readinessCheck = () -> {
            HttpRequest request = HttpRequest.newBuilder(URI.create(readinessUrl))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 400) {
                LOGGER.info("LiteLLM container is ready (status {})", response.statusCode());
                return true;
            }

            throw new IllegalStateException("LiteLLM readiness endpoint returned status " + response.statusCode());
        };

        Callable<Boolean> retriedCheck = Retry.decorateCallable(retry, readinessCheck);

        try {
            return retriedCheck.call();
        }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return false;
        }
        catch (Exception ex) {
            LOGGER.warn("LiteLLM container did not become ready within {} attempts: {}", maxAttempts, ex.getMessage());
            return false;
        }
    }

    private int calculateAttempts(Duration timeout) {
        long intervalMillis = Math.max(1, POLL_INTERVAL.toMillis());
        long timeoutMillis = Math.max(intervalMillis, timeout.toMillis());
        long attempts = (timeoutMillis + intervalMillis - 1) / intervalMillis; // ceil division
        return (int) Math.max(1, Math.min(Integer.MAX_VALUE, attempts));
    }
}
