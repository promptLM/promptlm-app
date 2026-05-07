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
 * springdoc emits "default": "" on every property carrying an @Schema annotation,
 * which openapi-typescript interprets as "this property has a default, therefore
 * it is required". That promotes every annotated PromptSpec field to required in
 * the generated TypeScript types, which does not reflect the wire contract.
 *
 * This pass strips empty-string defaults so the generated client only marks fields
 * required when the backend actually says so via @Schema(requiredMode = REQUIRED).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const specPath = resolve(__dirname, '..', '..', '..', 'apps', 'promptlm-webapp', 'target', 'generated', 'openapi', 'promptlm-webapp-openapi.json');

const stripEmptyDefaults = (node) => {
  if (Array.isArray(node)) {
    node.forEach(stripEmptyDefaults);
    return;
  }
  if (node && typeof node === 'object') {
    if ('default' in node && node.default === '') {
      delete node.default;
    }
    for (const value of Object.values(node)) {
      stripEmptyDefaults(value);
    }
  }
};

const raw = readFileSync(specPath, 'utf8');
const spec = JSON.parse(raw);
stripEmptyDefaults(spec);
writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
console.log(`Normalised spec at ${specPath}`);
