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
  it('reads top-level cost when present', () => {
    expect(selectRunCost({ cost: 0.00214 })).toBe(0.00214);
  });

  it('falls back to response.usage.cost when top-level is absent', () => {
    expect(
      selectRunCost({ response: { usage: { cost: 0.0042 } } }),
    ).toBe(0.0042);
  });

  it('prefers top-level over response.usage.cost', () => {
    expect(
      selectRunCost({ cost: 1.0, response: { usage: { cost: 2.0 } } }),
    ).toBe(1.0);
  });

  it('returns null for missing input', () => {
    expect(selectRunCost(null)).toBeNull();
    expect(selectRunCost(undefined)).toBeNull();
    expect(selectRunCost({})).toBeNull();
  });

  it('returns null for null/undefined/NaN cost', () => {
    expect(selectRunCost({ cost: null })).toBeNull();
    expect(selectRunCost({ cost: undefined })).toBeNull();
    expect(selectRunCost({ cost: NaN })).toBeNull();
  });

  it('rejects negative costs (defensive)', () => {
    expect(selectRunCost({ cost: -0.5 })).toBeNull();
  });

  it('accepts zero as a valid cost (could indicate a free-tier model)', () => {
    expect(selectRunCost({ cost: 0 })).toBe(0);
  });
});
