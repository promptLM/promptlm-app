// Copyright 2025 promptLM
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Feature flags for the v2 UI rollout. Defaults match the v1 ship target;
 * flip via Vite env vars (`VITE_FEATURE_*`) for local development or staged
 * rollout. Each flag corresponds to a tracked GitHub issue that documents
 * why the surface is currently gated and what unblocks it.
 *
 * Booleans only — keep this module as a static, tree-shakeable lookup so a
 * disabled feature can be dead-code-eliminated by the Vite build when the
 * flag is read inline (e.g. `featureFlags.evals && <Evals />`).
 */
export const featureFlags = {
  /**
   * Evaluations surface (catalog facet, eval column, detail rail, evals tab).
   * Re-introduce when the commercial rollout is scoped — issue #80.
   */
  evals: import.meta.env.VITE_FEATURE_EVALS === 'true',

  /**
   * MCP-bound-servers panel on the detail page. Out of scope for v1.
   */
  mcpBindings: import.meta.env.VITE_FEATURE_MCP === 'true',

  /**
   * Revision history table on the detail page. Depends on the backend
   * exposing per-prompt revisions — issue #76.
   */
  revisionHistory: import.meta.env.VITE_FEATURE_HISTORY === 'true',

  /**
   * Spec-level prompt diff page. Depends on `revisionHistory` — issue #78.
   */
  promptDiff: import.meta.env.VITE_FEATURE_DIFF === 'true',

  /**
   * Dev-execution metrics (catalog sparklines, detail metrics strip,
   * recent-runs table). View-models stub missing Execution fields until
   * the OpenAPI schema lands — issue #77. Default ON; UI degrades to em-dash
   * placeholders when no execution data is present.
   */
  executionMetrics: import.meta.env.VITE_FEATURE_EXEC_METRICS !== 'false',

  /**
   * Compose / Test / Observe mode switch on the detail page (PromptDetailV2).
   * Deferred — issue #79.
   */
  testRunner: import.meta.env.VITE_FEATURE_TEST_RUNNER === 'true',
} as const;

export type FeatureFlag = keyof typeof featureFlags;
