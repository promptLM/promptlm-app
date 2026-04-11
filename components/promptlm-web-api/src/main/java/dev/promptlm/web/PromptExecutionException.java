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

import org.springframework.http.HttpStatus;

class PromptExecutionException extends RuntimeException {

    private final String promptId;
    private final HttpStatus status;

    private PromptExecutionException(String promptId, HttpStatus status, RuntimeException cause) {
        super(cause);
        this.promptId = promptId;
        this.status = status;
    }

    static PromptExecutionException badRequest(String promptId, RuntimeException cause) {
        return new PromptExecutionException(promptId, HttpStatus.BAD_REQUEST, cause);
    }

    static PromptExecutionException internalServerError(String promptId, RuntimeException cause) {
        return new PromptExecutionException(promptId, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }

    String getPromptId() {
        return promptId;
    }

    HttpStatus getStatus() {
        return status;
    }
}
