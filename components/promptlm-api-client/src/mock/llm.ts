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
 * Canonical canned LLM response used by `executePrompt`,
 * `executeStoredPrompt`, and the pre-release-execute gate of `releasePrompt`.
 * Tests may overwrite `state.llmCanned` to script a different response, or
 * call `BackendFixture.mockLLM(...)` once #251 lands.
 */

import type { ChatCompletionResponse } from '../generated/client/models/ChatCompletionResponse';

export function defaultLlmCanned(): ChatCompletionResponse {
  return {
    type: 'chat/completion',
    content: 'Hello from the mock LLM.',
    usage: {
      cost: 0,
      input_tokens: 12,
      output_tokens: 7,
    },
    duration_ms: 42,
  };
}
