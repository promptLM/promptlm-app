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

import java.util.Optional;

/**
 * Filter parameters for the repo-history endpoint. {@code revision} narrows the
 * result to a single spec revision; {@code statusOk} narrows to successful
 * ({@code true}) or failed ({@code false}) executions. {@link Optional#empty()}
 * means the filter is not applied.
 */
public record RepoHistoryFilter(Optional<String> revision, Optional<Boolean> statusOk) {

    public static RepoHistoryFilter none() {
        return new RepoHistoryFilter(Optional.empty(), Optional.empty());
    }
}
