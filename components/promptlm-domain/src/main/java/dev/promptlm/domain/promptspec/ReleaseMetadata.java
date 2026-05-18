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

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Release operation metadata attached under PromptSpec extensions.
 *
 * <p>{@code releasedSemanticHash} captures the {@link PromptSpec#computeSemanticHash()}
 * value at the moment the release reached the {@link #STATE_RELEASED} state.
 * The UI compares it against the current spec's {@code semanticHash} to decide
 * whether the Release action is meaningful (see issue #186). The field is
 * optional — pre-existing release records that were stamped before #186 will
 * carry {@code null}, and callers must treat that as "unknown baseline" and
 * keep Release available rather than locking the user out.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReleaseMetadata(
        @JsonProperty("state") String state,
        @JsonProperty("mode") String mode,
        @JsonProperty("version") String version,
        @JsonProperty("tag") String tag,
        @JsonProperty("branch") String branch,
        @JsonProperty("prNumber") Integer prNumber,
        @JsonProperty("prUrl") String prUrl,
        @JsonProperty("existing") Boolean existing,
        @JsonProperty("releasedSemanticHash") String releasedSemanticHash) {

    public static final String STATE_REQUESTED = "requested";
    public static final String STATE_RELEASED = "released";
    public static final String MODE_DIRECT = "direct";
    public static final String MODE_PR_TWO_PHASE = "pr_two_phase";

    public ReleaseMetadata {
        if (state == null || state.isBlank()) {
            throw new IllegalArgumentException("Release metadata state must not be blank");
        }
        if (mode == null || mode.isBlank()) {
            throw new IllegalArgumentException("Release metadata mode must not be blank");
        }
    }

    /**
     * Back-compat constructor used by older call-sites that don't carry the
     * post-#186 released-content hash. Equivalent to passing {@code null} for
     * {@link #releasedSemanticHash}.
     */
    public ReleaseMetadata(
            String state,
            String mode,
            String version,
            String tag,
            String branch,
            Integer prNumber,
            String prUrl,
            Boolean existing) {
        this(state, mode, version, tag, branch, prNumber, prUrl, existing, null);
    }

    public boolean isRequested() {
        return STATE_REQUESTED.equalsIgnoreCase(state);
    }

    public boolean isReleased() {
        return STATE_RELEASED.equalsIgnoreCase(state);
    }

    /**
     * Returns a copy with {@code releasedSemanticHash} replaced. Used by the
     * release lifecycle to stamp the content hash at the moment a release
     * transitions to {@link #STATE_RELEASED} (see #186).
     */
    public ReleaseMetadata withReleasedSemanticHash(String hash) {
        return new ReleaseMetadata(state, mode, version, tag, branch, prNumber, prUrl, existing, hash);
    }
}
