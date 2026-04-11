import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import asyncApiSpecs from '@asyncapi/specs';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const specPath = path.join(workspaceRoot, 'spec/asyncapi/store-status.asyncapi.yaml');
const { schemas: asyncApiSchemas } = asyncApiSpecs;

const source = await readFile(specPath, 'utf8');
const document = YAML.parse(source);
const schema = asyncApiSchemas['3.0.0'];

if (!document || typeof document !== 'object') {
  throw new Error(`AsyncAPI validation failed for ${specPath}\nDocument must be a YAML object`);
}

const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  meta: false,
  strict: false,
});

addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(document);

const formatError = (error) => {
  const location = error.instancePath || '(root)';
  return `${location} ${error.message}`.trim();
};

if (!valid) {
  const messages = (validate.errors ?? []).map(formatError).join('\n');
  throw new Error(`AsyncAPI validation failed for ${specPath}\n${messages}`);
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`AsyncAPI validation failed for ${specPath}\n${message}`);
  }
};

assert(document.asyncapi === '3.0.0', 'Expected `asyncapi: 3.0.0`');
assert(document.channels?.storeStatus?.address === '/api/store/events/{operationId}', 'Expected storeStatus channel at `/api/store/events/{operationId}`');
assert(document.operations?.receiveStoreStatus?.action === 'receive', 'Expected `receiveStoreStatus` operation with `receive` action');
assert(document.components?.messages?.StoreStatusEvent?.name === 'status', 'Expected `StoreStatusEvent` message to emit SSE event name `status`');

console.log(`Validated AsyncAPI spec: ${path.relative(workspaceRoot, specPath)}`);
