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
 * Unit tests for the mock generator. Mirrors `normalize-openapi.test.mjs`
 * conventions — node:test only, no extra dependency.
 *
 * Coverage:
 *   1. Pure helpers (pathTemplateToMatcher, schemaDefault, pickSuccessStatus,
 *      collectOperations) on small synthetic specs.
 *   2. End-to-end drift guardrail: read the real spec, regenerate to a temp
 *      dir, diff against the committed `src/generated/mock/*`. Asserts a
 *      clean second run produces zero changes (the same property the CI
 *      guardrail enforces).
 *   3. Handler-table coverage: every operationId in the spec is wired into
 *      `defaultHandlers` and exactly one default handler is emitted per
 *      operation. The test reads the generated `handlers.ts` source so it
 *      runs without compiling TypeScript.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectOperations,
  pathTemplateToMatcher,
  pickSuccessStatus,
  renderExampleResponses,
  renderHandlers,
  renderOperationIndex,
  schemaDefault,
} from './generate-mock.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const specPath = path.resolve(
  workspaceRoot,
  '..',
  '..',
  'apps',
  'promptlm-webapp',
  'target',
  'generated',
  'openapi',
  'promptlm-webapp-openapi.json',
);
const generatedDir = path.join(workspaceRoot, 'src', 'generated', 'mock');

const trySpec = async () => {
  try {
    const raw = await readFile(specPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
};

describe('pathTemplateToMatcher', () => {
  it('escapes a literal path with no params', () => {
    const { pattern, paramNames } = pathTemplateToMatcher('/api/store');
    assert.deepEqual(paramNames, []);
    assert.match('/api/store', new RegExp(pattern));
    assert.doesNotMatch('/api/storex', new RegExp(pattern));
  });

  it('captures a single named parameter', () => {
    const { pattern, paramNames } = pathTemplateToMatcher('/api/prompts/{id}/release');
    assert.deepEqual(paramNames, ['id']);
    const m = new RegExp(pattern).exec('/api/prompts/abc-123/release');
    assert.ok(m);
    assert.equal(m.groups.id, 'abc-123');
  });

  it('captures multiple named parameters in declaration order', () => {
    const { pattern, paramNames } = pathTemplateToMatcher('/api/prompts/{group}/{name}/revisions');
    assert.deepEqual(paramNames, ['group', 'name']);
    const m = new RegExp(pattern).exec('/api/prompts/support/welcome/revisions');
    assert.equal(m.groups.group, 'support');
    assert.equal(m.groups.name, 'welcome');
  });

  it('does not greedy-match across slashes', () => {
    const { pattern } = pathTemplateToMatcher('/api/prompts/{id}/release');
    assert.doesNotMatch('/api/prompts/abc/release/extra', new RegExp(pattern));
  });
});

describe('pickSuccessStatus', () => {
  it('prefers 200', () => {
    assert.equal(pickSuccessStatus({ 200: {}, 404: {}, 500: {} }), '200');
  });
  it('falls back to the smallest 2xx', () => {
    assert.equal(pickSuccessStatus({ 201: {}, 204: {}, 404: {} }), '201');
  });
  it('falls back to the first declared status if no 2xx is present', () => {
    assert.equal(pickSuccessStatus({ 404: {}, 500: {} }), '404');
  });
});

describe('schemaDefault', () => {
  const spec = { components: { schemas: {} } };

  it('returns "" for a plain string', () => {
    assert.equal(schemaDefault(spec, { type: 'string' }), '');
  });

  it('returns 0 for an integer', () => {
    assert.equal(schemaDefault(spec, { type: 'integer' }), 0);
  });

  it('returns false for a boolean', () => {
    assert.equal(schemaDefault(spec, { type: 'boolean' }), false);
  });

  it('returns the spec-declared default if present', () => {
    assert.equal(schemaDefault(spec, { type: 'string', default: 'keep' }), 'keep');
  });

  it('returns the first enum value if no default is declared', () => {
    assert.equal(
      schemaDefault(spec, { type: 'string', enum: ['ACTIVE', 'RETIRED'] }),
      'ACTIVE',
    );
  });

  it('returns the first oneOf branch', () => {
    const result = schemaDefault(spec, {
      oneOf: [
        { type: 'object', properties: { type: { type: 'string' } }, required: ['type'] },
        { type: 'object', properties: { other: { type: 'string' } }, required: ['other'] },
      ],
    });
    assert.deepEqual(result, { type: '' });
  });

  it('emits required fields only for an object', () => {
    const result = schemaDefault(spec, {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['id', 'name'],
    });
    assert.deepEqual(result, { id: '', name: '' });
  });

  it('returns an ISO timestamp for date-time format', () => {
    const result = schemaDefault(spec, { type: 'string', format: 'date-time' });
    assert.ok(!Number.isNaN(Date.parse(result)));
  });

  it('resolves $ref before defaulting', () => {
    const refSpec = {
      components: {
        schemas: {
          Foo: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        },
      },
    };
    assert.deepEqual(schemaDefault(refSpec, { $ref: '#/components/schemas/Foo' }), { id: '' });
  });

  it('survives a $ref cycle by emitting {}', () => {
    const cycleSpec = {
      components: {
        schemas: {
          Node: {
            type: 'object',
            properties: { next: { $ref: '#/components/schemas/Node' } },
            required: ['next'],
          },
        },
      },
    };
    const result = schemaDefault(cycleSpec, { $ref: '#/components/schemas/Node' });
    // Outer level is real, inner-recursive level collapses to {}.
    assert.deepEqual(result, { next: {} });
  });
});

describe('collectOperations on a synthetic spec', () => {
  const synthetic = {
    paths: {
      '/api/x': {
        get: {
          operationId: 'getX',
          responses: { 200: { content: { 'application/json': { schema: { type: 'string' } } } } },
        },
        post: {
          operationId: 'postX',
          requestBody: { content: { 'application/json': { schema: { type: 'string' } } } },
          responses: { 200: { content: { 'application/json': { schema: { type: 'string' } } } } },
        },
      },
    },
  };

  it('extracts one entry per (path, method) pair', () => {
    const ops = collectOperations(synthetic);
    assert.equal(ops.length, 2);
    assert.deepEqual(
      ops.map((op) => op.opId).sort(),
      ['getX', 'postX'],
    );
  });

  it('throws on a method missing operationId', () => {
    assert.throws(() =>
      collectOperations({
        paths: { '/api/x': { get: { responses: { 200: {} } } } },
      }),
    );
  });
});

describe('renderHandlers / renderOperationIndex output', () => {
  it('emits one handler per operationId, asserted from the rendered source', async () => {
    const spec = await trySpec();
    if (!spec) {
      // Spec not built in this environment — skip the wire-format check.
      return;
    }
    const ops = collectOperations(spec).sort((a, b) => a.opId.localeCompare(b.opId));
    const handlersSrc = renderHandlers(ops);
    const indexSrc = renderOperationIndex(ops);

    // Every opId must appear in defaultHandlers exactly once.
    const handlerKeys = [...handlersSrc.matchAll(/^  (\w+): \w+_default,$/gm)].map((m) => m[1]);
    assert.deepEqual(handlerKeys.sort(), ops.map((op) => op.opId).sort());

    // Every opId must appear in operation-index exactly once.
    const indexHits = [...indexSrc.matchAll(/opId: "([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(indexHits.sort(), ops.map((op) => op.opId).sort());
  });
});

describe('mock-generator drift guardrail', () => {
  it('regenerating into a fresh dir produces byte-identical files to those committed', async () => {
    const spec = await trySpec();
    if (!spec) {
      return; // Spec not built — skip drift check.
    }

    const ops = collectOperations(spec).sort((a, b) => a.opId.localeCompare(b.opId));

    const tmp = await mkdtemp(path.join(tmpdir(), 'mock-gen-'));
    await mkdir(tmp, { recursive: true });
    await writeFile(path.join(tmp, 'operation-index.ts'), renderOperationIndex(ops));
    await writeFile(path.join(tmp, 'example-responses.ts'), renderExampleResponses(spec, ops));
    await writeFile(path.join(tmp, 'handlers.ts'), renderHandlers(ops));

    for (const file of ['operation-index.ts', 'example-responses.ts', 'handlers.ts']) {
      let committed;
      try {
        committed = await readFile(path.join(generatedDir, file), 'utf8');
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          assert.fail(
            `Committed generated file ${file} is missing — run \`npm run generate:mock\` and commit the output.`,
          );
        }
        throw err;
      }
      const fresh = await readFile(path.join(tmp, file), 'utf8');
      assert.equal(
        fresh,
        committed,
        `Drift in ${file}: regenerating the mock produced different bytes than the committed copy.`,
      );
    }
  });
});
