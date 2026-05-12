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

import type { PromptStatus } from '../atoms';

export interface CommitMeta {
  sha: string;
  message: string;
  author: string;
  /** Human-friendly relative timestamp (e.g. "3 min ago"). */
  when: string;
  /** Absolute timestamp for tooltip / disambiguation. */
  date?: string;
  /** PR number (display only — link target lives upstream). */
  pr?: string;
  /** CI status badge displayed alongside the commit metadata. */
  ci?: 'green' | 'yellow' | 'red';
}

export type SpecChangeKind = 'add' | 'edit' | 'del' | 'rename';
export type SpecChipTone = 'add' | 'edit' | 'del' | 'meta';

export interface SpecChipChange {
  /** Field path or short label (e.g. "rules[+]"). */
  f: string;
  /** Description of the change (e.g. "4 → 8"). */
  d: string;
  tone: SpecChipTone;
}

export interface TimelineEntry {
  sha: string;
  when: string;
  date?: string;
  author: string;
  kind: SpecChangeKind;
  prompt: string;
  /** Revision shorthand, e.g. "r33→r34" or "r1" for a new spec. */
  rev: string;
  msg: string;
  changes: readonly SpecChipChange[];
  pr?: string;
  /** Render the entry with the focused (highlighted) treatment. */
  focus?: boolean;
}

export interface AuthorRow {
  name: string;
  email: string;
  commits: number;
  /** Distinct prompts the author has touched. */
  prompts: number;
  /** "since" label, e.g. "8 mo ago". */
  since: string;
  /** "last touched" label, e.g. "3 min ago". */
  last: string;
}

export interface GroupCatalogItem {
  name: string;
  version: string;
  /** Revision shorthand (e.g. "r34"). */
  rev: string;
  model: string;
  msgs: number;
  ph: number;
  status: PromptStatus | 'production' | 'review' | 'draft';
  updated: string;
}

export interface GroupCatalogBlock {
  name: string;
  count: number;
  items: readonly GroupCatalogItem[];
}

export interface ModelMatrixRow {
  vendor: string;
  model: string;
  count: number;
}

export interface PlaceholderIndexRow {
  name: string;
  /** Number of prompts referencing this placeholder. */
  used: number;
  /** Names of the referencing prompts (truncate beyond N with "+M"). */
  in: readonly string[];
}

export interface ActivityCell {
  /** Bucket value 0..4 — 0 is empty, 4 is most active. */
  value: 0 | 1 | 2 | 3 | 4;
}
