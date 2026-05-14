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

    @ExceptionHandler(PromptExecutionException.class)
    ResponseEntity<ProblemDetail> handlePromptExecutionException(PromptExecutionException exception) {
        String message = resolveMessage(exception);
        if (exception.getStatus().is4xxClientError()) {
            log.warn("Prompt execution request failed (promptId={}): {}", exception.getPromptId(), message, exception);
        } else {
            log.error("Prompt execution failed (promptId={}): {}", exception.getPromptId(), message, exception);
        }

        ProblemDetail detail = ProblemDetail.forStatusAndDetail(exception.getStatus(), message);
        detail.setTitle("Prompt execution failed");
        return ResponseEntity.status(exception.getStatus())
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }

    @ExceptionHandler(PreReleasePromptFailure.class)
    ResponseEntity<ProblemDetail> handlePreReleasePromptFailure(PreReleasePromptFailure exception) {
        String message = resolveMessage(exception);
        log.warn("Pre-release prompt failure: {}", message, exception);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, message);
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
        String message = resolveMessage(exception);
        log.warn("Pre-release infrastructure failure: {}", message, exception);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, message);
        detail.setTitle("Pre-release infrastructure failure");
        detail.setProperty("code", exception.code());
        if (exception.failedExecution() != null) {
            detail.setProperty("failedExecutionId", exception.failedExecution().getId());
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }

    private String resolveMessage(PromptExecutionException exception) {
        Throwable cause = exception.getCause();
        if (cause != null && StringUtils.hasText(cause.getMessage())) {
            return VendorMessageSanitizer.sanitize(cause.getMessage());
        }
        if (StringUtils.hasText(exception.getMessage())) {
            return VendorMessageSanitizer.sanitize(exception.getMessage());
        }
        return "Prompt execution failed";
    }

    private String resolveMessage(RuntimeException exception) {
        Throwable cause = exception.getCause();
        if (cause != null && StringUtils.hasText(cause.getMessage())) {
            return VendorMessageSanitizer.sanitize(cause.getMessage());
        }
        if (StringUtils.hasText(exception.getMessage())) {
            return VendorMessageSanitizer.sanitize(exception.getMessage());
        }
        return "Pre-release execution failed";
    }
}
