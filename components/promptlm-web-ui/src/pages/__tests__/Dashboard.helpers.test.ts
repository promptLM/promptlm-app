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
import type { PromptSpec } from '@promptlm/api-client';
import {
  buildActivityFeed,
  buildGroupCounts,
  buildOpenWork,
  filterFeed,
  findLastRelease,
} from '../Dashboard.helpers';

const NOW = new Date('2026-05-06T12:00:00Z').getTime();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(NOW - h * 60 * 60_000).toISOString();
const daysAgo = (d: number) => new Date(NOW - d * 24 * 60 * 60_000).toISOString();

const mkSpec = (overrides: Partial<PromptSpec> = {}): PromptSpec => ({
  id: overrides.id ?? overrides.name ?? 'test-prompt',
  name: overrides.name ?? overrides.id ?? 'test-prompt',
  group: 'test',
  status: 'ACTIVE',
  revision: 0,
  ...overrides,
});

describe('buildActivityFeed', () => {
  it('emits a release row for an active spec with no draft revision', () => {
    const items = buildActivityFeed([
      mkSpec({ name: 'p1', updatedAt: hoursAgo(1), version: '1.2.0' }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'release',
      prompt: 'p1',
      to: '1.2.0',
      summary: 'released',
    });
  });

  it('emits a draft row when revision > 0', () => {
    const items = buildActivityFeed([
      mkSpec({ name: 'p2', updatedAt: hoursAgo(2), revision: 3 }),
    ]);
    expect(items[0].kind).toBe('draft');
    expect(items[0].to).toBeUndefined();
    expect(items[0].summary).toContain('revision 3');
  });

  it('skips retired prompts entirely', () => {
    const items = buildActivityFeed([
      mkSpec({ name: 'old', status: 'RETIRED', updatedAt: hoursAgo(1) }),
    ]);
    expect(items).toHaveLength(0);
  });

  it('emits run rows for executions and infers ok/fail from response presence', () => {
    const items = buildActivityFeed([
      mkSpec({
        name: 'r1',
        updatedAt: hoursAgo(5),
        executions: [
          { id: 'e-ok', timestamp: minutesAgo(10), response: { id: 'x' } as never },
          { id: 'e-fail', timestamp: minutesAgo(20) },
        ],
      }),
    ]);
    const runs = items.filter((i) => i.kind === 'run');
    expect(runs).toHaveLength(2);
    const byId = Object.fromEntries(runs.map((r) => [r.key.split(':').pop(), r.status]));
    expect(byId['e-ok']).toBe('ok');
    expect(byId['e-fail']).toBe('fail');
  });

  it('sorts items newest first across all kinds', () => {
    const items = buildActivityFeed([
      mkSpec({
        name: 'mix',
        updatedAt: hoursAgo(3),
        version: '1.0.0',
        executions: [
          { id: 'old', timestamp: hoursAgo(10), response: { id: 'r' } as never },
          { id: 'new', timestamp: minutesAgo(5), response: { id: 'r' } as never },
        ],
      }),
    ]);
    expect(items.map((i) => i.key.split(':').pop())).toEqual(['new', 'edit', 'old']);
  });
});

describe('filterFeed', () => {
  const fixture = buildActivityFeed([
    mkSpec({
      name: 'a',
      updatedAt: minutesAgo(30),
      version: '1.0.0',
      executions: [
        { id: 'r-recent', timestamp: minutesAgo(15), response: { id: 'x' } as never },
        { id: 'r-old', timestamp: daysAgo(3), response: { id: 'x' } as never },
      ],
    }),
    mkSpec({ name: 'b', updatedAt: daysAgo(10), revision: 2 }),
  ]);

  it('filters by kind', () => {
    const releases = filterFeed(fixture, 'release', 'all', NOW);
    expect(releases.every((i) => i.kind === 'release')).toBe(true);
    expect(releases).toHaveLength(1);
  });

  it('filters by 24h window', () => {
    const within24h = filterFeed(fixture, 'all', '24h', NOW);
    // Drops the 3-day-old run and the 10-day-old draft
    expect(within24h.map((i) => i.key.includes('r-recent') || i.key.includes('a:edit'))).toEqual([
      true,
      true,
    ]);
  });

  it('returns everything when window is "all"', () => {
    const everything = filterFeed(fixture, 'all', 'all', NOW);
    expect(everything).toHaveLength(fixture.length);
  });

  it('combines kind + window filters', () => {
    const recentRuns = filterFeed(fixture, 'run', '24h', NOW);
    expect(recentRuns).toHaveLength(1);
    expect(recentRuns[0].key).toContain('r-recent');
  });
});

describe('buildOpenWork', () => {
  it('classifies revision > 0 as a draft with edit link', () => {
    const items = buildOpenWork([
      mkSpec({ id: 'd1', name: 'd1', revision: 1 }),
    ]);
    expect(items[0]).toMatchObject({
      kind: 'draft',
      cta: 'Open in editor',
      href: '/prompts/d1/edit',
    });
  });

  it('classifies a released prompt with no executions as untested', () => {
    const items = buildOpenWork([
      mkSpec({ id: 'u1', name: 'u1', revision: 0, executions: [] }),
    ]);
    expect(items[0]).toMatchObject({
      kind: 'untested',
      cta: 'Open prompt',
      href: '/prompts/u1',
    });
  });

  it('skips retired prompts and respects the limit', () => {
    const items = buildOpenWork(
      [
        mkSpec({ id: 'r1', status: 'RETIRED', revision: 5 }),
        ...Array.from({ length: 8 }, (_, i) =>
          mkSpec({ id: `u${i}`, name: `u${i}`, revision: 0, executions: [] }),
        ),
      ],
      3,
    );
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.kind === 'untested')).toBe(true);
  });
});

describe('findLastRelease', () => {
  it('picks the most recently updated released (non-draft, non-retired) prompt', () => {
    const last = findLastRelease([
      mkSpec({ name: 'old', updatedAt: daysAgo(5), version: '1.0.0' }),
      mkSpec({ name: 'newest', updatedAt: hoursAgo(1), version: '2.0.0' }),
      mkSpec({ name: 'draft', updatedAt: minutesAgo(10), revision: 1 }),
      mkSpec({ name: 'retired', updatedAt: minutesAgo(5), status: 'RETIRED' }),
    ]);
    expect(last?.ref).toContain('newest');
    expect(last?.ref).toContain('2.0.0');
  });

  it('returns null when there are no releasable prompts', () => {
    expect(findLastRelease([mkSpec({ revision: 1 })])).toBeNull();
    expect(findLastRelease([])).toBeNull();
  });
});

describe('buildGroupCounts', () => {
  it('uses countByGroup when present, sorted descending', () => {
    const counts = buildGroupCounts({ rag: 5, support: 2, agents: 8 }, []);
    expect(counts).toEqual([
      ['agents', 8],
      ['rag', 5],
      ['support', 2],
    ]);
  });

  it('falls back to deriving counts from prompts when stats absent', () => {
    const counts = buildGroupCounts(undefined, [
      mkSpec({ id: '1', group: 'rag' }),
      mkSpec({ id: '2', group: 'rag' }),
      mkSpec({ id: '3', group: 'support' }),
      mkSpec({ id: '4', group: undefined }),
    ]);
    expect(counts).toEqual([
      ['rag', 2],
      ['support', 1],
      ['ungrouped', 1],
    ]);
  });
});
