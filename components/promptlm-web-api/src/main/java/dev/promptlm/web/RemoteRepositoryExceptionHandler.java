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

import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates remote-repository provisioning exceptions into {@link ProblemDetail} responses so the UI
 * renders a readable message instead of the opaque default error body. The {@code detail}/{@code code}
 * shape matches what the web client's {@code apiError} parser reads.
 */
@RestControllerAdvice
class RemoteRepositoryExceptionHandler {

    @ExceptionHandler(RemoteRepositoryAlreadyExistsException.class)
    ResponseEntity<ProblemDetail> handleAlreadyExists(RemoteRepositoryAlreadyExistsException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "A repository named \"%s\" already exists on the remote. Choose a different name, or connect to the existing repository instead."
                        .formatted(exception.getRepositoryName()));
        detail.setTitle("Repository already exists");
        detail.setProperty("code", "store.remote.alreadyExists");
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(detail);
    }
}
