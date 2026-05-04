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
// Lifted from design/handoff/report/src/report.jsx — Storybook only.

import type {
  ActivityCell,
  AuthorRow,
  CommitMeta,
  GroupCatalogBlock,
  ModelMatrixRow,
  PlaceholderIndexRow,
  TimelineEntry,
} from './types';

export const SAMPLE_LATEST_COMMIT: CommitMeta = {
  sha: '3f7c2e1',
  message: 'doc-rag-answer: expand to 8 chunks, add ambiguity rule',
  author: 'j.santos',
  date: '2025-01-14 09:11 UTC',
  when: '3 min ago',
  pr: '#284',
  ci: 'green',
};

export const SAMPLE_TIMELINE: TimelineEntry[] = [
  {
    sha: '3f7c2e1',
    when: '3 min ago',
    date: 'Tue Jan 14 09:11',
    author: 'j.santos',
    kind: 'edit',
    prompt: 'doc-rag-answer',
    rev: 'r33→r34',
    msg: 'expand to 8 chunks, add ambiguity rule',
    pr: '#284',
    focus: true,
    changes: [
      { f: 'rules.length', d: '4 → 8', tone: 'edit' },
      { f: 'rules[+]', d: 'contradiction · ambiguity', tone: 'add' },
    ],
  },
  {
    sha: 'cc911',
    when: '14 hr ago',
    date: 'Mon Jan 13 19:02',
    author: 'l.kim',
    kind: 'edit',
    prompt: 'extract-line-items',
    rev: 'r12→r13',
    msg: 'add tax-line handling',
    pr: '#283',
    changes: [
      { f: 'placeholders[+]', d: 'tax_lines', tone: 'add' },
      { f: 'rules[+]', d: 'tax handling', tone: 'add' },
    ],
  },
  {
    sha: 'cc910',
    when: '20 hr ago',
    date: 'Mon Jan 13 13:14',
    author: 'l.kim',
    kind: 'add',
    prompt: 'meeting-notes-cleanup',
    rev: 'r1',
    msg: 'initial · drop verbatim filler, normalise speakers',
    pr: '#282',
    changes: [
      { f: 'group', d: 'agents', tone: 'meta' },
      { f: 'model', d: 'claude-haiku-4-5', tone: 'meta' },
      { f: 'placeholders', d: '1', tone: 'meta' },
      { f: 'messages', d: '2', tone: 'meta' },
    ],
  },
  {
    sha: 'b41d3',
    when: '2 days',
    date: 'Sun Jan 12 11:08',
    author: 'm.holm',
    kind: 'edit',
    prompt: 'support-triage-classifier',
    rev: 'r23→r24',
    msg: 'reorder priority enum',
    pr: '#281',
    changes: [{ f: 'placeholders.priority.enum', d: 'reordered', tone: 'edit' }],
  },
  {
    sha: '0aa18',
    when: '4 days',
    date: 'Fri Jan 10 09:21',
    author: 'j.santos',
    kind: 'edit',
    prompt: 'mcp-tool-router',
    rev: 'r17',
    msg: 'fix typo in system message',
    pr: '#279',
    changes: [{ f: 'messages[0].content', d: '~', tone: 'edit' }],
  },
  {
    sha: '0aa17',
    when: '4 days',
    date: 'Fri Jan 10 08:55',
    author: 'j.santos',
    kind: 'edit',
    prompt: 'mcp-tool-router',
    rev: 'r16→r17',
    msg: 'switch model to haiku, add explicit refusal',
    pr: '#278',
    changes: [
      { f: 'request.model', d: 'sonnet-4-5 → haiku-4-5', tone: 'edit' },
      { f: 'rules[+]', d: 'refusal', tone: 'add' },
    ],
  },
  {
    sha: '7e2ff',
    when: '6 days',
    date: 'Wed Jan 8 10:44',
    author: 'j.santos',
    kind: 'edit',
    prompt: 'doc-rag-answer',
    rev: 'r32→r33',
    msg: 'add citation format rule',
    pr: '#276',
    changes: [{ f: 'rules[+]', d: 'citation format', tone: 'add' }],
  },
];

export const SAMPLE_AUTHORS: AuthorRow[] = [
  { name: 'j.santos', email: 'jess@acme.com', commits: 38, prompts: 4, since: '8 mo ago', last: '3 min ago' },
  { name: 'l.kim', email: 'l.kim@acme.com', commits: 27, prompts: 5, since: '6 mo ago', last: '14 hr ago' },
  { name: 'm.holm', email: 'mh@acme.com', commits: 19, prompts: 3, since: '5 mo ago', last: '2 days ago' },
  { name: 'a.nguyen', email: 'andy@acme.com', commits: 11, prompts: 2, since: '4 mo ago', last: '5 days ago' },
  { name: 's.weber', email: 'sw@acme.com', commits: 6, prompts: 1, since: '3 mo ago', last: '3 weeks ago' },
];

export const SAMPLE_GROUPS: GroupCatalogBlock[] = [
  {
    name: 'agents',
    count: 4,
    items: [
      { name: 'mcp-tool-router', version: '1.4.2', rev: 'r17', model: 'anthropic/claude-haiku-4-5', msgs: 2, ph: 3, status: 'production', updated: '4d ago' },
      { name: 'pr-summarizer', version: '0.6.0', rev: 'r9', model: 'openai/gpt-4.1-mini', msgs: 3, ph: 2, status: 'production', updated: '5d ago' },
      { name: 'meeting-notes-cleanup', version: '0.1.0', rev: 'r1', model: 'anthropic/claude-haiku-4-5', msgs: 2, ph: 1, status: 'draft', updated: '20h ago' },
      { name: 'changelog-from-commits', version: '1.0.1', rev: 'r3', model: 'anthropic/claude-sonnet-4-5', msgs: 3, ph: 4, status: 'production', updated: '3w ago' },
    ],
  },
  {
    name: 'rag',
    count: 2,
    items: [
      { name: 'doc-rag-answer', version: '1.8.0', rev: 'r34', model: 'openai/gpt-4.1', msgs: 4, ph: 6, status: 'production', updated: '3 min ago' },
      { name: 'doc-rag-rewrite-query', version: '0.4.2', rev: 'r7', model: 'openai/gpt-4.1-mini', msgs: 2, ph: 2, status: 'production', updated: '2w ago' },
    ],
  },
  {
    name: 'support',
    count: 2,
    items: [
      { name: 'support-triage-classifier', version: '2.4.1', rev: 'r24', model: 'anthropic/claude-sonnet-4-5', msgs: 3, ph: 4, status: 'production', updated: '2d ago' },
      { name: 'support-reply-draft', version: '1.2.0', rev: 'r11', model: 'anthropic/claude-sonnet-4-5', msgs: 4, ph: 5, status: 'production', updated: '2w ago' },
    ],
  },
  {
    name: 'extract',
    count: 2,
    items: [
      { name: 'extract-line-items', version: '0.7.3', rev: 'r13', model: 'openai/gpt-4.1', msgs: 2, ph: 3, status: 'production', updated: '14h ago' },
      { name: 'extract-contract-terms', version: '0.5.0', rev: 'r4', model: 'anthropic/claude-sonnet-4-5', msgs: 2, ph: 4, status: 'review', updated: '1w ago' },
    ],
  },
];

export const SAMPLE_MODELS: ModelMatrixRow[] = [
  { vendor: 'anthropic', model: 'claude-sonnet-4-5', count: 5 },
  { vendor: 'anthropic', model: 'claude-haiku-4-5', count: 3 },
  { vendor: 'openai', model: 'gpt-4.1', count: 2 },
  { vendor: 'openai', model: 'gpt-4.1-mini', count: 2 },
];

export const SAMPLE_PLACEHOLDERS: PlaceholderIndexRow[] = [
  { name: 'user_message', used: 6, in: ['mcp-tool-router', 'support-triage-classifier', 'support-reply-draft', '+3'] },
  { name: 'tool_catalog', used: 1, in: ['mcp-tool-router'] },
  { name: 'policy', used: 3, in: ['mcp-tool-router', 'support-reply-draft', 'doc-rag-answer'] },
  { name: 'agent_name', used: 4, in: ['mcp-tool-router', 'pr-summarizer', '+2'] },
  { name: 'context_chunks', used: 2, in: ['doc-rag-answer', 'doc-rag-rewrite-query'] },
  { name: 'ticket', used: 2, in: ['support-triage-classifier', 'support-reply-draft'] },
  { name: 'document', used: 2, in: ['extract-line-items', 'extract-contract-terms'] },
  { name: 'rubric', used: 2, in: ['rubric-judge-helpfulness', 'rubric-judge-faithfulness'] },
  { name: 'commits', used: 2, in: ['pr-summarizer', 'changelog-from-commits'] },
  { name: 'transcript', used: 1, in: ['meeting-notes-cleanup'] },
];

const generateActivityCells = (count: number): ActivityCell[] => {
  const out: ActivityCell[] = [];
  for (let i = 0; i < count; i++) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const r = seed - Math.floor(seed);
    let v: 0 | 1 | 2 | 3 | 4 = 0;
    if (r > 0.55) v = 1;
    if (r > 0.78) v = 2;
    if (r > 0.91) v = 3;
    if (r > 0.97) v = 4;
    if (i % 7 >= 5 && r < 0.85 && v > 0) v = (v - 1) as 0 | 1 | 2 | 3;
    out.push({ value: v });
  }
  out[out.length - 1] = { value: 4 };
  out[out.length - 2] = { value: 3 };
  return out;
};

export const SAMPLE_ACTIVITY = generateActivityCells(13 * 7);
export const SAMPLE_ACTIVITY_TOTAL = SAMPLE_ACTIVITY.reduce((sum, c) => sum + c.value, 0);
export const SAMPLE_ACTIVITY_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan'];
