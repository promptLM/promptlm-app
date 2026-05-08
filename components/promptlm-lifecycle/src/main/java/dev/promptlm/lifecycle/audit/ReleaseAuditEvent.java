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
 * Structured payload describing a single release-side action for the audit trail.
 *
 * <p>The schema is intentionally stable: fields whose source is not yet wired in this branch
 * (e.g. {@code caller} pre-#124, {@code onInfraFailure} pre-#96, {@code executionId} pre-#96)
 * are emitted as {@code null}. When their providers land, only the
 * {@link DefaultPromptLifecycleService} call sites and {@link ReleaseAuditContext} implementations
 * change &mdash; the schema and the {@link ReleaseAuditLogger} stay put.
 *
 * <p>Exception details for sad paths are captured as {@code exceptionType}/{@code exceptionMessage}
 * strings only. Stack traces are intentionally omitted from the structured fields to avoid
 * leaking internals through audit consumers; the underlying logger framework remains free to
 * render the original throwable separately if configured to do so.
 *
 * @param outcome              the release outcome class (never {@code null})
 * @param promptSpecId         the prompt spec id the action targeted
 * @param mode                 release-promotion mode that materialised on the returned
 *                             {@code ReleaseMetadata}, or {@code null} on failure paths where
 *                             no metadata is returned
 * @param pullRequestReference PR reference for {@code completeReleasePrompt}, otherwise {@code null}
 * @param correlationId        per-call identifier (UUID by default; reads from MDC when an inbound
 *                             correlation filter is in place)
 * @param caller               authenticated caller identity ({@code null} until #124 lands)
 * @param onInfraFailure       value of the {@code ?onInfraFailure} override flag
 *                             ({@code null} until #96 lands)
 * @param executionId          id of the gating {@code Execution} attached to the released revision
 *                             ({@code null} until #96 lands)
 * @param exceptionType        simple class name of a thrown exception on sad paths,
 *                             {@code null} on happy paths
 * @param exceptionMessage     message of a thrown exception on sad paths, {@code null} on happy paths
 */
public record ReleaseAuditEvent(
        ReleaseAuditOutcome outcome,
        String promptSpecId,
        String mode,
        String pullRequestReference,
        String correlationId,
        String caller,
        String onInfraFailure,
        String executionId,
        String exceptionType,
        String exceptionMessage
) {

    /**
     * Build an event for a release-side action that completed without throwing.
     *
     * @param outcome        must be {@link ReleaseAuditOutcome#RELEASED} or
     *                       {@link ReleaseAuditOutcome#REQUESTED}
     * @param onInfraFailure the resolved value of the override flag at call time
     *                       ({@code null} on the {@code completeReleasePrompt} path)
     */
    public static ReleaseAuditEvent forSuccess(ReleaseAuditOutcome outcome,
                                               String promptSpecId,
                                               String mode,
                                               String pullRequestReference,
                                               String correlationId,
                                               String caller,
                                               String executionId,
                                               String onInfraFailure) {
        return new ReleaseAuditEvent(
                outcome,
                promptSpecId,
                mode,
                pullRequestReference,
                correlationId,
                caller,
                onInfraFailure,
                executionId,
                null,
                null
        );
    }

    /**
     * Backwards-compatible single-arg-light overload that emits {@code null} for
     * {@code onInfraFailure}. Useful in tests that don't care about the override flag.
     */
    public static ReleaseAuditEvent forSuccess(ReleaseAuditOutcome outcome,
                                               String promptSpecId,
                                               String mode,
                                               String pullRequestReference,
                                               String correlationId,
                                               String caller,
                                               String executionId) {
        return forSuccess(outcome, promptSpecId, mode, pullRequestReference,
                correlationId, caller, executionId, null);
    }

    /**
     * Build an event for a release-side action that threw.
     *
     * @param outcome must be {@link ReleaseAuditOutcome#BLOCKED_PROMPT} or
     *                {@link ReleaseAuditOutcome#BLOCKED_INFRA}
     * @param error   the original throwable; only its simple class name and message are captured
     */
    public static ReleaseAuditEvent forFailure(ReleaseAuditOutcome outcome,
                                               String promptSpecId,
                                               String mode,
                                               String pullRequestReference,
                                               String correlationId,
                                               String caller,
                                               String executionId,
                                               String onInfraFailure,
                                               Throwable error) {
        return new ReleaseAuditEvent(
                outcome,
                promptSpecId,
                mode,
                pullRequestReference,
                correlationId,
                caller,
                onInfraFailure,
                executionId,
                error == null ? null : error.getClass().getSimpleName(),
                error == null ? null : error.getMessage()
        );
    }

    /**
     * Backwards-compatible overload that emits {@code null} for {@code onInfraFailure}.
     */
    public static ReleaseAuditEvent forFailure(ReleaseAuditOutcome outcome,
                                               String promptSpecId,
                                               String mode,
                                               String pullRequestReference,
                                               String correlationId,
                                               String caller,
                                               String executionId,
                                               Throwable error) {
        return forFailure(outcome, promptSpecId, mode, pullRequestReference,
                correlationId, caller, executionId, null, error);
    }
}
