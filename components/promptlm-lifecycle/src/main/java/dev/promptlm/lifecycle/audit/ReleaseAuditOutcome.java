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

package dev.promptlm.lifecycle.audit;

/**
 * Outcome of a release-side action, recorded on the audit trail.
 *
 * <p>Values follow the four classes defined in issue #126:
 * <ul>
 *     <li>{@link #RELEASED} — the release pointer was moved.</li>
 *     <li>{@link #REQUESTED} — a release was requested (e.g. PR opened in pr_two_phase mode);
 *         the pointer has not moved yet.</li>
 *     <li>{@link #BLOCKED_PROMPT} — a domain-level guard rejected the release
 *         (failing evaluation, missing evaluation, policy reject, unsupported state).</li>
 *     <li>{@link #BLOCKED_INFRA} — the underlying store path failed for an infrastructure reason
 *         (network, vendor outage, unexpected runtime error).</li>
 * </ul>
 */
public enum ReleaseAuditOutcome {
    RELEASED,
    REQUESTED,
    BLOCKED_PROMPT,
    BLOCKED_INFRA
}
