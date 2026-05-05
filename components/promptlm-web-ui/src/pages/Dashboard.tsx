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

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Mono } from '@promptlm/ui';
import { useDashboardSummary, usePrompts } from '@/api/hooks';
import {
  FEED_FILTER_LABELS,
  TIME_WINDOW_LABELS,
  buildActivityFeed,
  buildGroupCounts,
  buildOpenWork,
  filterFeed,
  findLastRelease,
  type FeedFilterKind,
  type FeedItem,
  type OpenWorkItem,
  type TimeWindow,
} from './Dashboard.helpers';

const ACTIVITY_VISIBLE_LIMIT = 12;
const FEED_FILTERS: FeedFilterKind[] = ['all', 'release', 'run', 'draft'];
const TIME_WINDOWS: TimeWindow[] = ['24h', '7d', 'all'];

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

const ActivityRow = ({
  item,
  onClick,
}: {
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
        background: 'transparent',
        border: 'none',
        borderTop: '1px solid var(--pl-ink-200)',
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
              <Mono
                size={11.5}
                color="var(--pl-signal-deep)"
                style={{ fontWeight: 500 }}
              >
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

const FilterButton = ({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    style={{
      background: 'transparent',
      border: 'none',
      padding: 0,
      fontFamily: 'var(--pl-display)',
      fontSize: 12.5,
      color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-500)',
      fontWeight: active ? 500 : 400,
      cursor: 'pointer',
      borderBottom: active
        ? '1px solid var(--pl-ink-900)'
        : '1px solid transparent',
      paddingBottom: 1,
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 5,
    }}
  >
    <span>{label}</span>
    {typeof count === 'number' && (
      <Mono size={11} color={active ? 'var(--pl-ink-700)' : 'var(--pl-ink-400)'}>
        {count}
      </Mono>
    )}
  </button>
);

const OpenWorkRow = ({
  item,
  onClick,
}: {
  item: OpenWorkItem;
  onClick?: () => void;
}) => {
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

const QuickActionButton = ({
  label,
  kbd,
  onClick,
}: {
  label: string;
  kbd: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
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
    <span>{label}</span>
    <Mono
      size={10.5}
      color="var(--pl-ink-500)"
      style={{
        border: '1px solid var(--pl-ink-300)',
        padding: '1px 5px',
        borderRadius: 3,
      }}
    >
      {kbd}
    </Mono>
  </button>
);

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: isStatsLoading, error: statsError } =
    useDashboardSummary();
  const { data: prompts, isLoading: isPromptsLoading, error: promptsError } =
    usePrompts();

  const promptList = useMemo(() => prompts ?? [], [prompts]);

  const groupCounts = useMemo(
    () => buildGroupCounts(stats?.countByGroup, promptList),
    [stats, promptList],
  );

  const fullFeed = useMemo(() => buildActivityFeed(promptList), [promptList]);
  const openWork = useMemo(() => buildOpenWork(promptList), [promptList]);
  const lastRelease = useMemo(() => findLastRelease(promptList), [promptList]);

  const [filterKind, setFilterKind] = useState<FeedFilterKind>('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');

  // Counts per kind, scoped to the active time window so the filter strip
  // tells the user exactly how many items each chip would surface.
  const filterCounts = useMemo(() => {
    const counts: Record<FeedFilterKind, number> = {
      all: 0,
      release: 0,
      run: 0,
      draft: 0,
      create: 0,
    };
    for (const item of filterFeed(fullFeed, 'all', timeWindow)) {
      counts.all += 1;
      counts[item.kind] += 1;
    }
    return counts;
  }, [fullFeed, timeWindow]);

  const visibleFeed = useMemo(
    () => filterFeed(fullFeed, filterKind, timeWindow).slice(0, ACTIVITY_VISIBLE_LIMIT),
    [fullFeed, filterKind, timeWindow],
  );

  const totalPrompts = stats?.totalPrompts ?? promptList.length;
  const activePrompts =
    stats?.activePrompts ??
    promptList.filter((p) => p.status !== 'RETIRED').length;
  const retiredPrompts =
    stats?.retiredPrompts ??
    promptList.filter((p) => p.status === 'RETIRED').length;

  const goToNew = useCallback(() => navigate('/prompts/new'), [navigate]);
  const goToCatalog = useCallback(() => navigate('/prompts'), [navigate]);

  // Global keyboard shortcuts: N = new prompt, P = browse catalog. Ignored
  // while the user is typing in any input/textarea/select/contenteditable.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'n') {
        event.preventDefault();
        goToNew();
      } else if (key === 'p') {
        event.preventDefault();
        goToCatalog();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToNew, goToCatalog]);

  const hasError = Boolean(statsError || promptsError);
  const showFeedSkeleton = isPromptsLoading && fullFeed.length === 0;
  const totalFiltered = filterCounts.all;
  const hasMore = visibleFeed.length < filterFeed(fullFeed, filterKind, timeWindow).length;

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
          {statsError && (
            <div>Failed to load corpus stats: {statsError.message}</div>
          )}
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
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 14,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}>
              <Eyebrow>recent activity · {TIME_WINDOW_LABELS[timeWindow]}</Eyebrow>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 14 }}>
              {TIME_WINDOWS.map((win) => (
                <FilterButton
                  key={win}
                  label={TIME_WINDOW_LABELS[win]}
                  active={timeWindow === win}
                  onClick={() => setTimeWindow(win)}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              padding: '4px 0 10px',
              flexWrap: 'wrap',
            }}
          >
            {FEED_FILTERS.map((kind) => (
              <FilterButton
                key={kind}
                label={FEED_FILTER_LABELS[kind]}
                active={filterKind === kind}
                count={filterCounts[kind]}
                onClick={() => setFilterKind(kind)}
              />
            ))}
          </div>

          {showFeedSkeleton ? (
            <div style={{ paddingTop: 8 }}>
              <SkeletonRow width="55%" />
              <SkeletonRow width="70%" />
              <SkeletonRow width="60%" />
              <SkeletonRow width="65%" />
            </div>
          ) : visibleFeed.length === 0 ? (
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
              {totalFiltered === 0 && filterKind === 'all'
                ? 'No activity in this window. Widen the time range or run a prompt to see it here.'
                : `No ${FEED_FILTER_LABELS[filterKind]} in this window.`}
            </div>
          ) : (
            <div>
              {visibleFeed.map((item) => (
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
              {hasMore && (
                <div
                  style={{
                    borderTop: '1px solid var(--pl-ink-200)',
                    padding: '14px 0',
                    textAlign: 'center',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setTimeWindow('all')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      fontFamily: 'var(--pl-display)',
                      fontSize: 12.5,
                      color: 'var(--pl-ink-600)',
                      cursor: 'pointer',
                    }}
                  >
                    View older activity →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

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
                  onClick={item.href ? () => navigate(item.href!) : undefined}
                />
              ))
            )}
          </div>

          <div style={{ height: 1, background: 'var(--pl-ink-200)', margin: '20px 0' }} />

          <Eyebrow>quick actions</Eyebrow>
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <QuickActionButton label="New prompt" kbd="N" onClick={goToNew} />
            <QuickActionButton label="Browse catalog" kbd="P" onClick={goToCatalog} />
          </div>
        </aside>
      </div>
    </div>
  );
}
