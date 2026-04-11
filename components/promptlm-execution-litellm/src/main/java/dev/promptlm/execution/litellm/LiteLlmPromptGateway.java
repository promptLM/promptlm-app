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

import dev.promptlm.execution.PromptGateway;
import dev.promptlm.execution.gateway.GatewayRequest;
import dev.promptlm.execution.gateway.GatewayResponse;
import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.ChatCompletionResponse;
import dev.promptlm.domain.promptspec.PromptSpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

/**
 * Prompt gateway that forwards requests to a LiteLLM HTTP endpoint.
 */
public class LiteLlmPromptGateway implements PromptGateway {

    private static final Logger LOGGER = LoggerFactory.getLogger(LiteLlmPromptGateway.class);

    private final LiteLlmGatewayProperties properties;

    private final RestClient restClient;

    private final boolean active;

    public LiteLlmPromptGateway(LiteLlmGatewayProperties properties, RestClient restClient, boolean active) {
        this.properties = properties;
        this.restClient = restClient;
        this.active = active;
    }

    @Override
    public boolean supports(String vendor, String model) {
        if (!active) {
            return false;
        }
        if (vendor == null) {
            return false;
        }
        String normalizedVendor = vendor.trim().toLowerCase(Locale.ROOT);
        if (!Objects.equals(normalizedVendor, properties.getVendor().toLowerCase(Locale.ROOT))) {
            return false;
        }
        if (model == null || model.isBlank()) {
            return true;
        }
        String normalizedModel = model.trim().toLowerCase(Locale.ROOT);
        if (properties.getModelAliases().isEmpty()) {
            return true;
        }
        return properties.getModelAliases().containsKey(normalizedModel)
                || properties.getModelAliases().containsKey(model);
    }

    @Override
    public GatewayResponse execute(GatewayRequest request) {
        if (!active) {
            throw new IllegalStateException("LiteLLM gateway is not active");
        }
        PromptSpec promptSpec = request.promptSpec();
        if (!(promptSpec.getRequest() instanceof ChatCompletionRequest chatRequest)) {
            throw new UnsupportedOperationException("LiteLLM gateway only supports chat/completion requests");
        }

        String targetModel = resolveModel(chatRequest.getModel());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ChatCompletionRequest transformedRequest = chatRequest.withVendor(properties.getVendor())
                .withModel(targetModel)
                .withUrl(null);

        HttpEntity<String> body = new HttpEntity<>(transformedRequest.renderBody(), headers);

        try {
            ResponseEntity<ChatCompletionResponse> response = restClient.post()
                    .uri("/v1/chat/completions")
                    .body(body)
                    .retrieve()
                    .toEntity(ChatCompletionResponse.class);

            ChatCompletionResponse chatResponse = Optional.ofNullable(response.getBody())
                    .orElseGet(ChatCompletionResponse::new);
            return GatewayResponse.of(chatResponse);
        }
        catch (RestClientResponseException ex) {
            String responseBody = ex.getResponseBodyAsString();
            LOGGER.warn("LiteLLM request failed with status {}: {}", ex.getStatusCode(), responseBody);
            throw new IllegalStateException("LiteLLM invocation failed with status " + ex.getStatusCode().value()
                    + (responseBody == null || responseBody.isBlank() ? "" : ": " + responseBody), ex);
        }
        catch (RestClientException ex) {
            LOGGER.warn("LiteLLM request failed: {}", ex.getMessage());
            throw new IllegalStateException("LiteLLM invocation failed", ex);
        }
    }

    private String resolveModel(String requestedModel) {
        if (requestedModel == null || requestedModel.isBlank()) {
            return requestedModel;
        }
        String normalized = requestedModel.trim().toLowerCase(Locale.ROOT);
        return properties.getModelAliases().getOrDefault(normalized,
                properties.getModelAliases().getOrDefault(requestedModel, requestedModel));
    }
}
