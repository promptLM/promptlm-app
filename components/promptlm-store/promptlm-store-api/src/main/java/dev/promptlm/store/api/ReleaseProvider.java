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
 * Identifies the CI/CD platform that hosts the generated release workflow for a
 * promptLM store repository.
 * <p>
 * The enum is intentionally minimal — new providers (for example
 * {@code GITLAB_CI}) can be added without touching the consuming code, because
 * provider selection is dispatched through {@code ReleaseTemplateProvider}
 * implementations rather than through {@code switch} statements on this value.
 */
public enum ReleaseProvider {

    /**
     * Release workflow files target GitHub Actions / Gitea Actions.
     */
    GITHUB_ACTIONS,

    /**
     * No release workflow is generated. Used when release capability is disabled
     * (Mode 1 / "no release" configurations).
     */
    NONE
}
