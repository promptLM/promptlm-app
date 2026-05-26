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

import {
  buildViewOnRemoteUrl,
  parseGithubOwnerRepo,
} from '../buildViewOnRemoteUrl';

describe('buildViewOnRemoteUrl', () => {
  const base = {
    projectRemoteUrl: 'https://github.com/acme/agents',
    specPath: 'prompts/support/welcome.yml',
    headSha: 'abc1234',
    lifecycleState: 'pushed' as const,
  };

  it('composes a /blob/<sha>/<path> URL when all inputs are present and lifecycle is pushed', () => {
    expect(buildViewOnRemoteUrl(base)).toBe(
      'https://github.com/acme/agents/blob/abc1234/prompts/support/welcome.yml',
    );
  });

  it('accepts a full-length SHA (GitHub /blob accepts both short and full)', () => {
    expect(
      buildViewOnRemoteUrl({
        ...base,
        headSha: 'abcdef1234567890abcdef1234567890abcdef12',
      }),
    ).toBe(
      'https://github.com/acme/agents/blob/abcdef1234567890abcdef1234567890abcdef12/prompts/support/welcome.yml',
    );
  });

  it('accepts SSH remotes (git@github.com:owner/repo[.git])', () => {
    expect(
      buildViewOnRemoteUrl({
        ...base,
        projectRemoteUrl: 'git@github.com:acme/agents.git',
      }),
    ).toBe(
      'https://github.com/acme/agents/blob/abc1234/prompts/support/welcome.yml',
    );
  });

  it('strips a trailing .git on HTTPS remotes', () => {
    expect(
      buildViewOnRemoteUrl({
        ...base,
        projectRemoteUrl: 'https://github.com/acme/agents.git',
      }),
    ).toBe(
      'https://github.com/acme/agents/blob/abc1234/prompts/support/welcome.yml',
    );
  });

  it('percent-encodes path segments so spaces and unicode produce a valid URL', () => {
    expect(
      buildViewOnRemoteUrl({
        ...base,
        specPath: 'prompts/customer support/héllo.yml',
      }),
    ).toBe(
      'https://github.com/acme/agents/blob/abc1234/prompts/customer%20support/h%C3%A9llo.yml',
    );
  });

  it('does not double-encode forward slashes between segments', () => {
    const url = buildViewOnRemoteUrl({
      ...base,
      specPath: 'a/b/c.yml',
    });
    expect(url).toBe('https://github.com/acme/agents/blob/abc1234/a/b/c.yml');
  });

  it('normalises Windows-style backslashes to forward slashes', () => {
    expect(
      buildViewOnRemoteUrl({
        ...base,
        specPath: 'prompts\\support\\welcome.yml',
      }),
    ).toBe(
      'https://github.com/acme/agents/blob/abc1234/prompts/support/welcome.yml',
    );
  });

  describe('gating — lifecycleState', () => {
    it('returns undefined when lifecycleState is draft', () => {
      expect(buildViewOnRemoteUrl({ ...base, lifecycleState: 'draft' })).toBeUndefined();
    });
    it('returns undefined when lifecycleState is saved', () => {
      expect(buildViewOnRemoteUrl({ ...base, lifecycleState: 'saved' })).toBeUndefined();
    });
    it('returns undefined when lifecycleState is committed (not yet pushed)', () => {
      expect(buildViewOnRemoteUrl({ ...base, lifecycleState: 'committed' })).toBeUndefined();
    });
    it('returns undefined when lifecycleState is missing', () => {
      expect(buildViewOnRemoteUrl({ ...base, lifecycleState: null })).toBeUndefined();
      expect(buildViewOnRemoteUrl({ ...base, lifecycleState: undefined })).toBeUndefined();
    });
  });

  describe('gating — remote URL', () => {
    it('returns undefined when the remote is not a GitHub URL (GitLab)', () => {
      expect(
        buildViewOnRemoteUrl({
          ...base,
          projectRemoteUrl: 'https://gitlab.com/acme/agents',
        }),
      ).toBeUndefined();
    });

    it('returns undefined when the remote is Bitbucket', () => {
      expect(
        buildViewOnRemoteUrl({
          ...base,
          projectRemoteUrl: 'https://bitbucket.org/acme/agents',
        }),
      ).toBeUndefined();
    });

    it('returns undefined when the remote URL is missing or blank', () => {
      expect(buildViewOnRemoteUrl({ ...base, projectRemoteUrl: null })).toBeUndefined();
      expect(buildViewOnRemoteUrl({ ...base, projectRemoteUrl: undefined })).toBeUndefined();
      expect(buildViewOnRemoteUrl({ ...base, projectRemoteUrl: '   ' })).toBeUndefined();
    });

    it('returns undefined when the remote URL is malformed', () => {
      expect(
        buildViewOnRemoteUrl({ ...base, projectRemoteUrl: 'not a url' }),
      ).toBeUndefined();
    });
  });

  describe('gating — spec path', () => {
    it('returns undefined when the path is missing', () => {
      expect(buildViewOnRemoteUrl({ ...base, specPath: null })).toBeUndefined();
      expect(buildViewOnRemoteUrl({ ...base, specPath: undefined })).toBeUndefined();
    });
    it('returns undefined when the path is blank', () => {
      expect(buildViewOnRemoteUrl({ ...base, specPath: '   ' })).toBeUndefined();
    });
  });

  describe('gating — head SHA', () => {
    it('returns undefined when the SHA is missing or blank', () => {
      expect(buildViewOnRemoteUrl({ ...base, headSha: null })).toBeUndefined();
      expect(buildViewOnRemoteUrl({ ...base, headSha: undefined })).toBeUndefined();
      expect(buildViewOnRemoteUrl({ ...base, headSha: '' })).toBeUndefined();
    });
  });
});

describe('parseGithubOwnerRepo', () => {
  it('parses https://github.com/owner/repo', () => {
    expect(parseGithubOwnerRepo('https://github.com/acme/agents')).toEqual({
      owner: 'acme',
      repo: 'agents',
    });
  });

  it('parses https://github.com/owner/repo.git', () => {
    expect(parseGithubOwnerRepo('https://github.com/acme/agents.git')).toEqual({
      owner: 'acme',
      repo: 'agents',
    });
  });

  it('parses git@github.com:owner/repo.git', () => {
    expect(parseGithubOwnerRepo('git@github.com:acme/agents.git')).toEqual({
      owner: 'acme',
      repo: 'agents',
    });
  });

  it('returns undefined for non-GitHub URLs', () => {
    expect(parseGithubOwnerRepo('https://gitlab.com/acme/agents')).toBeUndefined();
  });

  it('returns undefined for empty / null input', () => {
    expect(parseGithubOwnerRepo(null)).toBeUndefined();
    expect(parseGithubOwnerRepo(undefined)).toBeUndefined();
    expect(parseGithubOwnerRepo('')).toBeUndefined();
  });
});
