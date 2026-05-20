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

import { truncateMiddlePath } from '../path';

describe('truncateMiddlePath', () => {
  it('returns short paths unchanged', () => {
    expect(truncateMiddlePath('~/dev/foo', 40)).toBe('~/dev/foo');
    expect(truncateMiddlePath('/short/path', 40)).toBe('/short/path');
  });

  it('preserves the leading tilde and the last two segments', () => {
    expect(
      truncateMiddlePath('~/work/clients/acme/repo/main', 25),
    ).toBe('~/…/repo/main');
  });

  it('preserves the root segment for absolute paths', () => {
    expect(
      truncateMiddlePath('/Users/fk/dev/promptLM/promptlm-app', 25),
    ).toBe('/Users/…/promptLM/promptlm-app');
  });

  it('returns the original when there is nothing meaningful to elide', () => {
    // Only two segments — no middle to collapse.
    expect(truncateMiddlePath('/Users/fk', 5)).toBe('/Users/fk');
  });

  it('handles Windows-style separators', () => {
    expect(
      truncateMiddlePath('C:\\Users\\fk\\dev\\promptLM\\promptlm-app', 25),
    ).toBe('C:\\…\\promptLM\\promptlm-app');
  });

  it('returns opaque strings unchanged (let CSS handle them)', () => {
    const long = 'a'.repeat(60);
    expect(truncateMiddlePath(long, 20)).toBe(long);
  });

  it('returns empty string for empty input', () => {
    expect(truncateMiddlePath('', 40)).toBe('');
  });

  it('respects a custom tailSegments count', () => {
    expect(
      truncateMiddlePath('/a/b/c/d/e/f/g/h', 10, 3),
    ).toBe('/a/…/f/g/h');
  });
});
