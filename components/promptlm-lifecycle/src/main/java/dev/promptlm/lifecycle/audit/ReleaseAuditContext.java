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
 * Per-call context that supplies the audit fields whose source lives outside the
 * lifecycle module &mdash; specifically the authenticated caller, the per-request
 * correlation id, and the gating execution id.
 *
 * <p>The {@link NoOpReleaseAuditContext} default implementation:
 * <ul>
 *     <li>returns {@code null} for {@link #caller()} (no auth wired today &mdash; #124),</li>
 *     <li>generates a fresh UUID per call for {@link #correlationId()} (no inbound
 *         correlation filter today; can be replaced when one lands),</li>
 *     <li>returns {@code null} for {@link #executionIdFor(String)} (no gating execution
 *         exists today &mdash; #96 introduces it).</li>
 * </ul>
 *
 * <p>Implementations should return quickly &mdash; they are called on the release path.
 * Implementations should not throw; failures should be down-graded to the default values
 * above.
 */
public interface ReleaseAuditContext {

    /**
     * @return the authenticated caller identity, or {@code null} if none is available
     */
    String caller();

    /**
     * @return a non-{@code null} per-call correlation identifier; implementations should
     * prefer an existing inbound id (e.g. from MDC) and fall back to a freshly minted
     * UUID if none is available
     */
    String correlationId();

    /**
     * @param promptSpecId the spec being released
     * @return the id of the gating {@code Execution} attached to the release, or
     * {@code null} if none is available
     */
    String executionIdFor(String promptSpecId);
}
