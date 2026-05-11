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

export type TestRunStatus = 'ok' | 'error' | 'pending';

export interface TestRunToolCall {
  name: string;
  preview: string;
}

export interface TestRunRecord {
  id: string;
  /** Hash of the request shape this run was issued against (Q5 lock). */
  shapeHash: string;
  /** Snapshot of placeholder values used at run time. */
  values: Readonly<Record<string, string>>;
  status: TestRunStatus;
  /** Human revision label, e.g. "r34". Used in the history strip. */
  revisionLabel: string;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  /** ISO timestamp when the run finished. */
  finishedAt: string;
  /** Assistant text response (or empty when status === 'error'). */
  assistantText: string;
  /** Error message body when status === 'error'. */
  errorMessage?: string;
  toolCalls?: TestRunToolCall[];
}

export interface RepoHistoryItem {
  id: string;
  revisionLabel: string;
  status: TestRunStatus;
  finishedAt: string;
  /** Optional commit / change note for the row. */
  note?: string;
}
