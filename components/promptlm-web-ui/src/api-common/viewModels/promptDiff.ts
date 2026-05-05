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
 * Stub view-model for the prompt diff page (Stage 1 of issue #78, tracked as
 * issue #91). Until the backend revision history endpoint lands (#76), the
 * diff route only sees a single revision per prompt — the current HEAD spec.
 *
 * This mapper converts the catalog of `PromptSpec`s into the `DiffCorpus`
 * shape the v2 diff blocks consume. Once #76 ships, replace the synthetic
 * single-revision corpus with one keyed off real revisions; the public type
 * (`DiffCorpus`) does not change.
 */

import type { PromptSpec } from '@promptlm/api-client';
import type { DiffCorpus, DiffPromptSpec, DiffRevision } from '@promptlm/ui';

const toDiffPromptSpec = (spec: PromptSpec): DiffPromptSpec => {
  const request = spec.request ?? { vendor: 'unknown', model: 'unknown' };
  const vendor = request.vendor ?? 'unknown';
  const model = request.model ?? 'unknown';
  const parameters = (request as { parameters?: Record<string, unknown> }).parameters ?? {};
  const messages =
    (request as { messages?: Array<{ role?: string; content?: string }> }).messages?.map((m) => ({
      role: m.role ?? 'user',
      body: m.content ?? '',
    })) ?? [];
  const placeholders = (spec.placeholders?.list ?? []).map((p) => p.name ?? '').filter(Boolean);
  return {
    name: spec.name ?? 'unknown',
    group: spec.group ?? 'default',
    version: spec.version ?? '0.0.0',
    revision: spec.revision ?? 0,
    request: { vendor, model, parameters },
    placeholders,
    messages,
  };
};

const toHeadRevision = (spec: PromptSpec): DiffRevision => ({
  version: spec.version ?? '0.0.0',
  author: '—',
  when: spec.updatedAt ?? spec.createdAt ?? new Date().toISOString(),
  sha: 'HEAD',
  spec: toDiffPromptSpec(spec),
});

/**
 * Build a single-revision corpus from a list of prompts. Each prompt
 * contributes one entry keyed by its name with one revision keyed `HEAD`.
 * Cross-prompt comparison is allowed; cross-revision is not (only HEAD
 * exists for now) — when both sides target the same prompt the diff is
 * identity (no diffs), which is the documented Stage 1 acceptance.
 */
export const buildStubDiffCorpus = (prompts: readonly PromptSpec[]): DiffCorpus => {
  const corpus: DiffCorpus = {};
  for (const spec of prompts) {
    const name = spec.name;
    if (!name) continue;
    corpus[name] = {
      group: spec.group ?? 'default',
      revisions: { HEAD: toHeadRevision(spec) },
    };
  }
  return corpus;
};

export const STUB_REVISION_KEY = 'HEAD';
