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

package dev.promptlm.domain.promptspec;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Origin of an Execution. MANUAL is a user/CLI-triggered run; PRE_RELEASE is the gating run captured by the pre-release-execute strategy.")
public enum ExecutionKind {
    MANUAL,
    PRE_RELEASE
}
