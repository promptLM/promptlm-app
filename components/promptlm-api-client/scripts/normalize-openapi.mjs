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
 * Normalises the springdoc-generated OpenAPI spec before client generation.
 *
 * Two distinct passes:
 *
 * 1. Strip "default-default" markers anywhere in the spec.
 *    springdoc emits `default: ""` (and `default: false`, `default: 0`,
 *    `default: null`, `default: []`, `default: {}`) on every property carrying
 *    an `@Schema` annotation, regardless of whether the underlying Java field
 *    has an actual default. openapi-typescript interprets any `default` as
 *    "this property has a default, therefore it is required", which promotes
 *    spuriously-defaulted fields to required in the generated TypeScript types
 *    and does not reflect the wire contract. We strip these "no-op" defaults
 *    while preserving meaningful ones (e.g. `default: "active"`,
 *    `default: 5`, `default: true`).
 *
 * 2. Strip every `default` from `paths.*.*.parameters[*].schema`.
 *    springdoc emits `@RequestParam(defaultValue = "...")` verbatim into the
 *    parameter schema as a string default, which `openapi-typescript-codegen`
 *    uses to infer the parameter's TS type — overriding the declared schema
 *    type. e.g. a boolean query param with `defaultValue = "false"` ends up
 *    typed as `string` in the generated client. Defaults on parameter schemas
 *    are documentation-only and not part of the wire contract, so we drop
 *    them unconditionally.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const specPath = resolve(__dirname, '..', '..', '..', 'apps', 'promptlm-webapp', 'target', 'generated', 'openapi', 'promptlm-webapp-openapi.json');

/**
 * Returns true if `value` is one of the springdoc "no-op" defaults that we
 * want to strip — i.e. it carries no real semantic information.
 *
 * Non-trivial defaults (truthy primitives, non-empty arrays/objects) are
 * preserved because they may genuinely document backend behaviour.
 */
export const isNoopDefault = (value) => {
  if (value === '' || value === false || value === 0 || value === null) {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  ) {
    return true;
  }
  return false;
};

/**
 * Recursively walk `node`, deleting any `default` key whose value matches
 * `isNoopDefault`. Exported under the original name for backwards
 * compatibility with anything that may have imported it.
 */
export const stripEmptyDefaults = (node) => {
  if (Array.isArray(node)) {
    node.forEach(stripEmptyDefaults);
    return;
  }
  if (node && typeof node === 'object') {
    if ('default' in node && isNoopDefault(node.default)) {
      delete node.default;
    }
    for (const value of Object.values(node)) {
      stripEmptyDefaults(value);
    }
  }
};

/**
 * Walk every parameter under `paths.*.*.parameters[*]` and drop any `default`
 * from its `schema`, regardless of value. Defaults on parameter schemas are
 * documentation hints, not contract, and confuse openapi-typescript-codegen.
 */
export const stripParameterSchemaDefaults = (spec) => {
  const paths = spec && spec.paths;
  if (!paths || typeof paths !== 'object') {
    return;
  }
  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== 'object') continue;
      const params = operation.parameters;
      if (!Array.isArray(params)) continue;
      for (const param of params) {
        if (param && typeof param === 'object' && param.schema && typeof param.schema === 'object') {
          if ('default' in param.schema) {
            delete param.schema.default;
          }
        }
      }
    }
  }
};

// Only run the side-effecting body when invoked as a script (not when
// imported from the test file).
const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;

if (isMain) {
  let raw;
  try {
    raw = readFileSync(specPath, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      console.error(`Error: OpenAPI spec not found at ${specPath}.`);
      console.error(
        'Run `./mvnw -pl apps/promptlm-webapp -am install -DskipTests` from components/promptlm-core to generate it first.',
      );
      process.exit(1);
    }
    throw err;
  }
  const spec = JSON.parse(raw);
  stripEmptyDefaults(spec);
  stripParameterSchemaDefaults(spec);
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
  console.log(`Normalised spec at ${specPath}`);
}
