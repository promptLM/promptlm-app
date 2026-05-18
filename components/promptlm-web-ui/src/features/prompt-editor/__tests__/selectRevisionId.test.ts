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
import { selectRevisionId } from '../selectRevisionId';

describe('selectRevisionId', () => {
  it('prefers the release tag when present', () => {
    expect(selectRevisionId({ releaseTag: 'v1.4', headShortSha: 'a1b2c3d' })).toBe('v1.4');
  });

  it('falls back to the short SHA when no tag is present', () => {
    expect(selectRevisionId({ releaseTag: undefined, headShortSha: 'a1b2c3d' })).toBe('a1b2c3d');
  });

  it('returns undefined when neither field is set', () => {
    expect(selectRevisionId({})).toBeUndefined();
  });

  it('returns undefined when the source itself is null', () => {
    expect(selectRevisionId(null)).toBeUndefined();
  });

  it('returns undefined when the source is undefined', () => {
    expect(selectRevisionId(undefined)).toBeUndefined();
  });

  it('treats blank tag as absent and falls back to the SHA', () => {
    expect(selectRevisionId({ releaseTag: '   ', headShortSha: 'a1b2c3d' })).toBe('a1b2c3d');
  });

  it('treats blank SHA as absent and returns undefined when no tag', () => {
    expect(selectRevisionId({ releaseTag: null, headShortSha: '' })).toBeUndefined();
  });

  it('trims surrounding whitespace from the tag', () => {
    expect(selectRevisionId({ releaseTag: '  v2.0 ' })).toBe('v2.0');
  });

  it('trims surrounding whitespace from the SHA', () => {
    expect(selectRevisionId({ headShortSha: '\ta1b2c3d\n' })).toBe('a1b2c3d');
  });
});
