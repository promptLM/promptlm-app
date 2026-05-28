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
 * Raised when the store backend rejects the configured credentials (e.g. an
 * invalid or insufficiently scoped token). Distinct from a generic
 * {@link RemoteRepositoryProvisioningException} so callers can prompt the user
 * to fix their credentials rather than treating it as an upstream outage.
 */
public class RemoteRepositoryAuthenticationException extends RemoteRepositoryProvisioningException {

    public RemoteRepositoryAuthenticationException(String baseUrl, int httpStatus, Throwable cause) {
        super("Remote repository credentials for '%s' were rejected (HTTP %d). Check the configured access token and its scopes."
                .formatted(baseUrl, httpStatus), httpStatus, cause);
    }
}
