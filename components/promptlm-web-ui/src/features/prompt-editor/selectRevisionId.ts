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
 * Picks the user-visible revision identifier for the editor topbar.
 *
 * Resolution order, per issue #184:
 *   1. `releaseTag` — present when the spec has been released with a tag
 *      (e.g. "v1.4").
 *   2. `headShortSha` — fallback when no tag is available (e.g. "a1b2c3d").
 *   3. `undefined` — the spec cannot be matched to a committed revision;
 *      the topbar must fall back to its legacy copy.
 *
 * Both source fields are server-derived (see `PromptSpecApiView.java`) and
 * read here through a structural shape so the helper does not depend on the
 * api-client TS regen cycle for #189 + #184.
 *
 * Blank / whitespace-only inputs are treated as absent so a stray empty
 * string from the backend can't pin the topbar to a meaningless label.
 */
export type RevisionSource = {
  releaseTag?: string | null;
  headShortSha?: string | null;
} | null | undefined;

export const selectRevisionId = (source: RevisionSource): string | undefined => {
  if (!source) {
    return undefined;
  }
  const tag = nonBlank(source.releaseTag);
  if (tag) {
    return tag;
  }
  return nonBlank(source.headShortSha);
};

const nonBlank = (value: string | null | undefined): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
