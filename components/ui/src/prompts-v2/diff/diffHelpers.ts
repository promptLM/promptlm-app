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

import type { DiffKind } from './types';

export interface ArrayDiffEntry<T> {
  kind: DiffKind;
  l: T | undefined;
  r: T | undefined;
}

/**
 * Index-aligned array diff (NOT a longest-common-subsequence). Designed for
 * the spec view where order is meaningful (rules at index 1 vs 1, etc.). For
 * unordered sets, sort both inputs upstream.
 */
export const diffArray = <T,>(
  left: readonly T[] = [],
  right: readonly T[] = [],
): ArrayDiffEntry<T>[] => {
  const out: ArrayDiffEntry<T>[] = [];
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    const l = left[i];
    const r = right[i];
    if (l === undefined) {
      out.push({ kind: 'add', l: undefined, r });
    } else if (r === undefined) {
      out.push({ kind: 'del', l, r: undefined });
    } else if (typeof l === 'object' && typeof r === 'object' && l !== null && r !== null) {
      const lj = JSON.stringify(l);
      const rj = JSON.stringify(r);
      out.push({ kind: lj === rj ? 'same' : 'edit', l, r });
    } else {
      out.push({ kind: l === r ? 'same' : 'edit', l, r });
    }
  }
  return out;
};

export interface ObjectDiffEntry {
  k: string;
  kind: DiffKind;
  l: unknown;
  r: unknown;
}

/** Key-by-key object diff. Missing keys on either side are add/del. */
export const diffObject = (
  left: Record<string, unknown> = {},
  right: Record<string, unknown> = {},
): ObjectDiffEntry[] => {
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
  return keys.map((k) => {
    const l = left[k];
    const r = right[k];
    if (l === undefined) return { k, kind: 'add', l, r };
    if (r === undefined) return { k, kind: 'del', l, r };
    return { k, kind: l === r ? 'same' : 'edit', l, r };
  });
};

/** Format a value for display in a diff cell — JSON-stringifies objects. */
export const formatDiffValue = (value: unknown): string => {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};
