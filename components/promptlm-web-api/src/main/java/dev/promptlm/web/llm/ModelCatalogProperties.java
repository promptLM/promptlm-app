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

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
@ConfigurationProperties(prefix = "promptlm.models")
public class ModelCatalogProperties {

    /**
     * Optional allow-list for models per vendor.
     */
    private Map<String, Set<String>> allowed = new HashMap<>();

    public Map<String, Set<String>> getAllowed() {
        return allowed;
    }

    public void setAllowed(Map<String, Set<String>> allowed) {
        this.allowed = allowed;
    }
}
