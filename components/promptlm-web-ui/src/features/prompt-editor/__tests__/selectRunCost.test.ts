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

import { describe, expect, it } from 'vitest';
import { selectRunCost } from '../selectRunCost';

describe('selectRunCost', () => {
  it('reads top-level costUsd when present', () => {
    // Current backend contract: PromptSpecApiView attaches costUsd at the
    // API boundary; nothing persists on the domain.
    expect(selectRunCost({ costUsd: 0.00214 })).toBe(0.00214);
  });

  it('falls back to legacy top-level cost for older persisted executions', () => {
    // Pre-refactor execution YAML may still carry a `cost` field on disk.
    // Honour it so existing repos do not lose chip rendering — even though
    // the value is stale-by-policy and will be replaced on the next read
    // that the new server projects costUsd onto.
    expect(selectRunCost({ cost: 0.00342 })).toBe(0.00342);
  });

  it('falls back to response.usage.cost when neither top-level is present', () => {
    expect(
      selectRunCost({ response: { usage: { cost: 0.0042 } } }),
    ).toBe(0.0042);
  });

  it('prefers costUsd over legacy cost', () => {
    expect(
      selectRunCost({ costUsd: 1.0, cost: 2.0, response: { usage: { cost: 3.0 } } }),
    ).toBe(1.0);
  });

  it('prefers legacy cost over response.usage.cost', () => {
    expect(
      selectRunCost({ cost: 1.0, response: { usage: { cost: 2.0 } } }),
    ).toBe(1.0);
  });

  it('returns null for missing input', () => {
    expect(selectRunCost(null)).toBeNull();
    expect(selectRunCost(undefined)).toBeNull();
    expect(selectRunCost({})).toBeNull();
  });

  it('returns null when costUsd is null/undefined/NaN', () => {
    expect(selectRunCost({ costUsd: null })).toBeNull();
    expect(selectRunCost({ costUsd: undefined })).toBeNull();
    expect(selectRunCost({ costUsd: NaN })).toBeNull();
  });

  it('rejects negative costs (defensive)', () => {
    expect(selectRunCost({ costUsd: -0.5 })).toBeNull();
    expect(selectRunCost({ cost: -0.5 })).toBeNull();
  });

  it('accepts zero as a valid cost (could indicate a free-tier model)', () => {
    expect(selectRunCost({ costUsd: 0 })).toBe(0);
  });
});
