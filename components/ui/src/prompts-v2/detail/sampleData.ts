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
//
// Lifted from design/handoff/webui/src/prompt-detail.jsx — Storybook only.

import type {
  PromptDetailExecution,
  PromptDetailMessage,
  PromptDetailMetrics,
  PromptDetailPlaceholder,
  PromptDetailRequest,
  PromptRevision,
} from './types';

export const SAMPLE_REQUEST: PromptDetailRequest = {
  vendor: 'openai',
  model: 'gpt-4.1',
  parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 },
};

export const SAMPLE_PLACEHOLDERS: PromptDetailPlaceholder[] = [
  { name: 'user_message', type: 'string', required: true, example: 'What is the refund window?' },
  { name: 'context_chunks', type: 'list<chunk>', required: true, example: '6 retrieved chunks' },
  { name: 'policy', type: 'string', required: false, example: 'company-style.md' },
  { name: 'agent_name', type: 'string', required: false, example: 'Helpie' },
  { name: 'lang', type: 'string', required: false, example: 'en' },
  { name: 'now', type: 'datetime', required: false, example: '2025-01-14T09:11Z' },
];

export const SAMPLE_MESSAGES: PromptDetailMessage[] = [
  {
    role: 'system',
    body: 'You are {{agent_name}}, a careful assistant that answers from the provided context only.',
  },
  {
    role: 'system',
    body: '## Rules\n- Cite every claim with [doc-id:section].\n- Use up to 8 retrieved chunks.\n- When chunks contradict, prefer the most recent doc.\n- When the question is ambiguous, ask for clarification rather than guess.\n- Refuse if context is insufficient.',
  },
  {
    role: 'user',
    body: '{{#each context_chunks}}\n[{{this.id}}:{{this.section}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}',
  },
  {
    role: 'assistant',
    body: 'Use the citation format above. If you cannot answer, say so plainly.',
  },
];

export const SAMPLE_METRICS: PromptDetailMetrics = {
  runs: 247,
  lastRun: '3 min ago',
  latencyP50Ms: 1820,
  latencyP95Ms: 4310,
  tokensInAvg: 4120,
  tokensOutAvg: 312,
  tokensInTotal: 1018640,
  tokensOutTotal: 77064,
  successRate: 0.987,
  lastRunSha: '3f7c2e1',
  lastRunContext: 'CI',
};

export const SAMPLE_HISTORY: PromptRevision[] = [
  { rev: 'r34', tag: 'v1.8.0', when: '3 min ago', author: 'j.santos', sha: '3f7c2e1', kind: 'edit', msg: 'expand to 8 chunks, add ambiguity rule', runs: 12, p50: 1820, p95: 4310, tin: 4120, tout: 312, ok: 12 },
  { rev: 'r33', tag: 'v1.7.4', when: '6 days ago', author: 'j.santos', sha: '7e2ff', kind: 'edit', msg: 'add citation format rule', runs: 38, p50: 1640, p95: 3920, tin: 3120, tout: 298, ok: 37 },
  { rev: 'r32', tag: 'v1.7.3', when: '2w ago', author: 'j.santos', sha: '24bd1', kind: 'edit', msg: 'tighten refusal language', runs: 41, p50: 1620, p95: 3870, tin: 3104, tout: 264, ok: 41 },
  { rev: 'r31', tag: 'v1.7.2', when: '3w ago', author: 'l.kim', sha: 'd99fa', kind: 'edit', msg: 'add language placeholder', runs: 56, p50: 1690, p95: 3990, tin: 3098, tout: 271, ok: 55 },
  { rev: 'r30', tag: 'v1.7.0', when: '1mo ago', author: 'j.santos', sha: '4ac21', kind: 'edit', msg: 'switch to gpt-4.1, raise max_tokens', runs: 64, p50: 1710, p95: 4040, tin: 3080, tout: 284, ok: 63 },
  { rev: 'r25', tag: 'v1.6.0', when: '2mo ago', author: 'm.holm', sha: '0c731', kind: 'edit', msg: 'reword system message · add agent_name', runs: 22, p50: 2210, p95: 5200, tin: 3040, tout: 305, ok: 22 },
  { rev: 'r1', tag: 'v1.0.0', when: '8mo ago', author: 'j.santos', sha: '1a8e0', kind: 'add', msg: 'initial · grounded RAG answer', runs: 14, p50: 2480, p95: 6100, tin: 2860, tout: 344, ok: 13 },
];

export const SAMPLE_EXECUTIONS: PromptDetailExecution[] = [
  { id: 'exec_4f9c', when: '3 min ago', rev: 'r34', author: 'j.santos', context: 'CI · pre-merge', ms: 1740, tin: 4120, tout: 287, ok: true, fixture: 'fx/refund-window.json' },
  { id: 'exec_4f9b', when: '4 min ago', rev: 'r34', author: 'j.santos', context: 'CI · pre-merge', ms: 1980, tin: 4220, tout: 312, ok: true, fixture: 'fx/contradicting-docs.json' },
  { id: 'exec_4f9a', when: '4 min ago', rev: 'r34', author: 'j.santos', context: 'CI · pre-merge', ms: 2100, tin: 4380, tout: 348, ok: true, fixture: 'fx/ambiguous-question.json' },
  { id: 'exec_4f8c', when: '12 min ago', rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 1620, tin: 3980, tout: 264, ok: true, fixture: 'fx/refund-window.json' },
  { id: 'exec_4f87', when: '14 min ago', rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 1840, tin: 4020, tout: 281, ok: true, fixture: 'fx/no-context.json' },
  { id: 'exec_4f81', when: '32 min ago', rev: 'r34', author: 'j.santos', context: 'local · promptlm run', ms: 4310, tin: 4180, tout: 401, ok: true, fixture: 'fx/long-doc.json' },
  { id: 'exec_4f72', when: '5 hr ago', rev: 'r33', author: 's.weber', context: 'CI · main', ms: 1610, tin: 3120, tout: 290, ok: true, fixture: 'fx/refund-window.json' },
  { id: 'exec_4f58', when: '14 hr ago', rev: 'r33', author: 'l.kim', context: 'local · promptlm run', ms: 5240, tin: 3320, tout: 412, ok: false, fixture: 'fx/edge-case-empty.json', error: 'context is insufficient' },
];
