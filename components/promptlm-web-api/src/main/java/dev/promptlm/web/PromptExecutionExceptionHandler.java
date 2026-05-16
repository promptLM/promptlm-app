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

package dev.promptlm.web;

import dev.promptlm.domain.promptspec.FailureClassification;
import dev.promptlm.lifecycle.failure.PromptExecutorFailureClassifierResolver;
import dev.promptlm.release.PreReleaseInfrastructureFailure;
import dev.promptlm.release.PreReleasePromptFailure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class PromptExecutionExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(PromptExecutionExceptionHandler.class);

    private final PromptExecutorFailureClassifierResolver classifierResolver;

    PromptExecutionExceptionHandler(PromptExecutorFailureClassifierResolver classifierResolver) {
        this.classifierResolver = classifierResolver;
    }

    @ExceptionHandler(PromptExecutionException.class)
    ResponseEntity<ProblemDetail> handlePromptExecutionException(PromptExecutionException exception) {
        ResolvedMessage resolved = resolve(exception, exception.getCause(), "Prompt execution failed");
        if (exception.getStatus().is4xxClientError()) {
            log.warn("Prompt execution request failed (promptId={}, code={}): {}",
                    exception.getPromptId(), resolved.code, resolved.message, exception);
        } else {
            log.error("Prompt execution failed (promptId={}, code={}): {}",
                    exception.getPromptId(), resolved.code, resolved.message, exception);
        }

        ProblemDetail detail = ProblemDetail.forStatusAndDetail(exception.getStatus(), resolved.message);
        detail.setTitle("Prompt execution failed");
        if (resolved.code != null) {
            detail.setProperty("code", resolved.code);
        }
        return ResponseEntity.status(exception.getStatus())
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }

    @ExceptionHandler(PreReleasePromptFailure.class)
    ResponseEntity<ProblemDetail> handlePreReleasePromptFailure(PreReleasePromptFailure exception) {
        ResolvedMessage resolved = resolve(exception, exception.getCause(), "Pre-release execution failed");
        log.warn("Pre-release prompt failure (code={}): {}", exception.code(), resolved.message, exception);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, resolved.message);
        detail.setTitle("Pre-release prompt failure");
        detail.setProperty("code", exception.code());
        if (exception.failedExecution() != null) {
            detail.setProperty("failedExecutionId", exception.failedExecution().getId());
        }
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }

    @ExceptionHandler(PreReleaseInfrastructureFailure.class)
    ResponseEntity<ProblemDetail> handlePreReleaseInfrastructureFailure(PreReleaseInfrastructureFailure exception) {
        ResolvedMessage resolved = resolve(exception, exception.getCause(), "Pre-release execution failed");
        log.warn("Pre-release infrastructure failure (code={}): {}", exception.code(), resolved.message, exception);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, resolved.message);
        detail.setTitle("Pre-release infrastructure failure");
        detail.setProperty("code", exception.code());
        if (exception.failedExecution() != null) {
            detail.setProperty("failedExecutionId", exception.failedExecution().getId());
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }

    /**
     * Resolve the user-facing message + diagnostic code for an exception.
     *
     * <p>When a cause is present, the classifier resolver produces a curated, vendor-neutral
     * message — the handler <strong>never</strong> echoes {@code cause.getMessage()} directly,
     * to keep vendor-shaped text out of HTTP responses and structured logs.
     *
     * <p>When no cause is present, the exception's own message is used (created by us at the
     * call site — e.g. {@code PromptExecutionException.badRequest(...)} carries authored text).
     */
    private ResolvedMessage resolve(RuntimeException exception, Throwable cause, String fallback) {
        if (cause != null) {
            FailureClassification classification = classifierResolver.classify(cause);
            return new ResolvedMessage(classification.userMessage(), classification.code());
        }
        if (StringUtils.hasText(exception.getMessage())) {
            return new ResolvedMessage(exception.getMessage(), null);
        }
        return new ResolvedMessage(fallback, null);
    }

    private record ResolvedMessage(String message, String code) {}
}
