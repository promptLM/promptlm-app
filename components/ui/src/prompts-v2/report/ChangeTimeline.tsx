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

import * as React from 'react';
import { Mono } from '../atoms';
import { SpecChip } from './SpecChip';
import type { SpecChangeKind, TimelineEntry } from './types';

const KIND_STYLES: Record<
  SpecChangeKind,
  { label: string; bd: string; bg: string; col: string }
> = {
  add: {
    label: 'A',
    bd: 'oklch(0.55 0.13 155)',
    bg: 'oklch(0.97 0.04 155)',
    col: 'oklch(0.40 0.12 155)',
  },
  edit: {
    label: 'M',
    bd: 'var(--pl-signal-deep)',
    bg: 'oklch(0.97 0.03 240)',
    col: 'var(--pl-signal-deep)',
  },
  del: {
    label: 'D',
    bd: 'oklch(0.55 0.15 25)',
    bg: 'oklch(0.97 0.04 25)',
    col: 'oklch(0.45 0.13 25)',
  },
  rename: {
    label: 'R',
    bd: 'oklch(0.55 0.13 75)',
    bg: 'oklch(0.97 0.04 75)',
    col: 'oklch(0.45 0.13 75)',
  },
};

const FILTER_LABELS = ['All', 'Added', 'Edited', 'Removed', 'Renamed'] as const;
type FilterValue = 'all' | SpecChangeKind;

const FILTER_TO_VALUE: Record<(typeof FILTER_LABELS)[number], FilterValue> = {
  All: 'all',
  Added: 'add',
  Edited: 'edit',
  Removed: 'del',
  Renamed: 'rename',
};

export interface ChangeTimelineProps {
  entries: readonly TimelineEntry[];
  /** Number of older entries available beyond what's rendered. Pass undefined to hide the load-more affordance. */
  olderCount?: number;
  /** Callback when "load N older" is clicked. */
  onLoadOlder?: () => void;
  /** Callback when "view full diff →" on a focused entry is clicked. */
  onOpenDiff?: (entry: TimelineEntry) => void;
}

/**
 * Vertical rail of structured change entries. Rendered newest first by the
 * caller. Filter chips swap which kinds are visible; "load more" is the
 * caller's job (we just expose the affordance).
 */
export const ChangeTimeline: React.FC<ChangeTimelineProps> = ({
  entries,
  olderCount,
  onLoadOlder,
  onOpenDiff,
}) => {
  const [filter, setFilter] = React.useState<FilterValue>('all');
  const visible = filter === 'all' ? entries : entries.filter((e) => e.kind === filter);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px',
          border: '1px solid var(--pl-ink-200)',
          borderRadius: 8,
          background: 'var(--pl-paper)',
          marginBottom: 16,
        }}
      >
        <Mono
          size={10}
          color="var(--pl-ink-500)"
          style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
        >
          {visible.length} entries
        </Mono>
        <span style={{ width: 1, height: 14, background: 'var(--pl-ink-200)' }} />
        {FILTER_LABELS.map((label) => {
          const value = FILTER_TO_VALUE[label];
          const active = filter === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(value)}
              style={{
                background: active ? 'var(--pl-ink-100)' : 'transparent',
                border: '1px solid',
                borderColor: active ? 'var(--pl-ink-300)' : 'transparent',
                padding: '3px 10px',
                borderRadius: 5,
                fontSize: 11.5,
                color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--pl-display)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', paddingLeft: 18 }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 6,
            top: 8,
            bottom: 8,
            width: 1,
            background: 'var(--pl-ink-200)',
          }}
        />

        {visible.map((entry) => {
          const k = KIND_STYLES[entry.kind];
          return (
            <div key={entry.sha} style={{ position: 'relative', paddingBottom: 18 }}>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: -18,
                  top: 18,
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: 'var(--pl-paper)',
                  border: `2px solid ${k.bd}`,
                  boxShadow: entry.focus ? `0 0 0 4px ${k.bg}` : 'none',
                }}
              />
              <div
                style={{
                  padding: '14px 18px',
                  border: '1px solid var(--pl-ink-200)',
                  borderLeft: `3px solid ${k.bd}`,
                  borderRadius: 6,
                  background: entry.focus ? 'oklch(0.99 0.02 240)' : 'var(--pl-paper)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: 'var(--pl-mono)',
                      fontSize: 10,
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      background: k.bg,
                      color: k.col,
                      border: `1px solid ${k.bd}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {k.label}
                  </span>
                  <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
                    {entry.prompt}
                  </Mono>
                  <Mono size={11} color="var(--pl-ink-500)">
                    {entry.rev}
                  </Mono>
                  <span style={{ flex: 1 }} />
                  <Mono size={11} color="var(--pl-ink-500)">
                    {entry.author}
                  </Mono>
                  <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
                  <Mono size={11} color="var(--pl-ink-500)" title={entry.date}>
                    {entry.when}
                  </Mono>
                  <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
                  <Mono size={11} color="var(--pl-ink-500)">
                    {entry.sha}
                  </Mono>
                  {entry.pr && (
                    <>
                      <span style={{ width: 1, height: 10, background: 'var(--pl-ink-300)' }} />
                      <Mono size={11} color="var(--pl-signal-deep)">
                        {entry.pr}
                      </Mono>
                    </>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13.5,
                    color: 'var(--pl-ink-800)',
                    lineHeight: 1.45,
                  }}
                >
                  {entry.msg}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 10,
                    alignItems: 'center',
                  }}
                >
                  {entry.changes.map((change, i) => (
                    <SpecChip
                      key={i}
                      field={change.f}
                      description={change.d}
                      tone={change.tone}
                    />
                  ))}
                  {entry.focus && onOpenDiff && (
                    <button
                      type="button"
                      onClick={() => onOpenDiff(entry)}
                      style={{
                        fontFamily: 'var(--pl-mono)',
                        fontSize: 11,
                        color: 'var(--pl-signal-deep)',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        borderBottom: '1px dashed var(--pl-signal-deep)',
                        marginLeft: 6,
                      }}
                    >
                      view full diff →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {olderCount != null && olderCount > 0 && (
          <div style={{ position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: -18,
                top: 8,
                width: 12,
                height: 12,
                borderRadius: 999,
                background: 'var(--pl-paper)',
                border: '1px dashed var(--pl-ink-300)',
              }}
            />
            <div style={{ padding: '8px 0' }}>
              <button
                type="button"
                onClick={onLoadOlder}
                style={{
                  fontFamily: 'var(--pl-mono)',
                  fontSize: 11.5,
                  color: 'var(--pl-ink-600)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: onLoadOlder ? 'pointer' : 'default',
                  borderBottom: '1px dashed var(--pl-ink-400)',
                }}
              >
                load {olderCount} older entries →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
