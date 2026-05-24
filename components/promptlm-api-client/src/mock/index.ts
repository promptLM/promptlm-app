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
 * Barrel for the OpenAPI-driven mock backend. Consumers can import via the
 * package root (`@promptlm/api-client`) or via this subpath when they only
 * want the mock pieces:
 *
 *     import { createMockBackend } from '@promptlm/api-client/mock';
 *
 * Re-exported in `src/index.ts` so the root entrypoint sees both the
 * generated client and the mock surface.
 */

export { createMockBackend, type MockBackend, type RouteMatch } from './factory';
export { MockBackendState, type CallLogEntry, type FailureInjection } from './state';
export {
  MockContractViolation,
  createSchemaValidator,
  type SchemaValidator,
} from './schema-validate';
export {
  defaultLlmCanned,
} from './llm';
export {
  buildSeedCapabilities,
  buildSeedModelCatalog,
  buildSeedOwners,
} from './defaults';
export type {
  MockHandler,
  MockResponse,
  MockRouteContext,
} from './handler-types';
export { defaultHandlers, type DefaultHandlers } from '../generated/mock/handlers';
export {
  operationIndex,
  type OperationDescriptor,
} from '../generated/mock/operation-index';
export { exampleResponses, type ExampleResponses } from '../generated/mock/example-responses';
