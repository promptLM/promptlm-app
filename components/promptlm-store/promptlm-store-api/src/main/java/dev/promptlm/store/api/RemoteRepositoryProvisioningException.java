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

package dev.promptlm.store.api;

/**
 * Raised when a remote repository operation against the store backend fails for
 * reasons other than the target already existing. Carries the upstream HTTP
 * status (when known) so callers can map the failure to a meaningful response
 * instead of surfacing an opaque {@link RuntimeException}.
 */
public class RemoteRepositoryProvisioningException extends RuntimeException {

    private final Integer httpStatus;

    public RemoteRepositoryProvisioningException(String message, Throwable cause) {
        this(message, null, cause);
    }

    public RemoteRepositoryProvisioningException(String message, Integer httpStatus, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
    }

    /**
     * @return the upstream HTTP status code that triggered this failure, or
     *         {@code null} if the failure was not HTTP-related.
     */
    public Integer getHttpStatus() {
        return httpStatus;
    }
}
