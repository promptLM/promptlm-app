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

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Locale;

/**
 * Lifecycle state of a {@link PromptSpec}.
 *
 * <p>The state is a function of where the spec's content lives along the
 * persistence chain: form-only ({@link #DRAFT}), persisted but not yet
 * revisioned ({@link #SAVED}), revisioned in the local Git store
 * ({@link #COMMITTED}), or pushed to the remote ({@link #PUSHED}).
 *
 * <p><strong>{@code DRAFT} is a client-only state.</strong> The backend has no
 * observation of an in-browser form, so the API will never emit {@code DRAFT}
 * from a {@code GET}; the UI computes draft by diffing the form state against
 * the latest {@code PromptSpec} returned from the API. {@code DRAFT} is
 * present in this enum so the entire stack shares one vocabulary.
 *
 * <p>The state is <em>derived</em> from storage truth (on-disk YAML, HEAD
 * commit, origin/branch reachability) at the API boundary. It is never
 * accepted as input on writes.
 *
 * @see <a href="https://github.com/promptLM/promptlm-app/issues/189">Issue #189</a>
 */
@Schema(description = "Lifecycle state of a prompt spec. " +
        "`draft` is client-only (form-vs-server diff); the API only ever emits " +
        "`saved`, `committed`, or `pushed`.",
        enumAsRef = true)
public enum PromptSpecLifecycleState {

    /**
     * Form state has unpersisted changes. Computed by the UI by diffing the
     * editor's form state against the latest {@code PromptSpec} returned from
     * the API. Never emitted by the backend.
     */
    DRAFT,

    /**
     * Persisted to local storage but the working-tree YAML differs from the
     * latest commit that touched the spec file (or no commit exists yet for
     * the spec file).
     */
    SAVED,

    /**
     * Revisioned in the local Git store: HEAD of the active branch carries the
     * latest content for the spec file, but that commit is not yet on
     * {@code origin/<branch>}.
     */
    COMMITTED,

    /**
     * The commit that carries the current spec content is reachable on
     * {@code origin/<active-branch>}.
     */
    PUSHED;

    @JsonValue
    public String json() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static PromptSpecLifecycleState fromJson(String value) {
        if (value == null) {
            return null;
        }
        return PromptSpecLifecycleState.valueOf(value.toUpperCase(Locale.ROOT));
    }
}
