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
 * Composes the "View on GitHub" URL on the client.
 *
 * The remote URL is a project-level concern, not a prompt-spec concern (it can
 * change when the project is re-pointed at a different host), so the URL is
 * not exposed on the {@code PromptSpec} boundary. Instead, the client takes
 * the three inputs it already has — the active project's {@code repositoryUrl},
 * the spec's {@code path}, and the spec's {@code headShortSha} (from #184) —
 * and assembles
 *
 *   https://github.com/<owner>/<repo>/blob/<sha>/<encoded-path>
 *
 * Gating rules (all must hold; otherwise returns `undefined` and the caller
 * hides the link):
 *
 * 1. `projectRemoteUrl` parses as a recognised GitHub URL (HTTPS
 *    `https://github.com/owner/repo[.git]` or SSH
 *    `git@github.com:owner/repo[.git]`).
 * 2. `specPath` is a non-empty, repo-relative path.
 * 3. `headSha` is a non-empty Git SHA (short or full — GitHub's
 *    `/blob/<sha>` accepts both).
 * 4. `lifecycleState === 'pushed'`. Drafts, saved, and committed (but not yet
 *    pushed) revisions have no immutable remote URL.
 *
 * Each path segment is percent-encoded so spaces and non-ASCII characters in
 * the spec path produce a valid URL — no user-controlled string is smuggled
 * verbatim into the URL.
 *
 * @see https://github.com/promptLM/promptlm-app/issues/188
 */

const GITHUB_HTTPS = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s?#.]+)(?:\.git)?\/?(?:[?#].*)?$/;
const GITHUB_SSH = /^git@github\.com:([^/\s]+)\/([^/\s.]+)(?:\.git)?$/;

export type PromptLifecycleState =
  | 'draft'
  | 'saved'
  | 'committed'
  | 'pushed'
  | (string & {});

export interface ViewOnRemoteInputs {
  /** Active project's remote URL (e.g. `https://github.com/acme/agents`). */
  projectRemoteUrl: string | null | undefined;
  /** Spec's on-disk path relative to the repository root. */
  specPath: string | null | undefined;
  /** Git short or full SHA of the commit currently carrying the spec. */
  headSha: string | null | undefined;
  /** Server-derived lifecycle state. Only `'pushed'` yields a URL. */
  lifecycleState: PromptLifecycleState | null | undefined;
}

interface OwnerRepo {
  owner: string;
  repo: string;
}

const stripGitSuffix = (value: string): string =>
  value.endsWith('.git') ? value.slice(0, -4) : value;

/**
 * Parses a remote URL into `{owner, repo}` when it is a recognised GitHub
 * HTTPS or SSH URL, otherwise returns `undefined`. Exported for unit tests.
 */
export const parseGithubOwnerRepo = (
  remoteUrl: string | null | undefined,
): OwnerRepo | undefined => {
  if (!remoteUrl) return undefined;
  const trimmed = remoteUrl.trim();
  if (trimmed.length === 0) return undefined;
  const https = GITHUB_HTTPS.exec(trimmed);
  if (https) return { owner: https[1], repo: stripGitSuffix(https[2]) };
  const ssh = GITHUB_SSH.exec(trimmed);
  if (ssh) return { owner: ssh[1], repo: stripGitSuffix(ssh[2]) };
  return undefined;
};

const encodePath = (specPath: string): string =>
  specPath
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const buildViewOnRemoteUrl = ({
  projectRemoteUrl,
  specPath,
  headSha,
  lifecycleState,
}: ViewOnRemoteInputs): string | undefined => {
  if (lifecycleState !== 'pushed') return undefined;
  if (typeof specPath !== 'string' || specPath.trim().length === 0) return undefined;
  if (typeof headSha !== 'string' || headSha.trim().length === 0) return undefined;
  const ownerRepo = parseGithubOwnerRepo(projectRemoteUrl);
  if (!ownerRepo) return undefined;
  const encoded = encodePath(specPath.trim().replace(/\\/g, '/'));
  if (encoded.length === 0) return undefined;
  return `https://github.com/${ownerRepo.owner}/${ownerRepo.repo}/blob/${headSha.trim()}/${encoded}`;
};
