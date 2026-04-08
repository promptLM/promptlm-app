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

@Schema(description = "Describes the primary vendor and model configuration for a prompt")
public class VendorAndModel {
    @Schema(description = "LLM vendor identifier", example = "openai")
    private String vendorName;
    @Schema(description = "Model name", example = "gpt-4o-mini")
    private String model;
    @Schema(description = "Optional endpoint override", example = "https://api.openai.com/v1/chat/completions")
    private String endpoint;

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }
}
