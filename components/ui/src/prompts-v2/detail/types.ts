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

import type { PromptStatus, VendorId } from '../atoms';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface PromptDetailMessage {
  role: MessageRole;
  body: string;
}

export interface PromptDetailPlaceholder {
  name: string;
  type: string;
  required: boolean;
  /** A short example value rendered in the placeholder table. */
  example?: string;
  description?: string;
  /** Optional default value used by the editor (rendered when no example present). */
  defaultValue?: string;
}

export interface PromptDetailRequest {
  vendor: VendorId;
  model: string;
  parameters?: Readonly<Record<string, string | number | boolean | null>>;
  /** Snapshot id for cache-bustable model versions (e.g. claude-haiku-4-5-20251022). */
  modelSnapshot?: string;
  /** Provider URL — informational, useful for debugging. */
  url?: string;
  /** Request type — defaults to "chat" when omitted. */
  type?: string;
}

export interface PromptDetailMetrics {
  runs: number;
  lastRun: string;
  latencyP50Ms: number;
  latencyP95Ms: number;
  tokensInAvg: number;
  tokensOutAvg: number;
  tokensInTotal?: number;
  tokensOutTotal?: number;
  successRate?: number;
  /** Optional commit/sha context to display on the "last run" cell. */
  lastRunSha?: string;
  /** Optional context label (e.g. "CI", "local"). */
  lastRunContext?: string;
}

export interface PromptRevision {
  rev: string;
  tag?: string;
  sha: string;
  author: string;
  when: string;
  msg: string;
  kind: 'add' | 'edit' | 'remove' | 'rename';
  runs?: number;
  ok?: number;
  p50?: number;
  p95?: number;
  tin?: number;
  tout?: number;
}

export interface PromptDetailExecution {
  id: string;
  when: string;
  rev: string;
  author: string;
  context: string;
  fixture: string;
  ms: number;
  tin: number;
  tout: number;
  ok: boolean;
  error?: string;
  /** Assistant response text captured during the run. */
  response?: string;
  /** User message / primary input used for the run (extracted from placeholders). */
  input?: string;
}
