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

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { PromptSpec } from '@promptlm/api-client';
import { ExtensionSlot } from '@/extensions/ExtensionSlot';

describe('ExtensionSlot', () => {
  it('renders nothing when no extensions are registered', () => {
    const prompt = { id: 'prompt-1', name: 'Prompt' } as PromptSpec;
    const html = renderToString(
      <ExtensionSlot slot="prompt-details" context={{ prompt }} />,
    );
    expect(html).toBe('');
  });
});
