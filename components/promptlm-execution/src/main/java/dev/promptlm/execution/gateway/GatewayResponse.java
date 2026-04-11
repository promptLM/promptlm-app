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

import dev.promptlm.domain.promptspec.Response;

/**
 * Standard response object returned by prompt gateways.
 */
public final class GatewayResponse {

    private final Response response;

    private GatewayResponse(Response response) {
        this.response = response;
    }

    public static GatewayResponse of(Response response) {
        if (response == null) {
            throw new IllegalArgumentException("response must not be null");
        }
        return new GatewayResponse(response);
    }

    public Response response() {
        return response;
    }
}
