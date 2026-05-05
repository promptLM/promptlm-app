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

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { Mono } from '@promptlm/ui';
import type { Execution, PromptSpec } from '@promptlm/api-client';
import { useDashboardSummary, usePrompts } from '@/api/hooks';

type FeedItem = {
  key: string;
  kind: 'release' | 'run' | 'draft' | 'create';
  when: string;
  prompt: string;
  group?: string;
  promptId?: string;
  to?: string;
  from?: string;
  summary?: string;
  status?: 'ok' | 'fail';
};

type OpenWorkItem = {
  key: string;
  kind: 'draft' | 'untested' | 'retired';
  prompt: string;
  promptId?: string;
  note: string;
  cta: string;
  href?: string;
};

const ACTIVITY_LIMIT = 10;
const OPEN_WORK_LIMIT = 4;

const safeRelative = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return formatDistanceToNowStrict(date, { addSuffix: false });
};

const buildSortedFeed = (prompts: readonly PromptSpec[]): FeedItem[] => {
  type Carrier = { item: FeedItem; ts: number };
  const carriers: Carrier[] = [];
  for (const spec of prompts) {
    const promptName = spec.name ?? spec.id ?? 'unnamed';
    const promptId = spec.id ?? spec.name;
    const group = spec.group;

    if (spec.updatedAt) {
      const ts = new Date(spec.updatedAt).getTime();
      const isDraft = (spec.revision ?? 0) > 0;
      const isRetired = spec.status === 'RETIRED';
      if (!isRetired) {
        carriers.push({
          ts: Number.isNaN(ts) ? 0 : ts,
          item: {
            key: `${promptId}:edit`,
            kind: isDraft ? 'draft' : 'release',
            when: safeRelative(spec.updatedAt),
            prompt: promptName,
            promptId,
            group,
            to: isDraft ? undefined : spec.version,
            summary: isDraft
              ? `revision ${spec.revision ?? 1} · not yet released`
              : 'released',
          },
        });
      }
    }

    const executions: readonly Execution[] = spec.executions ?? [];
    for (const run of executions) {
      const ts = run.timestamp ? new Date(run.timestamp).getTime() : 0;
      carriers.push({
        ts: Number.isNaN(ts) ? 0 : ts,
        item: {
          key: `${promptId}:run:${run.id ?? run.timestamp ?? carriers.length}`,
          kind: 'run',
          when: safeRelative(run.timestamp),
          prompt: promptName,
          promptId,
          group,
          status: run.response ? 'ok' : 'fail',
          summary: 'execution recorded',
        },
      });
    }
  }
  carriers.sort((a, b) => b.ts - a.ts);
  return carriers.slice(0, ACTIVITY_LIMIT).map((c) => c.item);
};

const buildOpenWork = (prompts: readonly PromptSpec[]): OpenWorkItem[] => {
  const items: OpenWorkItem[] = [];
  for (const spec of prompts) {
    const promptName = spec.name ?? spec.id ?? 'unnamed';
    const promptId = spec.id ?? spec.name;
    const executions = spec.executions ?? [];
    const isRetired = spec.status === 'RETIRED';
    if (isRetired) continue;

    if ((spec.revision ?? 0) > 0) {
      items.push({
        key: `${promptId}:draft`,
        kind: 'draft',
        prompt: promptName,
        promptId,
        note: `Draft on revision ${spec.revision} · not released`,
        cta: 'Open in editor',
        href: promptId ? `/prompts/${encodeURIComponent(promptId)}/edit` : undefined,
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
  return items.slice(0, OPEN_WORK_LIMIT);
};

const findLastRelease = (prompts: readonly PromptSpec[]): {
  ref: string;
  when: string;
} | null => {
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
    when: safeRelative(best.spec.updatedAt) + ' ago',
  };
};

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--pl-mono)',
  fontSize: 10.5,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--pl-ink-500)',
};

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span style={eyebrowStyle}>{children}</span>
);

const dotForKind = (item: FeedItem): { glyph: string; color: string } => {
  switch (item.kind) {
    case 'release':
      return { glyph: '◆', color: 'var(--pl-signal-deep)' };
    case 'run':
      return item.status === 'fail'
        ? { glyph: '✕', color: 'var(--pl-fail)' }
        : { glyph: '▷', color: 'var(--pl-ink-700)' };
    case 'draft':
      return { glyph: '◐', color: 'var(--pl-ink-600)' };
    case 'create':
      return { glyph: '+', color: 'var(--pl-ink-600)' };
    default:
      return { glyph: '·', color: 'var(--pl-ink-500)' };
  }
};

const ActivityRow = ({ item, onClick }: {
  item: FeedItem;
  onClick?: () => void;
}) => {
  const dot = dotForKind(item);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 18px 1fr',
        alignItems: 'baseline',
        gap: 14,
        padding: '14px 0',
        borderTop: '1px solid var(--pl-ink-200)',
        background: 'transparent',
        border: 'none',
        borderTopColor: 'var(--pl-ink-200)',
        borderTopStyle: 'solid',
        borderTopWidth: 1,
        width: '100%',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--pl-display)',
      }}
    >
      <Mono size={11.5} color="var(--pl-ink-500)" style={{ textAlign: 'right' }}>
        {item.when}
      </Mono>
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          color: dot.color,
          lineHeight: 1,
          display: 'inline-flex',
          justifyContent: 'center',
        }}
      >
        {dot.glyph}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Mono size={13.5} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
            {item.prompt}
          </Mono>
          {item.group && (
            <Mono size={11.5} color="var(--pl-ink-500)">
              {item.group}
            </Mono>
          )}
          {item.kind === 'release' && item.to && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--pl-ink-400)', fontSize: 11 }}>→</span>
              <Mono size={11.5} color="var(--pl-signal-deep)" style={{ fontWeight: 500 }}>
                {item.to}
              </Mono>
            </span>
          )}
        </div>
        {item.summary && (
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color: 'var(--pl-ink-700)',
              lineHeight: 1.5,
            }}
          >
            {item.summary}
          </div>
        )}
      </div>
    </button>
  );
};

const GroupChip = ({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 6,
      padding: '4px 9px',
      borderRadius: 999,
      background: 'var(--pl-paper)',
      border: '1px solid var(--pl-ink-200)',
      cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'var(--pl-display)',
    }}
  >
    <Mono size={12} color="var(--pl-ink-800)" style={{ fontWeight: 500 }}>
      {label}
    </Mono>
    <Mono size={11} color="var(--pl-ink-500)">
      {count}
    </Mono>
  </button>
);

const OpenWorkRow = ({ item, onClick }: { item: OpenWorkItem; onClick?: () => void }) => {
  const tone = (() => {
    switch (item.kind) {
      case 'draft':
        return { glyph: '◐', color: 'var(--pl-ink-600)' };
      case 'untested':
        return { glyph: '?', color: 'var(--pl-ink-600)' };
      case 'retired':
        return { glyph: '·', color: 'var(--pl-ink-500)' };
      default:
        return { glyph: '·', color: 'var(--pl-ink-500)' };
    }
  })();
  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--pl-ink-200)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 12,
            color: tone.color,
            width: 14,
          }}
        >
          {tone.glyph}
        </span>
        <Mono size={13} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
          {item.prompt}
        </Mono>
      </div>
      <div
        style={{
          marginLeft: 22,
          marginTop: 4,
          fontSize: 12.5,
          color: 'var(--pl-ink-700)',
          lineHeight: 1.5,
        }}
      >
        {item.note}
      </div>
      {onClick && (
        <div style={{ marginLeft: 22, marginTop: 6 }}>
          <button
            type="button"
            onClick={onClick}
            style={{
              fontFamily: 'var(--pl-display)',
              fontSize: 12.5,
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: 'var(--pl-signal-deep)',
              cursor: 'pointer',
              borderBottom: '1px solid var(--pl-signal-deep)',
            }}
          >
            {item.cta} →
          </button>
        </div>
      )}
    </div>
  );
};

const SkeletonRow = ({ width, inline }: { width: string; inline?: boolean }) => (
  <div
    style={{
      height: 14,
      width,
      background: 'var(--pl-ink-200)',
      borderRadius: 3,
      margin: inline ? 0 : '10px 0',
      display: inline ? 'inline-block' : 'block',
    }}
  />
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: isStatsLoading, error: statsError } = useDashboardSummary();
  const { data: prompts, isLoading: isPromptsLoading, error: promptsError } = usePrompts();

  const promptList = useMemo(() => prompts ?? [], [prompts]);

  const groupCounts = useMemo<Array<[string, number]>>(() => {
    if (stats?.countByGroup) {
      return Object.entries(stats.countByGroup).sort((a, b) => b[1] - a[1]);
    }
    const fallback = new Map<string, number>();
    for (const spec of promptList) {
      const key = spec.group ?? 'ungrouped';
      fallback.set(key, (fallback.get(key) ?? 0) + 1);
    }
    return Array.from(fallback.entries()).sort((a, b) => b[1] - a[1]);
  }, [stats, promptList]);

  const feed = useMemo(() => buildSortedFeed(promptList), [promptList]);
  const openWork = useMemo(() => buildOpenWork(promptList), [promptList]);
  const lastRelease = useMemo(() => findLastRelease(promptList), [promptList]);

  const totalPrompts = stats?.totalPrompts ?? promptList.length;
  const activePrompts =
    stats?.activePrompts ??
    promptList.filter((p) => p.status !== 'RETIRED').length;
  const retiredPrompts =
    stats?.retiredPrompts ??
    promptList.filter((p) => p.status === 'RETIRED').length;

  const hasError = Boolean(statsError || promptsError);

  return (
    <div
      style={{
        background: 'var(--pl-canvas)',
        minHeight: '100%',
        padding: '32px 32px 64px',
        fontFamily: 'var(--pl-display)',
      }}
    >
      {hasError && (
        <div
          role="alert"
          style={{
            border: '1px solid var(--pl-fail)',
            color: 'var(--pl-fail)',
            background: 'oklch(0.66 0.18 25 / 0.06)',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          {statsError && <div>Failed to load corpus stats: {statsError.message}</div>}
          {promptsError && <div>Failed to load prompts: {promptsError.message}</div>}
        </div>
      )}

      <header style={{ marginBottom: 28 }}>
        <Eyebrow>repo overview</Eyebrow>
        <h1
          style={{
            margin: '4px 0 8px',
            fontFamily: 'var(--pl-display)',
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--pl-ink-900)',
          }}
        >
          What changed
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--pl-ink-600)',
            lineHeight: 1.55,
            maxWidth: 820,
          }}
        >
          <Mono size={13} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
            {totalPrompts}
          </Mono>{' '}
          prompts ·{' '}
          <Mono size={13} color="var(--pl-ink-700)">
            {activePrompts}
          </Mono>{' '}
          active ·{' '}
          <Mono size={13} color="var(--pl-ink-600)">
            {retiredPrompts}
          </Mono>{' '}
          retired
          {lastRelease && (
            <>
              {' '}· last release{' '}
              <Mono size={13} color="var(--pl-signal-deep)">
                {lastRelease.when}
              </Mono>{' '}
              — <Mono size={13} color="var(--pl-ink-700)">{lastRelease.ref}</Mono>
            </>
          )}
        </p>

        {/* Group strip — jump to filtered catalog. One-shot orientation, not a permanent rail. */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
          }}
        >
          <Eyebrow>groups</Eyebrow>
          {isStatsLoading && groupCounts.length === 0 ? (
            <>
              <SkeletonRow width="64px" inline />
              <SkeletonRow width="56px" inline />
              <SkeletonRow width="72px" inline />
            </>
          ) : groupCounts.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--pl-ink-500)' }}>none yet</span>
          ) : (
            groupCounts.map(([label, count]) => (
              <GroupChip
                key={label}
                label={label}
                count={count}
                onClick={() => navigate(`/prompts?group=${encodeURIComponent(label)}`)}
              />
            ))
          )}
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 300px)',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* Center — activity feed */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <Eyebrow>recent activity</Eyebrow>
            <a
              href="/prompts"
              style={{
                fontSize: 12.5,
                color: 'var(--pl-ink-600)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--pl-ink-300)',
                paddingBottom: 1,
              }}
            >
              All prompts →
            </a>
          </div>
          {isPromptsLoading && feed.length === 0 ? (
            <div style={{ paddingTop: 8 }}>
              <SkeletonRow width="55%" />
              <SkeletonRow width="70%" />
              <SkeletonRow width="60%" />
              <SkeletonRow width="65%" />
            </div>
          ) : feed.length === 0 ? (
            <div
              style={{
                marginTop: 16,
                padding: '32px 28px',
                border: '1px dashed var(--pl-ink-300)',
                borderRadius: 8,
                color: 'var(--pl-ink-600)',
                fontSize: 13.5,
                lineHeight: 1.6,
              }}
            >
              No activity yet. Create a prompt or run an existing one to see it
              show up here.
            </div>
          ) : (
            <div>
              {feed.map((item) => (
                <ActivityRow
                  key={item.key}
                  item={item}
                  onClick={
                    item.promptId
                      ? () => navigate(`/prompts/${encodeURIComponent(item.promptId!)}`)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Right rail — open work */}
        <aside style={{ position: 'sticky', top: 28 }}>
          <Eyebrow>open work</Eyebrow>
          <p
            style={{
              margin: '6px 0 4px',
              fontSize: 12.5,
              color: 'var(--pl-ink-600)',
              lineHeight: 1.5,
            }}
          >
            Things you (or your team) probably want to finish.
          </p>
          <div>
            {openWork.length === 0 ? (
              <div
                style={{
                  padding: '14px 0',
                  borderTop: '1px solid var(--pl-ink-200)',
                  fontSize: 13,
                  color: 'var(--pl-ink-500)',
                }}
              >
                Nothing open right now.
              </div>
            ) : (
              openWork.map((item) => (
                <OpenWorkRow
                  key={item.key}
                  item={item}
                  onClick={
                    item.href
                      ? () => navigate(item.href!)
                      : undefined
                  }
                />
              ))
            )}
          </div>

          <div style={{ height: 1, background: 'var(--pl-ink-200)', margin: '20px 0' }} />

          <Eyebrow>quick actions</Eyebrow>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              onClick={() => navigate('/prompts/new')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 10px',
                background: 'transparent',
                border: '1px solid var(--pl-ink-200)',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'var(--pl-display)',
                fontSize: 12.5,
                color: 'var(--pl-ink-800)',
                textAlign: 'left',
              }}
            >
              <span>New prompt</span>
              <Mono
                size={10.5}
                color="var(--pl-ink-500)"
                style={{
                  border: '1px solid var(--pl-ink-300)',
                  padding: '1px 5px',
                  borderRadius: 3,
                }}
              >
                N
              </Mono>
            </button>
            <button
              type="button"
              onClick={() => navigate('/prompts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 10px',
                background: 'transparent',
                border: '1px solid var(--pl-ink-200)',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'var(--pl-display)',
                fontSize: 12.5,
                color: 'var(--pl-ink-800)',
                textAlign: 'left',
              }}
            >
              <span>Browse catalog</span>
              <Mono
                size={10.5}
                color="var(--pl-ink-500)"
                style={{
                  border: '1px solid var(--pl-ink-300)',
                  padding: '1px 5px',
                  borderRadius: 3,
                }}
              >
                P
              </Mono>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
