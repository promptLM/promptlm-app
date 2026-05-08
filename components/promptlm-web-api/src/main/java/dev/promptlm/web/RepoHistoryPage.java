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

import dev.promptlm.domain.promptspec.Execution;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Page of executions returned by the repo-history endpoint, sorted newest
 * first. {@code total} is the total count across all pages for the current
 * filter; {@code hasMore} is {@code true} when at least one further page is
 * available.
 */
@Schema(description = "Page of historic executions returned by the repo-history endpoint")
public record RepoHistoryPage(
        @ArraySchema(schema = @Schema(implementation = Execution.class),
                arraySchema = @Schema(description = "Executions on the current page, newest first"))
        List<Execution> items,

        @Schema(description = "1-indexed page number", example = "1")
        int page,

        @Schema(description = "Number of items requested per page", example = "50")
        int pageSize,

        @Schema(description = "Total number of items matching the filter across all pages", example = "127")
        int total,

        @Schema(description = "True when at least one further page is available", example = "true")
        boolean hasMore
) {
}
