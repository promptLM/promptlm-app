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

package dev.promptlm.web;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "Capabilities", description = "Feature flags advertised by the server")
public class CapabilitiesResponse {

    @Schema(description = "Enabled capability identifiers", example = "[]")
    private List<String> features = List.of();

    public CapabilitiesResponse() {
    }

    public CapabilitiesResponse(List<String> features) {
        this.features = features == null ? List.of() : features;
    }

    public static CapabilitiesResponse empty() {
        return new CapabilitiesResponse(List.of());
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features == null ? List.of() : features;
    }
}
