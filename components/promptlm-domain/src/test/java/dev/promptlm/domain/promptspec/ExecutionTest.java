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

import dev.promptlm.domain.ObjectMapperFactory;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ExecutionTest {

    private final JsonMapper mapper = ObjectMapperFactory.createJsonMapper();

    @Test
    void kindOrManual_defaults_when_field_is_null() {
        Execution execution = new Execution("e1", Instant.now(), null, null, null);
        assertThat(execution.getKind()).isNull();
        assertThat(execution.kindOrManual()).isEqualTo(ExecutionKind.MANUAL);
    }

    @Test
    void serialization_roundtrips_kind_and_failureClass() {
        Execution original = new Execution(
                "e1",
                Instant.parse("2026-05-08T00:00:00Z"),
                null,
                null,
                null,
                100L,
                10,
                20,
                null,
                "ci",
                "r3",
                "ada",
                false,
                "vendor 503",
                ExecutionKind.PRE_RELEASE,
                FailureClass.INFRASTRUCTURE);

        String json = mapper.writeValueAsString(original);
        assertThat(json).contains("\"kind\":\"PRE_RELEASE\"");
        assertThat(json).contains("\"failureClass\":\"INFRASTRUCTURE\"");

        Execution roundtripped = mapper.readValue(json, Execution.class);
        assertThat(roundtripped).isEqualTo(original);
        assertThat(roundtripped.getKind()).isEqualTo(ExecutionKind.PRE_RELEASE);
        assertThat(roundtripped.getFailureClass()).isEqualTo(FailureClass.INFRASTRUCTURE);
    }

    @Test
    void cost_is_not_a_persisted_domain_field() {
        // Refactor of issue #182 (see PromptSpecApiView): USD cost is derived at
        // read-time from the configured per-model pricing table. Persisting it on
        // Execution would freeze a value that becomes a silent lie the moment the
        // operator edits application.yml. Stale data with no rebuild path was the
        // pollution we removed; this test pins the intent.
        Execution execution = new Execution("e1", Instant.now(), null, null, null);
        String json = mapper.writeValueAsString(execution);
        assertThat(json).doesNotContain("\"cost\"");
        assertThat(json).doesNotContain("\"costUsd\"");
    }

    @Test
    void deserialization_back_compatible_without_new_fields() {
        String legacyJson = """
                {
                  "id": "old",
                  "timestamp": "2025-01-01T00:00:00Z",
                  "ok": true
                }
                """;

        Execution execution = mapper.readValue(legacyJson, Execution.class);
        assertThat(execution.getKind()).isNull();
        assertThat(execution.getFailureClass()).isNull();
        assertThat(execution.kindOrManual()).isEqualTo(ExecutionKind.MANUAL);
        assertThat(execution.okOrDefault()).isTrue();
    }

    @Test
    void deserialization_tolerates_legacy_cost_field_on_disk() {
        // Older versions of the application briefly persisted a `cost` field
        // (initial #182 implementation). Repositories that still contain it
        // must keep deserialising — unknown properties are ignored.
        String legacyJsonWithCost = """
                {
                  "id": "old",
                  "timestamp": "2025-01-01T00:00:00Z",
                  "tokensIn": 10,
                  "tokensOut": 20,
                  "cost": 0.00214,
                  "ok": true
                }
                """;

        Execution execution = mapper.readValue(legacyJsonWithCost, Execution.class);
        assertThat(execution.getId()).isEqualTo("old");
        assertThat(execution.getTokensIn()).isEqualTo(10);
        assertThat(execution.getTokensOut()).isEqualTo(20);
        assertThat(execution.okOrDefault()).isTrue();
    }
}
