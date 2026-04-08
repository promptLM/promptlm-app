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

import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { OpenAPI } from '@promptlm/api-client';
import {
  GeneratedApiClientProvider,
  useGeneratedApiClient,
  configureGeneratedApiClient,
} from '@api-common/generatedClientProvider';

const resetOpenApiConfig = () => {
  OpenAPI.BASE = 'http://localhost:9090';
  OpenAPI.TOKEN = undefined;
  OpenAPI.HEADERS = undefined;
};

afterEach(() => {
  resetOpenApiConfig();
  vi.resetAllMocks();
});

describe('configureGeneratedApiClient', () => {
  it('applies provided baseUrl, token and headers', () => {
    const baseUrl = 'http://example.com';
    const token = 'test-token';
    const headers = { 'X-Test': '1' };

    configureGeneratedApiClient({ baseUrl, token, headers });

    expect(OpenAPI.BASE).toBe(baseUrl);
    expect(OpenAPI.TOKEN).toBe(token);
    expect(OpenAPI.HEADERS).toEqual(headers);
  });

  it('falls back to window.location.origin when baseUrl not provided', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error jsdom-less environment
    globalThis.window = { location: { origin: 'http://from-window' } } as Window;

    configureGeneratedApiClient();

    expect(OpenAPI.BASE).toBe('http://from-window');

    globalThis.window = originalWindow;
  });
});

describe('GeneratedApiClientProvider', () => {
  it('provides services to consumers', () => {
    const Consumer: React.FC = () => {
      const services = useGeneratedApiClient();
      expect(services.promptSpecs).toBeDefined();
      expect(services.promptStore).toBeDefined();
      expect(services.capabilities).toBeDefined();
      expect(services.modelCatalog).toBeDefined();
      return null;
    };

    renderToString(
      <GeneratedApiClientProvider config={{ baseUrl: 'http://consumer-base' }}>
        <Consumer />
      </GeneratedApiClientProvider>,
    );

    expect(OpenAPI.BASE).toBe('http://consumer-base');
  });
});
