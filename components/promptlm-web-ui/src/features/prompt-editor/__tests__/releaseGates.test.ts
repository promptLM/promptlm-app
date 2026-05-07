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

import { describe, it, expect } from 'vitest';
import { evaluateReleaseGates } from '@promptlm/ui';

const okErrors = {
  hasErrors: false,
  metadataCount: 0,
  modelCount: 0,
  placeholdersCount: 0,
  messagesCount: 0,
  toolsCount: 0,
  evalsCount: 0,
};

describe('evaluateReleaseGates', () => {
  it('passes all four gates → canRelease true, no tooltip', () => {
    const r = evaluateReleaseGates({
      errors: okErrors,
      executions: [{ status: 'ok' }],
      placeholderShapeDirty: false,
    });
    expect(r.canRelease).toBe(true);
    expect(r.blockingTooltip).toBeNull();
    expect(r.firstBlockingGateId).toBeNull();
    expect(r.gates.every((g) => g.passed)).toBe(true);
  });

  it('blocks on form errors with a count-aware tooltip', () => {
    const r = evaluateReleaseGates({
      errors: { ...okErrors, hasErrors: true, metadataCount: 1, modelCount: 1 },
      executions: [{ status: 'ok' }],
      placeholderShapeDirty: false,
    });
    expect(r.canRelease).toBe(false);
    expect(r.firstBlockingGateId).toBe('form-validates-clean');
    expect(r.blockingTooltip).toBe('Fix 2 errors before releasing');
  });

  it('singular tooltip when exactly one error', () => {
    const r = evaluateReleaseGates({
      errors: { ...okErrors, hasErrors: true, metadataCount: 1 },
      executions: [{ status: 'ok' }],
      placeholderShapeDirty: false,
    });
    expect(r.blockingTooltip).toBe('Fix 1 error before releasing');
  });

  it('blocks when no executions on current shape', () => {
    const r = evaluateReleaseGates({
      errors: okErrors,
      executions: [],
      placeholderShapeDirty: false,
    });
    expect(r.canRelease).toBe(false);
    expect(r.firstBlockingGateId).toBe('has-test-run-on-current-shape');
    expect(r.blockingTooltip).toBe('Run at least once in the Test tab before releasing');
  });

  it('blocks when latest execution is not ok', () => {
    const r = evaluateReleaseGates({
      errors: okErrors,
      executions: [{ status: 'error' }, { status: 'ok' }],
      placeholderShapeDirty: false,
    });
    expect(r.canRelease).toBe(false);
    expect(r.firstBlockingGateId).toBe('last-run-succeeded');
    expect(r.blockingTooltip).toBe('Last test run failed — re-run before releasing');
  });

  it('blocks when placeholder shape is dirty', () => {
    const r = evaluateReleaseGates({
      errors: okErrors,
      executions: [{ status: 'ok' }],
      placeholderShapeDirty: true,
    });
    expect(r.canRelease).toBe(false);
    expect(r.firstBlockingGateId).toBe('placeholder-shape-saved');
    expect(r.blockingTooltip).toBe('Save placeholder schema changes first');
  });

  it('reports gates in canonical order (form → run → ok → ph-shape)', () => {
    const r = evaluateReleaseGates({
      errors: okErrors,
      executions: [{ status: 'ok' }],
      placeholderShapeDirty: false,
    });
    expect(r.gates.map((g) => g.id)).toEqual([
      'form-validates-clean',
      'has-test-run-on-current-shape',
      'last-run-succeeded',
      'placeholder-shape-saved',
    ]);
  });
});
