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

import { describe, it, expect } from 'vitest';
import { substitute } from '@promptlm/ui';

describe('substitute', () => {
  it('substitutes a single placeholder', () => {
    expect(substitute('Hi {{name}}.', { name: 'Ada' })).toBe('Hi Ada.');
  });

  it('substitutes multiple placeholders', () => {
    expect(
      substitute('Q: {{question}}\nT: {{tone}}', { question: 'Why?', tone: 'curt' }),
    ).toBe('Q: Why?\nT: curt');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(substitute('Hi {{name}}.', {})).toBe('Hi {{name}}.');
  });

  it('leaves empty-string values untouched (so user sees unfilled slot)', () => {
    expect(substitute('Hi {{name}}.', { name: '' })).toBe('Hi {{name}}.');
  });

  it('honours custom delimiters', () => {
    expect(substitute('Hi <%name%>.', { name: 'Ada' }, '<%', '%>')).toBe('Hi Ada.');
  });

  it('escapes regex metachars in delimiters', () => {
    // [name] would otherwise create a character class; we expect literal match.
    expect(substitute('Hi [name].', { name: 'Ada' }, '[', ']')).toBe('Hi Ada.');
  });

  it('tolerates whitespace inside the delimiters', () => {
    expect(substitute('Hi {{ name }}.', { name: 'Ada' })).toBe('Hi Ada.');
  });
});
