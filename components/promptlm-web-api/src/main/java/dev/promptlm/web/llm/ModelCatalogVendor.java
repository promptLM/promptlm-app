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

package dev.promptlm.web.llm;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "Vendor entry in the model catalog.")
public class ModelCatalogVendor {

    @Schema(description = "Vendor identifier", example = "openai")
    private String vendor;

    @Schema(description = "Display name for the vendor", example = "OpenAI")
    private String displayName;

    @Schema(description = "Whether the vendor is active/available")
    private boolean active = true;

    @Schema(description = "Models provided by the vendor")
    private List<ModelCatalogModel> models = new ArrayList<>();

    public String getVendor() {
        return vendor;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<ModelCatalogModel> getModels() {
        return models;
    }

    public void setModels(List<ModelCatalogModel> models) {
        this.models = models;
    }
}
