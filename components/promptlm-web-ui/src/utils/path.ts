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

const ELLIPSIS = '…';

/**
 * Shorten a filesystem path for display by collapsing intermediate segments
 * into a single ellipsis, preserving the leading `~` or root segment and the
 * trailing `tailSegments` (default 2) segments. When the input is already
 * shorter than `maxLength`, it's returned unchanged. When there is not
 * enough path structure to elide meaningfully, the original is returned —
 * callers can layer CSS truncation on top for those edge cases.
 *
 * Examples (with default maxLength=40, tailSegments=2):
 *   "~/dev/promptLM/promptlm-app"             → "~/dev/promptLM/promptlm-app"
 *   "/Users/fk/dev/promptLM/promptlm-app"     → "/Users/…/promptLM/promptlm-app"
 *   "~/work/clients/acme/repo/main"           → "~/…/repo/main"
 */
export function truncateMiddlePath(
  path: string,
  maxLength: number = 40,
  tailSegments: number = 2,
): string {
  if (!path) {
    return '';
  }
  if (path.length <= maxLength) {
    return path;
  }

  const hasBackslash = path.includes('\\');
  const hasForward = path.includes('/');
  const separator = hasBackslash && !hasForward ? '\\' : '/';

  const segments = path.split(separator).filter((segment) => segment.length > 0);
  const isAbsolute = path.startsWith(separator);
  const isTilde = path.startsWith('~');

  let head: string;
  let bodySegments: string[];
  if (isTilde) {
    head = '~';
    bodySegments = segments[0] === '~' ? segments.slice(1) : segments;
  } else if (segments.length === 0) {
    return path;
  } else {
    head = segments[0];
    bodySegments = segments.slice(1);
  }

  if (bodySegments.length <= tailSegments) {
    return path;
  }

  const tail = bodySegments.slice(-tailSegments);
  const leadingSep = isAbsolute ? separator : '';
  return `${leadingSep}${head}${separator}${ELLIPSIS}${separator}${tail.join(separator)}`;
}
