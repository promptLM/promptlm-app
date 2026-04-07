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

@Schema(description = "Model entry in the catalog.")
public class ModelCatalogModel {

    @Schema(description = "Model identifier", example = "gpt-4o")
    private String id;

    @Schema(description = "Display name", example = "gpt-4o")
    private String displayName;

    @Schema(description = "Origin of the model entry", example = "config")
    private String source;

    @Schema(description = "Whether the model supports chat/completion style requests")
    private boolean supportsChat = true;

    @Schema(description = "Whether additional configuration is required before use")
    private boolean requiresConfig = false;

    @Schema(description = "Optional target route for gateway aliases")
    private String target;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public boolean isSupportsChat() {
        return supportsChat;
    }

    public void setSupportsChat(boolean supportsChat) {
        this.supportsChat = supportsChat;
    }

    public boolean isRequiresConfig() {
        return requiresConfig;
    }

    public void setRequiresConfig(boolean requiresConfig) {
        this.requiresConfig = requiresConfig;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }
}
