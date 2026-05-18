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
 * Issue #182: the backend persists `cost` directly on the Execution model
 * (derived server-side from the configured per-model pricing). For
 * forward-compatibility we also accept the cost being carried on
 * `response.usage.cost` (which is where the LLM-vendor adapters write it).
 *
 * Returns `null` (not `undefined`) when no cost is available so consumers can
 * treat the absence as a first-class state — the cost chip is hidden rather
 * than rendered as `$0.00`, which would be actively misleading.
 */

export interface RunCostSource {
  cost?: number | null;
  response?: {
    usage?: {
      cost?: number | null;
    } | null;
  } | null;
}

export const selectRunCost = (execution: RunCostSource | null | undefined): number | null => {
  if (!execution) return null;
  const direct = numberOrNull(execution.cost);
  if (direct !== null) return direct;
  const fromUsage = numberOrNull(execution.response?.usage?.cost ?? null);
  return fromUsage;
};

const numberOrNull = (value: number | null | undefined): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
};
