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
 * Sink for {@link ReleaseAuditEvent}s emitted from release-side lifecycle actions.
 *
 * <p>The default implementation, {@link Slf4jReleaseAuditLogger}, writes one structured
 * SLF4J entry per event on a dedicated logger ({@code dev.promptlm.lifecycle.audit.release}).
 * Tests may substitute a Mockito mock or a capturing test double.
 *
 * <p>Implementations must be thread-safe and must not throw &mdash; release behaviour is
 * never altered by the audit emission. If recording fails, the implementation is expected to
 * swallow or down-grade the failure (the default impl relies on the underlying logger contract
 * which already provides this guarantee).
 */
public interface ReleaseAuditLogger {

    /**
     * Record a single audit event.
     *
     * @param event the event to record (never {@code null})
     */
    void record(ReleaseAuditEvent event);
}
