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

import { ApiError } from '@promptlm/api-client';

export type ApiErrorI18n = {
  code: string;
  messageKey: string;
  message?: string;
  params?: Record<string, string | number>;
  status?: number;
};

type ProblemDetail = {
  title?: string;
  detail?: string;
  status?: number;
  properties?: Record<string, unknown>;
};

type ProblemValidationEntry = {
  field?: string;
  path?: string;
  name?: string;
  message?: string;
  detail?: string;
  defaultMessage?: string;
  reason?: string;
};

const toProblemDetail = (body: unknown): ProblemDetail | null => {
  if (!body || typeof body !== 'object') {
    return null;
  }
  return body as ProblemDetail;
};

const readProblemCode = (problem: ProblemDetail | null): string | undefined => {
  if (!problem) {
    return undefined;
  }
  const properties = problem.properties ?? {};
  const code = properties.code ?? (properties as Record<string, unknown>).errorCode;
  if (typeof code === 'string' && code.trim().length > 0) {
    return code.trim();
  }
  return undefined;
};

const toProblemValidationEntry = (value: unknown): ProblemValidationEntry | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as ProblemValidationEntry;
};

const normalizeValidationMessage = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const entry = toProblemValidationEntry(value);
  if (!entry) {
    return undefined;
  }

  const field = entry.field ?? entry.path ?? entry.name;
  const message = entry.message ?? entry.detail ?? entry.defaultMessage ?? entry.reason;
  const normalizedMessage = normalizeValidationMessage(message);
  if (!normalizedMessage) {
    return undefined;
  }

  const normalizedField = normalizeValidationMessage(field);
  return normalizedField ? `${normalizedField}: ${normalizedMessage}` : normalizedMessage;
};

const readProblemValidationMessages = (problem: ProblemDetail | null): string[] => {
  if (!problem) {
    return [];
  }

  const candidates = [
    problem.properties?.errors,
    problem.properties?.violations,
    problem.properties?.fieldErrors,
    problem.properties?.messages,
  ];

  const uniqueMessages = new Set<string>();
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    for (const item of candidate) {
      const message = normalizeValidationMessage(item);
      if (message) {
        uniqueMessages.add(message);
      }
    }
  }

  return Array.from(uniqueMessages);
};

export const apiErrorToI18n = (error: unknown): ApiErrorI18n => {
  const fallbackMessage = error instanceof Error ? error.message : undefined;

  if (error instanceof ApiError) {
    const problem = toProblemDetail(error.body);
    const code = readProblemCode(problem);
    const status = error.status;
    const validationMessages = readProblemValidationMessages(problem);
    const message =
      (validationMessages.length > 0 ? validationMessages.join('; ') : undefined) ??
      problem?.detail ??
      problem?.title ??
      error.message;
    const messageKey = code ? `error.${code}` : status ? `error.http.${status}` : 'error.unknown';

    return {
      code: code ?? 'unknown',
      messageKey,
      message,
      status,
    };
  }

  const status = (error as { status?: number } | undefined)?.status;
  const messageKey = status ? `error.http.${status}` : 'error.unknown';

  return {
    code: 'unknown',
    messageKey,
    message: fallbackMessage,
    status,
  };
};

export const toDisplayError = (error: unknown): Error => {
  const i18n = apiErrorToI18n(error);
  const message = i18n.message ?? i18n.messageKey;
  const normalized = new Error(message);
  (normalized as { i18n?: ApiErrorI18n }).i18n = i18n;
  return normalized;
};
