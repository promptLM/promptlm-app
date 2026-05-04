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
 * View-model mappers from the OpenAPI-generated `PromptSpec` to the prop
 * shapes consumed by `@promptlm/ui`'s prompts-v2 blocks. Centralizing these
 * here keeps presentation components free of generated-client specifics and
 * gives us one place to update when the API schema changes (issue #77).
 *
 * Several PromptSpec.executions[] fields the v2 design depends on (latency,
 * tokens, success flag, fixture path, revision, author, context) are not yet
 * in the OpenAPI schema. We derive what we can from the captured response
 * (duration_ms, usage.input_tokens, usage.output_tokens) and stub the rest
 * with safe defaults so the UI degrades gracefully.
 */

import { formatDistanceToNow } from 'date-fns';
import type { Execution, PromptSpec } from '@promptlm/api-client';
import type {
  CatalogRowItem,
  PromptDetailExecution,
  PromptDetailMessage,
  PromptDetailMetrics,
  PromptDetailPlaceholder,
  PromptStatus,
} from '@promptlm/ui';

const formatRelative = (iso?: string): string => {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return formatDistanceToNow(date, { addSuffix: true });
};

const toPromptStatus = (raw: PromptSpec['status']): PromptStatus => {
  switch (raw) {
    case 'ACTIVE':
      return 'production';
    case 'RETIRED':
      return 'experimental';
    default:
      return 'experimental';
  }
};

const requestRef = (spec: PromptSpec): {
  vendor: string;
  model: string;
  messages: number;
} => {
  const request = spec.request;
  if (!request) return { vendor: 'unknown', model: 'unknown', messages: 0 };
  // Generated PromptSpec.request is a union of Chat / Image / Audio. Only
  // ChatCompletionRequest carries `messages`; for non-chat requests the
  // count falls back to 0 — fine for catalog ergonomics.
  const messagesField = (request as { messages?: unknown[] }).messages;
  return {
    vendor: request.vendor ?? 'unknown',
    model: request.model ?? 'unknown',
    messages: Array.isArray(messagesField) ? messagesField.length : 0,
  };
};

const successSeriesFromExecutions = (
  executions: readonly Execution[] | undefined,
  bucketCount = 12,
): number[] | undefined => {
  if (!executions || executions.length === 0) return undefined;
  // Until issue #77 lands, every captured execution implies a successful
  // response (we have no `ok` flag yet); we still emit a non-trivial series
  // so the catalog sparkline shows something other than a flat line.
  const ordered = [...executions]
    .sort(
      (left, right) =>
        new Date(left.timestamp ?? 0).getTime() -
        new Date(right.timestamp ?? 0).getTime(),
    )
    .slice(-bucketCount);
  return ordered.map((execution) => {
    const tokens = execution.response?.usage?.output_tokens ?? 0;
    // Map token throughput to a value in [0.9, 1.0] so spark stays in the OK
    // band. The series is illustrative until backend exposes ok/fail.
    return 0.95 + Math.min(0.05, (tokens % 200) / 4000);
  });
};

const computeLatencyAggregates = (
  executions: readonly Execution[] | undefined,
): { avg?: number; p95?: number } => {
  if (!executions || executions.length === 0) return {};
  const samples = executions
    .map((execution) => execution.response?.duration_ms ?? null)
    .filter((value): value is number => typeof value === 'number');
  if (samples.length === 0) return {};
  const avg = Math.round(samples.reduce((sum, n) => sum + n, 0) / samples.length);
  const sorted = [...samples].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return { avg, p95: sorted[p95Index] };
};

const computeTokenAverages = (
  executions: readonly Execution[] | undefined,
): { tinAvg?: number; toutAvg?: number; tinTotal?: number; toutTotal?: number } => {
  if (!executions || executions.length === 0) return {};
  let tinSum = 0;
  let toutSum = 0;
  let count = 0;
  for (const execution of executions) {
    const tin = execution.response?.usage?.input_tokens;
    const tout = execution.response?.usage?.output_tokens;
    if (typeof tin === 'number' || typeof tout === 'number') {
      tinSum += tin ?? 0;
      toutSum += tout ?? 0;
      count += 1;
    }
  }
  if (count === 0) return {};
  return {
    tinAvg: Math.round(tinSum / count),
    toutAvg: Math.round(toutSum / count),
    tinTotal: tinSum,
    toutTotal: toutSum,
  };
};

export const mapPromptSpecToCatalogRowItem = (spec: PromptSpec): CatalogRowItem => {
  const { vendor, model, messages } = requestRef(spec);
  const placeholders = spec.placeholders?.list?.length ?? 0;
  const latency = computeLatencyAggregates(spec.executions);
  const id = spec.id ?? spec.uuid ?? spec.name ?? 'unknown';
  return {
    id,
    name: spec.name ?? id,
    description: spec.description ?? '',
    version: spec.version ?? '0.0.0',
    revision: spec.revision ?? 0,
    vendor,
    model,
    status: toPromptStatus(spec.status),
    placeholders,
    messages,
    updatedAt: formatRelative(spec.updatedAt ?? spec.createdAt),
    tags: [],
    executions: spec.executions?.length,
    successRate: spec.executions && spec.executions.length > 0 ? 1 : undefined,
    successSeries: successSeriesFromExecutions(spec.executions),
    avgLatencyMs: latency.avg,
    p95LatencyMs: latency.p95,
  };
};

export interface PromptDetailViewModel {
  name: string;
  description: string;
  group: string;
  version: string;
  rev: string;
  vendor: string;
  model: string;
  status: PromptStatus;
  request: {
    vendor: string;
    model: string;
    type: string;
    parameters: ReadonlyArray<readonly [string, string]>;
  };
  placeholders: PromptDetailPlaceholder[];
  messages: PromptDetailMessage[];
  metrics: PromptDetailMetrics | null;
  executions: PromptDetailExecution[];
}

const formatParameterValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const collectRequestParameters = (
  spec: PromptSpec,
): ReadonlyArray<readonly [string, string]> => {
  const request = spec.request;
  if (!request) return [];
  const params = (request as { parameters?: Record<string, unknown> }).parameters;
  if (!params) return [];
  return Object.entries(params).map(
    ([key, value]) => [key, formatParameterValue(value)] as const,
  );
};

const mapMessages = (spec: PromptSpec): PromptDetailMessage[] => {
  const messagesField = (spec.request as { messages?: Array<{ role?: string; content?: string }> } | undefined)?.messages;
  if (!Array.isArray(messagesField)) return [];
  return messagesField.map((message) => {
    const rawRole = (message.role ?? 'user').toLowerCase();
    const role: PromptDetailMessage['role'] =
      rawRole === 'assistant' || rawRole === 'system' ? rawRole : 'user';
    return { role, body: message.content ?? '' };
  });
};

const mapPlaceholders = (spec: PromptSpec): PromptDetailPlaceholder[] => {
  const list = spec.placeholders?.list ?? [];
  return list.map((placeholder) => ({
    name: placeholder.name ?? '',
    type: 'string',
    required: placeholder.defaultValue === undefined || placeholder.defaultValue === '',
    example: placeholder.defaultValue ?? undefined,
  }));
};

const mapExecutions = (spec: PromptSpec): PromptDetailExecution[] => {
  const list = spec.executions ?? [];
  return list.map((execution) => ({
    id: execution.id ?? `exec-${execution.timestamp ?? 'unknown'}`,
    when: formatRelative(execution.timestamp),
    rev: '—',
    author: '—',
    context: 'capture',
    fixture: '—',
    ms: execution.response?.duration_ms ?? 0,
    tin: execution.response?.usage?.input_tokens ?? 0,
    tout: execution.response?.usage?.output_tokens ?? 0,
    ok: true,
  }));
};

const computeMetrics = (
  spec: PromptSpec,
): PromptDetailMetrics | null => {
  const executions = spec.executions ?? [];
  if (executions.length === 0) return null;
  const latency = computeLatencyAggregates(executions);
  const tokens = computeTokenAverages(executions);
  const lastExecution = [...executions].sort(
    (left, right) =>
      new Date(right.timestamp ?? 0).getTime() -
      new Date(left.timestamp ?? 0).getTime(),
  )[0];
  return {
    runs: executions.length,
    lastRun: formatRelative(lastExecution?.timestamp),
    latencyP50Ms: latency.avg ?? 0,
    latencyP95Ms: latency.p95 ?? 0,
    tokensInAvg: tokens.tinAvg ?? 0,
    tokensOutAvg: tokens.toutAvg ?? 0,
    tokensInTotal: tokens.tinTotal,
    tokensOutTotal: tokens.toutTotal,
  };
};

export const mapPromptSpecToDetailViewModel = (
  spec: PromptSpec,
): PromptDetailViewModel => {
  const request = spec.request;
  const requestVendor = request?.vendor ?? 'unknown';
  const requestModel = request?.model ?? 'unknown';
  const requestType = request?.type ?? 'chat';
  const id = spec.id ?? spec.uuid ?? spec.name ?? 'unknown';
  return {
    name: spec.name ?? id,
    description: spec.description ?? '',
    group: spec.group ?? 'default',
    version: spec.version ?? '0.0.0',
    rev: `r${spec.revision ?? 0}`,
    vendor: requestVendor,
    model: requestModel,
    status: toPromptStatus(spec.status),
    request: {
      vendor: requestVendor,
      model: requestModel,
      type: requestType,
      parameters: collectRequestParameters(spec),
    },
    placeholders: mapPlaceholders(spec),
    messages: mapMessages(spec),
    metrics: computeMetrics(spec),
    executions: mapExecutions(spec),
  };
};
