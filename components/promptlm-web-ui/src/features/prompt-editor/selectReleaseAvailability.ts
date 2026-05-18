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
 * Selector that decides whether the **Release** action should be enabled for a
 * prompt detail view, and — when not — surfaces a human-readable reason.
 *
 * Implements the gating logic for issue #186 ("Rework the release in UI"):
 *
 * - Never released (no `extensions['x-promptlm'].release` entry, or only a
 *   pending request that has not yet reached `released`) → **available**.
 * - Already-requested PR-mode release → **not available**, reason "Release in
 *   progress" (avoids double-triggering).
 * - Previously released, and the current spec's `semanticHash` matches the
 *   `releasedSemanticHash` recorded at the moment of release → **not
 *   available**, reason "No changes since last release".
 * - Previously released but the hashes differ (or the released hash is absent
 *   on pre-#186 records) → **available**.
 *
 * The selector is deliberately defensive: the OpenAPI-generated
 * {@code PromptSpec} type does not yet model `releasedSemanticHash`, so we
 * inspect `extensions` via a narrow {@link unknown}-typed read rather than
 * relying on a typed surface that may regenerate later. This keeps the call
 * site stable across regenerations.
 */

export interface ReleaseAvailability {
  /** `true` when the Release CTA should be enabled. */
  available: boolean;
  /**
   * Human-readable reason to surface in a tooltip when {@link available} is
   * `false`. `null` when `available` is `true` (no reason to display).
   */
  reason: string | null;
}

const AVAILABLE: ReleaseAvailability = { available: true, reason: null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readRelease = (spec: unknown): Record<string, unknown> | null => {
  if (!isRecord(spec)) return null;
  const extensions = spec.extensions;
  if (!isRecord(extensions)) return null;
  const promptlm = extensions['x-promptlm'];
  if (!isRecord(promptlm)) return null;
  const release = promptlm.release;
  return isRecord(release) ? release : null;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

/**
 * Compute the {@link ReleaseAvailability} for the given prompt spec.
 *
 * Returns a default of `{ available: true, reason: null }` whenever the spec
 * shape doesn't carry enough info — the server's `POST /release` endpoint is
 * the authoritative gate and will reject invalid attempts, so the UI choosing
 * "available" on missing data only ever causes a non-destructive nuisance
 * click rather than locking users out.
 */
export const selectReleaseAvailability = (spec: unknown): ReleaseAvailability => {
  const release = readRelease(spec);
  if (release === null) {
    // Never released — Release is meaningful.
    return AVAILABLE;
  }

  const state = readString(release.state);
  if (state === 'requested') {
    return { available: false, reason: 'Release in progress' };
  }

  if (state !== 'released') {
    // Unknown state — be conservative and let the user try; the server will
    // reject if it shouldn't proceed.
    return AVAILABLE;
  }

  const releasedHash = readString(release.releasedSemanticHash);
  if (releasedHash === null) {
    // Pre-#186 release record without a baseline hash. We can't tell whether
    // the spec has changed — fall through to "available".
    return AVAILABLE;
  }

  const currentHash = isRecord(spec) ? readString(spec.semanticHash) : null;
  if (currentHash === null) {
    // Current hash unavailable — be conservative.
    return AVAILABLE;
  }

  if (currentHash === releasedHash) {
    return { available: false, reason: 'No changes since last release' };
  }
  return AVAILABLE;
};
