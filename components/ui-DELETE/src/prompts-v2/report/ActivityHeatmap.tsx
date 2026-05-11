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
import type { ActivityCell } from './types';

const COLORS = [
  'var(--pl-ink-100)',
  'oklch(0.92 0.05 240)',
  'oklch(0.85 0.10 240)',
  'oklch(0.72 0.13 240)',
  'oklch(0.55 0.15 240)',
] as const;

export interface ActivityHeatmapProps {
  /**
   * Daily commit buckets, columns × rows. Length should equal `weeks * days`.
   * Day 0 is the leftmost top cell; weeks scroll right. Pass empty / zero
   * cells when there are no commits.
   */
  data: readonly ActivityCell[];
  /** Number of weekly columns (defaults to 13 = ~90 days). */
  weeks?: number;
  /** Number of day rows (defaults to 7). */
  days?: number;
  /** Month tick labels, evenly spaced across the columns (defaults to []). */
  monthLabels?: readonly string[];
  /** Day-row labels (defaults to short Mon..Sun pattern). */
  dayLabels?: readonly string[];
  /** Total commit count rendered in the legend strip. */
  totalLabel?: string;
}

/**
 * 90-day commit calendar. Pure presentation: counts and bucket assignments
 * are the caller's concern (the CLI generator computes them and emits the
 * already-bucketed `data` array).
 */
export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  weeks = 13,
  days = 7,
  monthLabels = [],
  dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''],
  totalLabel,
}) => (
  <div
    style={{
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 10,
      background: 'var(--pl-paper)',
      padding: '20px 24px',
    }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 6, alignItems: 'center' }}>
      <div />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          gap: 4,
          paddingLeft: 2,
          paddingBottom: 8,
        }}
      >
        {monthLabels.map((m, i) => (
          <Mono
            key={`${m}-${i}`}
            size={10}
            color="var(--pl-ink-500)"
            style={{
              gridColumn: `${Math.floor((i * weeks) / Math.max(1, monthLabels.length)) + 1} / span 3`,
            }}
          >
            {m}
          </Mono>
        ))}
      </div>

      {Array.from({ length: days }).map((_, dayIndex) => (
        <React.Fragment key={dayIndex}>
          <Mono
            size={10}
            color="var(--pl-ink-500)"
            style={{ textAlign: 'right', paddingRight: 8 }}
          >
            {dayLabels[dayIndex] ?? ''}
          </Mono>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${weeks}, 1fr)`,
              gap: 4,
            }}
          >
            {Array.from({ length: weeks }).map((__, weekIndex) => {
              const cell = data[weekIndex * days + dayIndex];
              const value = cell?.value ?? 0;
              return (
                <span
                  key={weekIndex}
                  title={`${value} commit${value === 1 ? '' : 's'}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 3,
                    background: COLORS[value],
                    border: value === 0 ? '1px solid var(--pl-ink-200)' : 'none',
                  }}
                />
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid var(--pl-ink-200)',
      }}
    >
      {totalLabel && (
        <Mono size={11} color="var(--pl-ink-700)">
          {totalLabel}
        </Mono>
      )}
      <div style={{ flex: 1 }} />
      <Mono size={10} color="var(--pl-ink-500)">
        less
      </Mono>
      {COLORS.map((c, i) => (
        <span
          key={i}
          style={{
            width: 11,
            height: 11,
            borderRadius: 3,
            background: c,
            border: i === 0 ? '1px solid var(--pl-ink-200)' : 'none',
          }}
        />
      ))}
      <Mono size={10} color="var(--pl-ink-500)">
        more
      </Mono>
    </div>
  </div>
);
