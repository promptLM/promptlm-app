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
 * Mock data used by Storybook + the UI shell while PR 2 is pending. Replaced
 * with real `executions[]` filtered by `requestShapeHash` once #96 / #100
 * land. The hashes are placeholders — they're only used by the live strip's
 * Q5 lock to demonstrate the reset banner; PR 2 will derive real hashes.
 */

import type { RepoHistoryItem, TestRunRecord } from './types';

const NOW = Date.parse('2026-05-08T00:00:00Z');

export const SAMPLE_EXECUTIONS: ReadonlyArray<TestRunRecord> = [
  {
    id: 'exec-103',
    shapeHash: 'cafebabe',
    values: { question: 'What is the SLA?', tone: 'concise' },
    status: 'ok',
    revisionLabel: 'r34',
    durationMs: 1820,
    tokensIn: 412,
    tokensOut: 188,
    finishedAt: new Date(NOW - 2 * 60_000).toISOString(),
    assistantText:
      'The SLA is 99.9% monthly availability for production tier; planned maintenance windows are excluded per [c-913].',
    toolCalls: [{ name: 'search_docs', preview: '{"q":"SLA","k":3}' }],
  },
  {
    id: 'exec-102',
    shapeHash: 'cafebabe',
    values: { question: 'How do I rotate keys?', tone: 'neutral' },
    status: 'ok',
    revisionLabel: 'r33',
    durationMs: 2430,
    tokensIn: 401,
    tokensOut: 240,
    finishedAt: new Date(NOW - 6 * 60_000).toISOString(),
    assistantText:
      'Rotate keys via the org admin panel; existing tokens stay valid for the 24-hour grace window [c-744].',
  },
  {
    id: 'exec-101',
    shapeHash: 'cafebabe',
    values: { question: 'badly formed', tone: '' },
    status: 'error',
    revisionLabel: 'r32',
    durationMs: 980,
    tokensIn: 120,
    tokensOut: 0,
    finishedAt: new Date(NOW - 14 * 60_000).toISOString(),
    assistantText: '',
    errorMessage: 'PROMPT_FAILURE: assistant returned an empty response',
  },
];

export const SAMPLE_REPO_HISTORY: ReadonlyArray<RepoHistoryItem> = [
  {
    id: 'h-220',
    revisionLabel: 'r28',
    status: 'ok',
    finishedAt: new Date(NOW - 26 * 60 * 60_000).toISOString(),
    note: 'pre-release run on r28 (1.7.4)',
  },
  {
    id: 'h-219',
    revisionLabel: 'r27',
    status: 'error',
    finishedAt: new Date(NOW - 30 * 60 * 60_000).toISOString(),
    note: 'failed — INFRA_FAILURE',
  },
  {
    id: 'h-218',
    revisionLabel: 'r26',
    status: 'ok',
    finishedAt: new Date(NOW - 50 * 60 * 60_000).toISOString(),
  },
];
