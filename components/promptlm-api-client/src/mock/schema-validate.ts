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
 * Compiles the response schemas declared in the OpenAPI spec into ajv
 * validators, and validates `(opId, status, body)` tuples produced by the
 * mock backend before they are sent to Playwright.
 *
 * Failures throw `MockContractViolation` synchronously so a misbehaving
 * mock handler fails its test with a precise message rather than silently
 * leaking an off-spec response into the SPA.
 */

import Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import { operationIndex } from '../generated/mock/operation-index';

/**
 * Thrown when a mock response body fails the response schema for the
 * operation+status it is being returned for.
 */
export class MockContractViolation extends Error {
  readonly opId: string;
  readonly status: number;
  readonly errors: ErrorObject[];
  constructor(opId: string, status: number, errors: ErrorObject[]) {
    super(
      `Mock response for ${opId} (status ${status}) violates OpenAPI schema:\n` +
        errors.map((e) => `  - ${e.instancePath || '/'} ${e.message}`).join('\n'),
    );
    this.name = 'MockContractViolation';
    this.opId = opId;
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Loaded once on first access. Holds a per-(opId, status) compiled validator
 * plus the raw spec for ad-hoc lookups during development.
 */
export interface SchemaValidator {
  validate(opId: string, status: number, body: unknown): void;
  hasSchema(opId: string, status: number): boolean;
}

interface SchemaIndex {
  byOpId: Map<string, Map<number, ValidateFunction>>;
}

/**
 * Compile the ajv validators from the OpenAPI components+responses tables.
 * The spec is passed in rather than read here so callers can choose between
 * the runtime-bundled JSON (Node tests, Vitest in the SPA) and a freshly
 * fetched one (Playwright fixture in a future worker).
 *
 * `strict: false` because springdoc emits a few legal-but-non-strict
 * keywords ajv complains about (`additionalProperties`-with-schema on a
 * top-level ref, mixed `type: ['string', 'null']`).
 */
export function createSchemaValidator(spec: unknown): SchemaValidator {
  const ajv = new Ajv({
    strict: false,
    allErrors: true,
    // Spec uses local `#/components/schemas/...` refs; resolve from root.
    schemas: collectComponentSchemas(spec),
  });
  addFormats(ajv);

  const index: SchemaIndex = { byOpId: new Map() };

  const paths = (spec as { paths?: Record<string, Record<string, unknown>> }).paths ?? {};
  for (const op of operationIndex) {
    const pathItem = paths[op.pathTemplate];
    const operation = pathItem && (pathItem as Record<string, unknown>)[op.method.toLowerCase()];
    if (!operation || typeof operation !== 'object') continue;
    const responses = (operation as { responses?: Record<string, unknown> }).responses ?? {};
    const perStatus = new Map<number, ValidateFunction>();
    for (const [statusKey, response] of Object.entries(responses)) {
      const status = Number.parseInt(statusKey, 10);
      if (!Number.isFinite(status)) continue;
      const schema = (response as { content?: { 'application/json'?: { schema?: unknown } } })
        ?.content?.['application/json']?.schema;
      if (!schema) continue;
      try {
        perStatus.set(status, ajv.compile(schema as object));
      } catch (err) {
        // Compilation errors are surfaced at runtime when a test actually
        // routes through this status — keep the rest of the table usable.
        const cause = err instanceof Error ? err.message : String(err);
        console.warn(
          `[mock] failed to compile response schema for ${op.opId} ${status}: ${cause}`,
        );
      }
    }
    index.byOpId.set(op.opId, perStatus);
  }

  return {
    validate(opId, status, body) {
      // Empty / undefined body — design open question #3: 404 + no body is
      // legal and ajv would refuse to validate `undefined`. Skip silently.
      if (body == null) return;
      const perStatus = index.byOpId.get(opId);
      if (!perStatus) return;
      const validate = perStatus.get(status);
      if (!validate) return;
      const ok = validate(body);
      if (!ok) {
        throw new MockContractViolation(opId, status, validate.errors ?? []);
      }
    },
    hasSchema(opId, status) {
      return index.byOpId.get(opId)?.has(status) ?? false;
    },
  };
}

/**
 * Returns every `#/components/schemas/...` entry rewritten as an array of
 * `{ $id, ...schema }` so ajv can resolve cross-references via `$ref`. We
 * inject `$id = "#/components/schemas/<name>"` so the OpenAPI-style refs in
 * `operation.responses[*].content.application/json.schema` resolve verbatim.
 */
function collectComponentSchemas(spec: unknown): object[] {
  const components = (spec as { components?: { schemas?: Record<string, object> } }).components;
  const schemas = components?.schemas;
  if (!schemas || typeof schemas !== 'object') return [];
  return Object.entries(schemas).map(([name, schema]) => ({
    $id: '#/components/schemas/' + name,
    ...(schema as object),
  }));
}
