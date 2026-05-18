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

import { selectReleaseAvailability } from '../selectReleaseAvailability';

const withRelease = (release: Record<string, unknown> | null, semanticHash?: string | null) => ({
  semanticHash: semanticHash ?? null,
  extensions: release === null
    ? {}
    : {
        'x-promptlm': {
          release,
        },
      },
});

describe('selectReleaseAvailability (#186)', () => {
  it('returns available with no reason when the spec has no release metadata', () => {
    const result = selectReleaseAvailability(withRelease(null, 'aaa'));

    expect(result).toEqual({ available: true, reason: null });
  });

  it('returns available when extensions are absent entirely', () => {
    expect(selectReleaseAvailability({ semanticHash: 'aaa' })).toEqual({
      available: true,
      reason: null,
    });
  });

  it('blocks with "Release in progress" while a release is requested', () => {
    const result = selectReleaseAvailability(
      withRelease({ state: 'requested', mode: 'pr_two_phase' }, 'aaa'),
    );

    expect(result).toEqual({ available: false, reason: 'Release in progress' });
  });

  it('blocks with "No changes since last release" when hashes match', () => {
    const result = selectReleaseAvailability(
      withRelease(
        { state: 'released', mode: 'direct', releasedSemanticHash: 'bbb' },
        'bbb',
      ),
    );

    expect(result).toEqual({
      available: false,
      reason: 'No changes since last release',
    });
  });

  it('returns available when current hash differs from the released hash', () => {
    const result = selectReleaseAvailability(
      withRelease(
        { state: 'released', mode: 'direct', releasedSemanticHash: 'bbb' },
        'ccc',
      ),
    );

    expect(result).toEqual({ available: true, reason: null });
  });

  it('falls through to available when the released-hash baseline is missing (pre-#186)', () => {
    const result = selectReleaseAvailability(
      withRelease({ state: 'released', mode: 'direct' }, 'ccc'),
    );

    expect(result).toEqual({ available: true, reason: null });
  });

  it('falls through to available when the current semantic hash is missing', () => {
    const result = selectReleaseAvailability(
      withRelease(
        { state: 'released', mode: 'direct', releasedSemanticHash: 'bbb' },
        null,
      ),
    );

    expect(result).toEqual({ available: true, reason: null });
  });

  it('is defensive against non-object inputs', () => {
    expect(selectReleaseAvailability(null)).toEqual({ available: true, reason: null });
    expect(selectReleaseAvailability(undefined)).toEqual({ available: true, reason: null });
    expect(selectReleaseAvailability('not-a-spec')).toEqual({ available: true, reason: null });
  });

  it('is defensive against unknown release states', () => {
    const result = selectReleaseAvailability(
      withRelease({ state: 'something-weird', mode: 'direct' }, 'aaa'),
    );

    expect(result).toEqual({ available: true, reason: null });
  });
});
