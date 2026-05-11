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
 * Placeholder substitution for the Test tab Rendered-prompt region.
 *
 * Replaces `${start}name${end}` occurrences inside `template` with the
 * corresponding value from `values`. Missing or empty values leave the
 * placeholder text unchanged so the user can still see what slot is unfilled.
 *
 * The pattern delimiters come from the form (`startPattern` / `endPattern`),
 * default `{{` / `}}` but configurable per prompt — they are escaped before
 * being injected into the regex so users may safely choose pattern characters
 * that have regex meaning.
 */

const escapeRegex = (raw: string): string =>
  raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const substitute = (
  template: string,
  values: Readonly<Record<string, string>>,
  startPattern = '{{',
  endPattern = '}}',
): string => {
  const re = new RegExp(
    `${escapeRegex(startPattern)}\\s*([\\w.-]+)\\s*${escapeRegex(endPattern)}`,
    'g',
  );
  return template.replace(re, (match, name: string) => {
    const v = values[name];
    if (v === undefined || v === '') return match;
    return v;
  });
};
