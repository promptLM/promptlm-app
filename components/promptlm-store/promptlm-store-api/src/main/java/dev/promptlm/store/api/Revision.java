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

package dev.promptlm.store.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import dev.promptlm.domain.promptspec.PromptSpec;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.Locale;

/**
 * A single entry in a prompt's revision history.
 *
 * <p>One {@code Revision} corresponds to one git commit that touched the
 * prompt's spec file. Records are ordered newest-first by the API.
 *
 * <p>{@link #spec()} may be {@code null} when the snapshot at that revision
 * cannot be deserialized into the current {@link PromptSpec} schema (e.g.
 * because the YAML format has evolved). Callers should treat this as
 * "metadata-only" — the commit happened, but the spec is unavailable.
 */
@Schema(description = "A single entry in a prompt's revision history (one per git commit that touched the spec file).")
public record Revision(
        @JsonProperty("rev")
        @Schema(description = "Sequential revision label, newest first (e.g. \"r34\").", example = "r34")
        String rev,

        @JsonProperty("tag")
        @Schema(description = "Semver-shaped git tag pointing at this commit, if any.", example = "v1.2.0", nullable = true)
        String tag,

        @JsonProperty("sha")
        @Schema(description = "Full git commit SHA. Stable identifier for this revision.", example = "8f2c3a4...")
        String sha,

        @JsonProperty("author")
        @Schema(description = "Display name of the commit author.", example = "Jane Doe")
        String author,

        @JsonProperty("when")
        @Schema(description = "Commit timestamp as ISO-8601 instant.", example = "2026-01-02T03:04:05Z")
        Instant when,

        @JsonProperty("msg")
        @Schema(description = "First line of the commit message.")
        String msg,

        @JsonProperty("kind")
        @Schema(description = "How this commit changed the prompt spec file.")
        Kind kind,

        @JsonProperty("spec")
        @Schema(description = "Full prompt-spec snapshot at this revision; null if the historical YAML cannot be deserialized.", nullable = true, implementation = PromptSpec.class)
        PromptSpec spec
) {

    @Schema(description = "How a revision changed the prompt spec file.", enumAsRef = true)
    public enum Kind {
        ADD,
        EDIT,
        REMOVE,
        RENAME;

        @JsonValue
        public String json() {
            return name().toLowerCase(Locale.ROOT);
        }
    }
}
