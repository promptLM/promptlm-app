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
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PromptSpecExtensionsTest {

    private final ObjectMapper mapper = ObjectMapperFactory.createYamlMapper();

    @Test
    void deserializeExtensionsFromExtensionsProperty() throws Exception {
        String yaml = """
                name: Sample
                group: sample
                version: 1.0
                extensions:
                  x-custom:
                    foo: bar
                """;

        PromptSpec spec = mapper.readValue(yaml, PromptSpec.class);

        assertThat(spec.getExtensions()).containsKey("x-custom");
        assertThat(spec.getExtension("x-custom").get("foo").asText()).isEqualTo("bar");

        String serialized = mapper.writeValueAsString(spec);
        assertThat(serialized).contains("extensions:");
        assertThat(serialized).contains("x-custom:");
    }

    @Test
    void capturesTopLevelExtensionKeys() throws Exception {
        String yaml = """
                name: Sample
                group: sample
                version: 1.0
                x-top:
                  foo: bar
                """;

        PromptSpec spec = mapper.readValue(yaml, PromptSpec.class);

        assertThat(spec.getExtensions()).containsKey("x-top");
        assertThat(spec.getExtension("x-top").get("foo").asText()).isEqualTo("bar");
    }

    @Test
    void legacyEvaluationFieldsMapIntoExtensions() throws Exception {
        String yaml = """
                name: Sample
                group: sample
                version: 1.0
                evaluationSpec:
                  evaluations: []
                evaluationResults:
                  evaluations: []
                  status: NOT_CONFIGURED
                """;

        PromptSpec spec = mapper.readValue(yaml, PromptSpec.class);

        assertThat(spec.getExtensions()).containsKey("x-evaluation");
        JsonNode evaluationNode = spec.getExtension("x-evaluation");
        assertThat(evaluationNode.get("spec")).isNotNull();
        assertThat(evaluationNode.get("results")).isNotNull();
    }

    @Test
    void roundTripsOpaqueExtensionPayload() throws Exception {
        String yaml = """
                name: Sample
                group: sample
                version: 1.0
                extensions:
                  x-custom:
                    custom:
                      foo: bar
                    list:
                      - one
                      - two
                """;

        PromptSpec spec = mapper.readValue(yaml, PromptSpec.class);

        JsonNode customNode = spec.getExtension("x-custom");
        assertThat(customNode).isNotNull();
        assertThat(customNode.get("custom").get("foo").asText()).isEqualTo("bar");
        assertThat(customNode.get("list").size()).isEqualTo(2);

        String serialized = mapper.writeValueAsString(spec);
        assertThat(serialized).contains("extensions:");
        assertThat(serialized).contains("x-custom:");
        assertThat(serialized).contains("custom:");
        assertThat(serialized).contains("foo: bar");
        assertThat(serialized).contains("- one");
    }

    @Test
    void releaseMetadataIsStoredUnderPromptlmExtension() throws Exception {
        PromptSpec spec = PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion("1.0.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withType(ChatCompletionRequest.TYPE)
                        .build())
                .build()
                .withReleaseMetadata(new ReleaseMetadata(
                        ReleaseMetadata.STATE_REQUESTED,
                        ReleaseMetadata.MODE_PR_TWO_PHASE,
                        "1.0.0",
                        "prompt-v1.0.0",
                        "release/prompt-1.0.0",
                        42,
                        "https://github.com/org/repo/pull/42",
                        false
                ));

        assertThat(spec.getReleaseMetadata()).isNotNull();
        assertThat(spec.getReleaseMetadata().state()).isEqualTo(ReleaseMetadata.STATE_REQUESTED);
        assertThat(spec.getReleaseMetadata().mode()).isEqualTo(ReleaseMetadata.MODE_PR_TWO_PHASE);
        assertThat(spec.getExtensions()).containsKey("x-promptlm");
        assertThat(spec.getExtension("x-promptlm").get("release").get("prNumber").asInt()).isEqualTo(42);
    }

    @Test
    void deserializesReleaseMetadataFromPromptlmExtension() throws Exception {
        String yaml = """
                name: Sample
                group: sample
                version: 1.0
                extensions:
                  x-promptlm:
                    release:
                      state: released
                      mode: direct
                      version: 1.0
                      tag: sample-v1.0
                      existing: true
                """;

        PromptSpec spec = mapper.readValue(yaml, PromptSpec.class);

        assertThat(spec.getReleaseMetadata()).isNotNull();
        assertThat(spec.getReleaseMetadata().isReleased()).isTrue();
        assertThat(spec.getReleaseMetadata().existing()).isTrue();
    }

    @Test
    void rejectsNonExtensionKey() {
        ObjectNode node = mapper.createObjectNode().put("foo", "bar");
        Map<String, JsonNode> extensions = Map.of("custom", node);

        assertThatThrownBy(() -> PromptSpec.builder()
                .withGroup("group")
                .withName("name")
                .withVersion("1.0")
                .withRevision(1)
                .withDescription("desc")
                .withRequest(ChatCompletionRequest.builder()
                        .withType(ChatCompletionRequest.TYPE)
                        .build())
                .withExtensions(extensions)
                .build())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("x-");
    }
}
