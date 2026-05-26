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

import { describe, expect, it } from 'vitest';

import type { PromptDraftInput } from '@/api/promptPayloads';
import { buildEditorRunRequest } from '../buildEditorRunRequest';

const baseDraft = (): PromptDraftInput => ({
  id: 'support/prompt-a',
  name: 'prompt-a',
  group: 'support',
  description: 'stored desc',
  authors: [],
  version: '1.0.0',
  revision: 3,
  repositoryUrl: 'https://example.test/repo.git',
  request: {
    type: 'chat/completion',
    vendor: 'openai',
    model: 'gpt-4o',
    url: '',
    modelSnapshot: '',
    parameters: {
      temperature: 0.2,
      topP: 1,
      maxTokens: 1024,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stream: false,
    },
    messages: [
      { id: 'sys', role: 'system', content: 'You are helpful.' },
      { id: 'usr', role: 'user', content: 'Stored body content' },
    ],
  },
  placeholders: {
    startPattern: '{{',
    endPattern: '}}',
    list: [],
    defaults: {},
  },
  evaluations: [],
  extensions: undefined,
});

describe('buildEditorRunRequest (issue #183)', () => {
  it('puts the unsaved draft body into the request payload, not the stored content', () => {
    // Simulate the user typing a new user message into the editor — the
    // form-state draft now diverges from whatever is on disk. Run must carry
    // *this* content.
    const draft: PromptDraftInput = baseDraft();
    draft.request.messages = [
      { id: 'sys', role: 'system', content: 'You are helpful.' },
      { id: 'usr', role: 'user', content: 'Unsaved edit — this must reach the server' },
    ];

    const payload = buildEditorRunRequest({
      draft,
      evaluationEnabled: false,
      repositoryUrl: 'https://example.test/repo.git',
      isDirty: true,
    });

    expect(payload.promptSpec).toBeDefined();
    const spec = payload.promptSpec;
    // The draft's request body is what the backend will execute. The
    // serialiser upper-cases roles to match the backend enum.
    expect(spec?.request?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'USER',
          content: 'Unsaved edit — this must reach the server',
        }),
      ]),
    );
    // The id from the stored prompt is preserved so the backend's id-match
    // check passes and the execution is recorded under the right prompt.
    expect(spec?.id).toBe('support/prompt-a');
    expect(spec?.group).toBe('support');
    expect(spec?.name).toBe('prompt-a');
  });

  it('reflects placeholder edits from the form state', () => {
    const draft: PromptDraftInput = baseDraft();
    draft.placeholders = {
      startPattern: '{{',
      endPattern: '}}',
      list: [{ name: 'user_message', value: 'edited default' }],
      defaults: { user_message: 'edited default' },
    };

    const payload = buildEditorRunRequest({
      draft,
      evaluationEnabled: false,
      repositoryUrl: 'https://example.test/repo.git',
      isDirty: true,
    });

    const placeholders = payload.promptSpec?.placeholders;
    expect(placeholders).toBeDefined();
    // The placeholder list carries the edited default — this is what the
    // backend uses to substitute into the prompt template. The serialiser
    // maps the draft's `value` to the API's `defaultValue` field.
    expect(placeholders).toEqual(
      expect.objectContaining({
        list: expect.arrayContaining([
          expect.objectContaining({ name: 'user_message', defaultValue: 'edited default' }),
        ]),
      }),
    );
  });

  it('survives a draft that has not yet been saved (no id)', () => {
    // Edge case: an editor session opened from a template might not have an
    // id yet. `buildEditorRunRequest` should still produce a usable payload;
    // the path-id check on the controller handles authority.
    const draft: PromptDraftInput = baseDraft();
    draft.id = undefined;

    const payload = buildEditorRunRequest({
      draft,
      evaluationEnabled: false,
      repositoryUrl: 'https://example.test/repo.git',
    });

    expect(payload.promptSpec).toBeDefined();
    expect(payload.promptSpec?.id).toBeUndefined();
  });
});

describe('buildEditorRunRequest — draft flag (issue #140)', () => {
  // The draft flag is the backend's authoritative discriminator between a
  // clean Run (records a MANUAL Execution) and a draft Run (ephemeral).
  // See PromptSpecController#executeStoredPrompt and
  // ExecutePromptRequest.java. Earlier code inferred this from semantic-hash
  // divergence, which silently dropped MANUAL Executions and blocked
  // HappyPathUserJourneyTest#runPromptPersistsManualExecution on every PR.

  it('sets draft=false when isDirty is false (clean Run → backend records history)', () => {
    const payload = buildEditorRunRequest({
      draft: baseDraft(),
      evaluationEnabled: false,
      repositoryUrl: 'https://example.test/repo.git',
      isDirty: false,
    });

    expect(payload.draft).toBe(false);
  });

  it('sets draft=true when isDirty is true (unsaved edits → backend skips recording)', () => {
    const payload = buildEditorRunRequest({
      draft: baseDraft(),
      evaluationEnabled: false,
      repositoryUrl: 'https://example.test/repo.git',
      isDirty: true,
    });

    expect(payload.draft).toBe(true);
  });

  it('defaults draft to false when isDirty is omitted (safe default = record history)', () => {
    // The default matches the backend default and matches HappyPath's
    // expectation: a Run with no explicit dirty signal is treated as clean
    // so the MANUAL Execution is recorded. Anything else would silently
    // regress issue #140.
    const payload = buildEditorRunRequest({
      draft: baseDraft(),
      evaluationEnabled: false,
      repositoryUrl: 'https://example.test/repo.git',
    });

    expect(payload.draft).toBe(false);
  });
});
