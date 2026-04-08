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

import { describe, expect, it } from 'vitest';

import { ApiError } from '@promptlm/api-client';
import { apiErrorToI18n, toDisplayError } from '@api-common/apiError';

const createApiError = (body: unknown, status = 400) =>
  new ApiError(
    {
      method: 'POST',
      url: '/api/prompts',
      path: '/api/prompts',
    } as never,
    {
      url: 'http://localhost:8080/api/prompts',
      ok: false,
      status,
      statusText: 'Bad Request',
      body,
    } as never,
    'Bad Request',
  );

describe('apiErrorToI18n', () => {
  it('uses problem detail when present', () => {
    const result = apiErrorToI18n(
      createApiError({
        detail: 'name and group must not be blank',
      }),
    );

    expect(result).toMatchObject({
      code: 'unknown',
      messageKey: 'error.http.400',
      message: 'name and group must not be blank',
      status: 400,
    });
  });

  it('prefers structured validation messages over generic problem detail text', () => {
    const result = apiErrorToI18n(
      createApiError({
        detail: 'Validation failed',
        properties: {
          violations: [
            { field: 'name', message: 'must not be blank' },
            { path: 'messages[0].content', message: 'must not be blank' },
          ],
        },
      }),
    );

    expect(result.message).toBe('name: must not be blank; messages[0].content: must not be blank');
  });
});

describe('toDisplayError', () => {
  it('returns a normalized Error with i18n metadata', () => {
    const error = toDisplayError(
      createApiError({
        properties: {
          code: 'prompt.validation_failed',
          errors: ['name must not be blank'],
        },
      }),
    ) as Error & { i18n?: { code: string; messageKey: string } };

    expect(error.message).toBe('name must not be blank');
    expect(error.i18n).toMatchObject({
      code: 'prompt.validation_failed',
      messageKey: 'error.prompt.validation_failed',
    });
  });
});
