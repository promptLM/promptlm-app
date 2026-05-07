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
 * Release-gate evaluator for the side rail / Release CTA.
 *
 * Source of truth: design/handoff/playbook/surfaces/release-flow.html §Gate
 * logic. All four gates must pass before the Release button is enabled. When
 * any gate fails, the rail / button surfaces the gate's tooltip text.
 */

import type { PromptFormErrors } from './types';

export type ReleaseGateId =
  | 'form-validates-clean'
  | 'has-test-run-on-current-shape'
  | 'last-run-succeeded'
  | 'placeholder-shape-saved';

export interface ReleaseGateInputs {
  /**
   * Aggregated form errors (`validateDraft(draft, evalEnabled)` result).
   */
  errors: Pick<PromptFormErrors, 'hasErrors' | 'metadataCount' | 'modelCount' | 'placeholdersCount' | 'messagesCount' | 'toolsCount' | 'evalsCount'>;
  /**
   * Live executions for the current request shape. Filtering by shape is the
   * caller's responsibility — gate logic only inspects length and the latest
   * status.
   */
  executions: ReadonlyArray<{ status: 'ok' | 'error' | 'pending' | string }>;
  /**
   * `true` when the placeholder list shape (renames / adds / removes / type
   * changes) has unsaved edits. `value` edits should NOT set this flag — they
   * pass per the Q3 lock.
   */
  placeholderShapeDirty: boolean;
}

export interface ReleaseGateResult {
  id: ReleaseGateId;
  passed: boolean;
  tooltip: string;
}

export interface ReleaseGatesEvaluation {
  gates: ReleaseGateResult[];
  /** All four gates pass — Release button can be enabled. */
  canRelease: boolean;
  /**
   * Tooltip to surface on the Release button when blocked. Picks the first
   * failing gate in canonical order. `null` when all gates pass.
   */
  blockingTooltip: string | null;
  /** First failing gate id (or `null` when all pass). */
  firstBlockingGateId: ReleaseGateId | null;
}

const totalErrorCount = (e: ReleaseGateInputs['errors']): number =>
  e.metadataCount +
  e.modelCount +
  e.placeholdersCount +
  e.messagesCount +
  e.toolsCount +
  e.evalsCount;

export const evaluateReleaseGates = ({
  errors,
  executions,
  placeholderShapeDirty,
}: ReleaseGateInputs): ReleaseGatesEvaluation => {
  const errorCount = totalErrorCount(errors);
  const lastRun = executions[0];

  const gates: ReleaseGateResult[] = [
    {
      id: 'form-validates-clean',
      passed: !errors.hasErrors,
      tooltip:
        errorCount === 1
          ? 'Fix 1 error before releasing'
          : `Fix ${errorCount} errors before releasing`,
    },
    {
      id: 'has-test-run-on-current-shape',
      passed: executions.length > 0,
      tooltip: 'Run at least once in the Test tab before releasing',
    },
    {
      id: 'last-run-succeeded',
      // Pass-through when no runs (the prior gate covers absence). Only fails
      // when there *is* a most-recent run and it was not 'ok'.
      passed: !lastRun || lastRun.status === 'ok',
      tooltip: 'Last test run failed — re-run before releasing',
    },
    {
      id: 'placeholder-shape-saved',
      passed: !placeholderShapeDirty,
      tooltip: 'Save placeholder schema changes first',
    },
  ];

  const firstBlocking = gates.find((g) => !g.passed) ?? null;

  return {
    gates,
    canRelease: !firstBlocking,
    blockingTooltip: firstBlocking ? firstBlocking.tooltip : null,
    firstBlockingGateId: firstBlocking ? firstBlocking.id : null,
  };
};
