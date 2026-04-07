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

package dev.promptlm.release;

import dev.promptlm.domain.promptspec.PromptSpec;

/**
 * Strategy for validating whether a prompt specification is eligible for release.
 * Throw {@link PromptReleaseException} to block a release.
 */
public interface PromptReleasePolicy {

    void validateRelease(PromptSpec promptSpec);
}
