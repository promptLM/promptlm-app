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
        @JsonProperty("existing") Boolean existing) {

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

    public boolean isRequested() {
        return STATE_REQUESTED.equalsIgnoreCase(state);
    }

    public boolean isReleased() {
        return STATE_RELEASED.equalsIgnoreCase(state);
    }
}
