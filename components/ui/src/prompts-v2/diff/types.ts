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
 * Minimal shape consumed by the diff blocks. The diff view is rendered from
 * the parsed PromptSpec — additional fields beyond these are passed through
 * untouched and shown verbatim in the field-level diff.
 */
export interface DiffPromptSpec {
  name: string;
  group: string;
  version: string;
  revision: number;
  request: {
    vendor: string;
    model: string;
    parameters?: Record<string, unknown>;
  };
  placeholders?: readonly string[];
  messages?: ReadonlyArray<{ role: string; body: string }>;
  rules?: readonly string[];
  [key: string]: unknown;
}

export interface DiffRevision {
  version: string;
  author: string;
  when: string;
  sha: string;
  spec: DiffPromptSpec;
}

export interface DiffPromptCorpusEntry {
  group: string;
  revisions: Record<string, DiffRevision>;
}

export type DiffCorpus = Record<string, DiffPromptCorpusEntry>;

export interface DiffSelection {
  promptA: string;
  revA: string;
  promptB: string;
  revB: string;
}

export type DiffKind = 'add' | 'del' | 'edit' | 'same';
