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

package dev.promptlm.domain.promptspec;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import dev.promptlm.domain.ObjectMapperFactory;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ReleaseExtensions {

    public static final String KEY = "x-promptlm";
    private static final String RELEASE_KEY = "release";
    private static final ObjectMapper MAPPER = ObjectMapperFactory.createJsonMapper();

    private ReleaseExtensions() {
    }

    public static ReleaseMetadata readRelease(Map<String, JsonNode> extensions) {
        if (extensions == null || extensions.isEmpty()) {
            return null;
        }
        JsonNode promptlm = extensions.get(KEY);
        if (promptlm == null || !promptlm.isObject()) {
            return null;
        }
        JsonNode releaseNode = promptlm.get(RELEASE_KEY);
        if (releaseNode == null || releaseNode.isNull()) {
            return null;
        }
        return MAPPER.convertValue(releaseNode, ReleaseMetadata.class);
    }

    public static Map<String, JsonNode> withRelease(Map<String, JsonNode> extensions, ReleaseMetadata metadata) {
        Map<String, JsonNode> updated = (extensions == null || extensions.isEmpty())
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(extensions);

        ObjectNode promptlmNode = resolvePromptlmNode(updated);
        if (metadata == null) {
            promptlmNode.remove(RELEASE_KEY);
        } else {
            promptlmNode.set(RELEASE_KEY, MAPPER.valueToTree(metadata));
        }

        if (promptlmNode.isEmpty()) {
            updated.remove(KEY);
        } else {
            updated.put(KEY, promptlmNode);
        }

        return updated;
    }

    private static ObjectNode resolvePromptlmNode(Map<String, JsonNode> extensions) {
        JsonNode existing = extensions.get(KEY);
        if (existing != null && existing.isObject()) {
            return ((ObjectNode) existing).deepCopy();
        }
        return MAPPER.createObjectNode();
    }
}
