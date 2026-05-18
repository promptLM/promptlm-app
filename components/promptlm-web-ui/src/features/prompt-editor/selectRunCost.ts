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
 * Picks the per-execution USD cost from a raw API execution payload.
 *
 * Issue #182 — original implementation persisted the cost directly on the
 * Execution domain object. That has since been refactored: USD cost depends
 * on the operator-managed per-model pricing table (mutable external state),
 * and freezing it on the domain would silently invalidate every historical
 * record the moment application.yml changes. The backend now derives the
 * value at read time in `PromptSpecApiView` and surfaces it as the
 * `costUsd` field on the API JSON projection (see
 * `dev.promptlm.web.PromptSpecApiView.ExecutionView`).
 *
 * For forward-compatibility we also accept the cost being carried on
 * `response.usage.cost` (where some LLM-vendor adapters may write it). The
 * old top-level `cost` field is still consulted as a fallback so older
 * persisted execution YAML — written before the refactor — still surfaces
 * its (now stale-by-policy) value rather than disappearing entirely.
 *
 * Returns `null` (not `undefined`) when no cost is available so consumers
 * can treat the absence as a first-class state — the cost chip is hidden
 * rather than rendered as `$0.00`, which would be actively misleading.
 */

export interface RunCostSource {
  costUsd?: number | null;
  cost?: number | null;
  response?: {
    usage?: {
      cost?: number | null;
    } | null;
  } | null;
}

export const selectRunCost = (execution: RunCostSource | null | undefined): number | null => {
  if (!execution) return null;
  const direct = numberOrNull(execution.costUsd);
  if (direct !== null) return direct;
  const legacy = numberOrNull(execution.cost);
  if (legacy !== null) return legacy;
  const fromUsage = numberOrNull(execution.response?.usage?.cost ?? null);
  return fromUsage;
};

const numberOrNull = (value: number | null | undefined): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
};
