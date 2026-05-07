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
 * Unit tests for normalize-openapi.mjs. Uses node:test / node:assert so we
 * don't add a new test framework dependency to this package.
 *
 * Run with: `node --test scripts/normalize-openapi.test.mjs`
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isNoopDefault,
  stripEmptyDefaults,
  stripParameterSchemaDefaults,
} from './normalize-openapi.mjs';

describe('isNoopDefault', () => {
  it('treats empty string as noop', () => {
    assert.equal(isNoopDefault(''), true);
  });
  it('treats false as noop', () => {
    assert.equal(isNoopDefault(false), true);
  });
  it('treats 0 as noop', () => {
    assert.equal(isNoopDefault(0), true);
  });
  it('treats null as noop', () => {
    assert.equal(isNoopDefault(null), true);
  });
  it('treats empty array as noop', () => {
    assert.equal(isNoopDefault([]), true);
  });
  it('treats empty object as noop', () => {
    assert.equal(isNoopDefault({}), true);
  });
  it('preserves non-empty string', () => {
    assert.equal(isNoopDefault('active'), false);
  });
  it('preserves non-zero number', () => {
    assert.equal(isNoopDefault(5), false);
  });
  it('preserves true', () => {
    assert.equal(isNoopDefault(true), false);
  });
  it('preserves non-empty array', () => {
    assert.equal(isNoopDefault([1]), false);
  });
  it('preserves non-empty object', () => {
    assert.equal(isNoopDefault({ a: 1 }), false);
  });
});

describe('stripEmptyDefaults', () => {
  it('strips default: ""', () => {
    const node = { type: 'string', default: '' };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'string' });
  });

  it('strips default: false', () => {
    const node = { type: 'boolean', default: false };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'boolean' });
  });

  it('strips default: 0', () => {
    const node = { type: 'integer', default: 0 };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'integer' });
  });

  it('strips default: null', () => {
    const node = { type: 'string', default: null };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'string' });
  });

  it('strips default: []', () => {
    const node = { type: 'array', default: [] };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'array' });
  });

  it('strips default: {}', () => {
    const node = { type: 'object', default: {} };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'object' });
  });

  it('preserves default: "active"', () => {
    const node = { type: 'string', default: 'active' };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'string', default: 'active' });
  });

  it('preserves default: 5', () => {
    const node = { type: 'integer', default: 5 };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'integer', default: 5 });
  });

  it('preserves default: true', () => {
    const node = { type: 'boolean', default: true };
    stripEmptyDefaults(node);
    assert.deepEqual(node, { type: 'boolean', default: true });
  });

  it('recurses into nested objects', () => {
    const spec = {
      components: {
        schemas: {
          Foo: {
            type: 'object',
            properties: {
              bar: { type: 'string', default: '' },
              baz: { type: 'integer', default: 5 },
              nested: {
                type: 'object',
                properties: {
                  flag: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
      },
    };
    stripEmptyDefaults(spec);
    assert.deepEqual(spec.components.schemas.Foo.properties.bar, { type: 'string' });
    assert.deepEqual(spec.components.schemas.Foo.properties.baz, { type: 'integer', default: 5 });
    assert.deepEqual(
      spec.components.schemas.Foo.properties.nested.properties.flag,
      { type: 'boolean' },
    );
  });

  it('recurses into arrays', () => {
    const node = {
      anyOf: [
        { type: 'string', default: '' },
        { type: 'integer', default: 0 },
        { type: 'string', default: 'keep-me' },
      ],
    };
    stripEmptyDefaults(node);
    assert.deepEqual(node.anyOf, [
      { type: 'string' },
      { type: 'integer' },
      { type: 'string', default: 'keep-me' },
    ]);
  });
});

describe('stripParameterSchemaDefaults', () => {
  it('strips default from a parameter schema regardless of value', () => {
    const spec = {
      paths: {
        '/api/prompts/groups': {
          get: {
            parameters: [
              {
                name: 'includeRetired',
                in: 'query',
                schema: { type: 'string', default: 'false' },
              },
            ],
          },
        },
      },
    };
    stripParameterSchemaDefaults(spec);
    assert.deepEqual(spec.paths['/api/prompts/groups'].get.parameters[0].schema, {
      type: 'string',
    });
  });

  it('strips even truthy/non-empty defaults on parameter schemas', () => {
    const spec = {
      paths: {
        '/api/things': {
          get: {
            parameters: [
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
              { name: 'mode', in: 'query', schema: { type: 'string', default: 'active' } },
            ],
          },
        },
      },
    };
    stripParameterSchemaDefaults(spec);
    assert.deepEqual(spec.paths['/api/things'].get.parameters[0].schema, { type: 'integer' });
    assert.deepEqual(spec.paths['/api/things'].get.parameters[1].schema, { type: 'string' });
  });

  it('does not touch defaults inside requestBody or component schemas', () => {
    const spec = {
      paths: {
        '/api/things': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { name: { type: 'string', default: 'keep' } } },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Thing: {
            type: 'object',
            properties: { state: { type: 'string', default: 'active' } },
          },
        },
      },
    };
    stripParameterSchemaDefaults(spec);
    assert.equal(
      spec.paths['/api/things'].post.requestBody.content['application/json'].schema.properties.name.default,
      'keep',
    );
    assert.equal(spec.components.schemas.Thing.properties.state.default, 'active');
  });

  it('handles paths with no parameters', () => {
    const spec = {
      paths: {
        '/api/health': {
          get: { responses: { '200': { description: 'ok' } } },
        },
      },
    };
    // Should not throw.
    stripParameterSchemaDefaults(spec);
    assert.ok(spec);
  });

  it('handles a spec with no paths', () => {
    const spec = { components: {} };
    stripParameterSchemaDefaults(spec);
    assert.ok(spec);
  });
});
