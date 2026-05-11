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
// Lifted from design/handoff/webui/src/prompt-diff.jsx — Storybook only.

import type { DiffCorpus } from './types';

export const SAMPLE_DIFF_CORPUS: DiffCorpus = {
  'doc-rag-answer': {
    group: 'rag',
    revisions: {
      r34: {
        version: '1.8.0',
        author: 'j.santos',
        when: '3 min ago',
        sha: '3f7c2e1',
        spec: {
          name: 'doc-rag-answer',
          group: 'rag',
          version: '1.8.0',
          revision: 34,
          request: {
            vendor: 'openai',
            model: 'gpt-4.1',
            parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 },
          },
          placeholders: ['user_message', 'context_chunks', 'policy', 'agent_name', 'lang', 'now'],
          messages: [
            {
              role: 'system',
              body: 'You are {{agent_name}}, a careful assistant that answers from the provided context only.',
            },
            {
              role: 'system',
              body:
                '## Rules\n- Cite every claim with [doc-id:section].\n- Use up to 8 retrieved chunks.\n- When chunks contradict, prefer the most recent doc.\n- When the question is ambiguous, ask for clarification rather than guess.\n- Refuse if context is insufficient.',
            },
            {
              role: 'user',
              body:
                '{{#each context_chunks}}\n[{{this.id}}:{{this.section}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}',
            },
            {
              role: 'assistant',
              body: 'Use the citation format above. If you cannot answer, say so plainly.',
            },
          ],
          rules: [
            'Cite every claim with [doc-id:section].',
            'Use up to 8 retrieved chunks.',
            'When chunks contradict, prefer the most recent doc.',
            'When the question is ambiguous, ask for clarification rather than guess.',
            'Refuse if context is insufficient.',
          ],
        },
      },
      r33: {
        version: '1.7.4',
        author: 'j.santos',
        when: '6 days ago',
        sha: '7e2ff',
        spec: {
          name: 'doc-rag-answer',
          group: 'rag',
          version: '1.7.4',
          revision: 33,
          request: {
            vendor: 'openai',
            model: 'gpt-4.1',
            parameters: { temperature: 0.2, top_p: 1, max_tokens: 1024 },
          },
          placeholders: ['user_message', 'context_chunks', 'policy', 'agent_name', 'lang', 'now'],
          messages: [
            {
              role: 'system',
              body: 'You are {{agent_name}}, a careful assistant that answers from the provided context only.',
            },
            {
              role: 'system',
              body:
                '## Rules\n- Cite every claim with [doc-id:section].\n- Use up to 4 retrieved chunks.\n- Refuse if context is insufficient.',
            },
            {
              role: 'user',
              body:
                '{{#each context_chunks}}\n[{{this.id}}:{{this.section}}]\n{{this.text}}\n{{/each}}\n\nQuestion: {{user_message}}',
            },
            {
              role: 'assistant',
              body: 'Use the citation format above. If you cannot answer, say so plainly.',
            },
          ],
          rules: [
            'Cite every claim with [doc-id:section].',
            'Use up to 4 retrieved chunks.',
            'Refuse if context is insufficient.',
          ],
        },
      },
    },
  },
  'mcp-tool-router': {
    group: 'agents',
    revisions: {
      r17: {
        version: '1.4.2',
        author: 'j.santos',
        when: '4 days ago',
        sha: '0aa18',
        spec: {
          name: 'mcp-tool-router',
          group: 'agents',
          version: '1.4.2',
          revision: 17,
          request: {
            vendor: 'anthropic',
            model: 'claude-haiku-4-5',
            parameters: { temperature: 0.1, max_tokens: 800 },
          },
          placeholders: ['user_message', 'tool_catalog', 'policy'],
          messages: [
            { role: 'system', body: 'You route a user request to one of the tools in the catalog.' },
            {
              role: 'user',
              body: 'Catalog:\n{{tool_catalog}}\n\nPolicy:\n{{policy}}\n\nUser: {{user_message}}',
            },
          ],
          rules: [
            'Pick exactly one tool from the catalog.',
            'Refuse if no tool fits.',
            'Return JSON: {tool, args, why}.',
          ],
        },
      },
      r16: {
        version: '1.3.0',
        author: 'j.santos',
        when: '1w ago',
        sha: 'aa11d',
        spec: {
          name: 'mcp-tool-router',
          group: 'agents',
          version: '1.3.0',
          revision: 16,
          request: {
            vendor: 'anthropic',
            model: 'claude-sonnet-4-5',
            parameters: { temperature: 0.1, max_tokens: 800 },
          },
          placeholders: ['user_message', 'tool_catalog'],
          messages: [
            { role: 'system', body: 'Pick a tool from the catalog.' },
            {
              role: 'user',
              body: 'Catalog:\n{{tool_catalog}}\n\nUser: {{user_message}}',
            },
          ],
          rules: ['Pick a tool.', 'Return JSON.'],
        },
      },
    },
  },
};

export const SAMPLE_DIFF_SELECTION = {
  promptA: 'doc-rag-answer',
  revA: 'r33',
  promptB: 'doc-rag-answer',
  revB: 'r34',
};
