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

import dev.promptlm.store.api.FieldValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.Map;

/**
 * Translates {@link FieldValidationException} into a field-scoped {@code 400} problem so the UI can
 * render the violation against the offending form field instead of as an opaque banner.
 *
 * <p>The {@code fieldErrors} array shape ({@code [{field, message}]}) matches what the web client's
 * {@code apiError} parser already reads.
 */
@RestControllerAdvice
class FieldValidationExceptionHandler {

    @ExceptionHandler(FieldValidationException.class)
    ResponseEntity<ProblemDetail> handleFieldValidation(FieldValidationException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        detail.setTitle("Validation failed");
        if (exception.getCode() != null) {
            detail.setProperty("code", exception.getCode());
        }
        detail.setProperty("fieldErrors", List.of(Map.of(
                "field", exception.getField() == null ? "" : exception.getField(),
                "message", exception.getMessage() == null ? "" : exception.getMessage()
        )));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }
}
