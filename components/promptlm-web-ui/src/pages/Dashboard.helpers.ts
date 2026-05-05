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

import { formatDistanceToNowStrict } from 'date-fns';
import type { Execution, PromptSpec } from '@promptlm/api-client';

export type FeedKind = 'release' | 'run' | 'draft' | 'create';

export type FeedFilterKind = 'all' | FeedKind;

export type FeedItem = {
  key: string;
  kind: FeedKind;
  /** Pre-formatted relative duration ("3m", "2h", "yesterday"). */
  when: string;
  /** Raw timestamp in ms — used for time-window filtering. */
  ts: number;
  prompt: string;
  group?: string;
  promptId?: string;
  to?: string;
  from?: string;
  summary?: string;
  status?: 'ok' | 'fail';
};

export type OpenWorkItem = {
  key: string;
  kind: 'draft' | 'untested' | 'retired';
  prompt: string;
  promptId?: string;
  note: string;
  cta: string;
  href?: string;
};

export type TimeWindow = '24h' | '7d' | 'all';

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  '24h': 'last 24h',
  '7d': 'last 7 days',
  all: 'all time',
};

export const FEED_FILTER_LABELS: Record<FeedFilterKind, string> = {
  all: 'all',
  release: 'releases',
  run: 'runs',
  draft: 'drafts',
  create: 'created',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const windowToMs = (window: TimeWindow): number | null => {
  switch (window) {
    case '24h':
      return ONE_DAY_MS;
    case '7d':
      return 7 * ONE_DAY_MS;
    case 'all':
      return null;
  }
};

export const safeRelative = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return formatDistanceToNowStrict(date, { addSuffix: false });
};

export const buildActivityFeed = (
  prompts: readonly PromptSpec[],
): FeedItem[] => {
  const items: FeedItem[] = [];
  for (const spec of prompts) {
    const promptName = spec.name ?? spec.id ?? 'unnamed';
    const promptId = spec.id ?? spec.name;
    const group = spec.group;

    if (spec.updatedAt) {
      const ts = new Date(spec.updatedAt).getTime();
      const isDraft = (spec.revision ?? 0) > 0;
      const isRetired = spec.status === 'RETIRED';
      if (!isRetired) {
        items.push({
          key: `${promptId}:edit`,
          kind: isDraft ? 'draft' : 'release',
          ts: Number.isNaN(ts) ? 0 : ts,
          when: safeRelative(spec.updatedAt),
          prompt: promptName,
          promptId,
          group,
          to: isDraft ? undefined : spec.version,
          summary: isDraft
            ? `revision ${spec.revision ?? 1} · not yet released`
            : 'released',
        });
      }
    }

    const executions: readonly Execution[] = spec.executions ?? [];
    for (const [index, run] of executions.entries()) {
      const ts = run.timestamp ? new Date(run.timestamp).getTime() : 0;
      items.push({
        key: `${promptId}:run:${run.id ?? run.timestamp ?? index}`,
        kind: 'run',
        ts: Number.isNaN(ts) ? 0 : ts,
        when: safeRelative(run.timestamp),
        prompt: promptName,
        promptId,
        group,
        // Until #77 ships an `ok` flag on Execution we treat the presence of
        // a captured response as success and missing response as failure.
        status: run.response ? 'ok' : 'fail',
        summary: 'execution recorded',
      });
    }
  }
  items.sort((a, b) => b.ts - a.ts);
  return items;
};

export const filterFeed = (
  items: readonly FeedItem[],
  kind: FeedFilterKind,
  window: TimeWindow,
  now: number = Date.now(),
): FeedItem[] => {
  const cutoff = windowToMs(window);
  return items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false;
    if (cutoff !== null && item.ts > 0 && now - item.ts > cutoff) return false;
    return true;
  });
};

export const buildOpenWork = (
  prompts: readonly PromptSpec[],
  limit = 4,
): OpenWorkItem[] => {
  const items: OpenWorkItem[] = [];
  for (const spec of prompts) {
    const promptName = spec.name ?? spec.id ?? 'unnamed';
    const promptId = spec.id ?? spec.name;
    const executions = spec.executions ?? [];
    if (spec.status === 'RETIRED') continue;

    if ((spec.revision ?? 0) > 0) {
      items.push({
        key: `${promptId}:draft`,
        kind: 'draft',
        prompt: promptName,
        promptId,
        note: `Draft on revision ${spec.revision} · not released`,
        cta: 'Open in editor',
        href: promptId
          ? `/prompts/${encodeURIComponent(promptId)}/edit`
          : undefined,
      });
      continue;
    }

    if (executions.length === 0) {
      items.push({
        key: `${promptId}:untested`,
        kind: 'untested',
        prompt: promptName,
        promptId,
        note: 'Never run · no executions captured',
        cta: 'Open prompt',
        href: promptId ? `/prompts/${encodeURIComponent(promptId)}` : undefined,
      });
    }
  }
  return items.slice(0, limit);
};

export const findLastRelease = (
  prompts: readonly PromptSpec[],
): { ref: string; when: string } | null => {
  let best: { ts: number; spec: PromptSpec } | null = null;
  for (const spec of prompts) {
    if (spec.status === 'RETIRED') continue;
    if ((spec.revision ?? 0) > 0) continue;
    if (!spec.updatedAt) continue;
    const ts = new Date(spec.updatedAt).getTime();
    if (Number.isNaN(ts)) continue;
    if (!best || ts > best.ts) {
      best = { ts, spec };
    }
  }
  if (!best) return null;
  const name = best.spec.name ?? best.spec.id ?? 'prompt';
  const version = best.spec.version ? ` · ${best.spec.version}` : '';
  return {
    ref: `${name}${version}`,
    when: `${safeRelative(best.spec.updatedAt)} ago`,
  };
};

export const buildGroupCounts = (
  countByGroup: Record<string, number> | undefined,
  fallbackPrompts: readonly PromptSpec[],
): Array<[string, number]> => {
  if (countByGroup) {
    return Object.entries(countByGroup).sort((a, b) => b[1] - a[1]);
  }
  const fallback = new Map<string, number>();
  for (const spec of fallbackPrompts) {
    const key = spec.group ?? 'ungrouped';
    fallback.set(key, (fallback.get(key) ?? 0) + 1);
  }
  return Array.from(fallback.entries()).sort((a, b) => b[1] - a[1]);
};
