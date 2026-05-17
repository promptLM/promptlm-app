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

import java.util.Objects;

/**
 * Classification of a vendor or infrastructure failure surfaced by an executor adapter.
 *
 * <p>Produced by a {@code PromptExecutorFailureClassifier}; consumed by both the release
 * gate (uses {@link #failureClass()} to decide softblock vs. hardblock) and the web
 * exception handler (uses {@link #userMessage()} as the user-facing problem detail in
 * place of the raw vendor exception text).
 *
 * @param failureClass coarse-grained category that drives release-gate behaviour
 * @param code         stable machine-readable code (e.g. {@code AUTH_FAILED}, {@code TIMEOUT})
 * @param userMessage  curated, vendor-neutral message safe to surface in HTTP responses and UI
 */
public record FailureClassification(FailureClass failureClass, String code, String userMessage) {

    public FailureClassification {
        Objects.requireNonNull(failureClass, "failureClass");
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(userMessage, "userMessage");
    }
}
