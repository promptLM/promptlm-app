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

export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  color?: string;
  /** Render a translucent area fill below the line. */
  filled?: boolean;
  /** Render a small dot on the trailing point. */
  trailingDot?: boolean;
  strokeWidth?: number;
  ariaLabel?: string;
}

const computePoints = (values: readonly number[], w: number, h: number) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const xFor = (i: number) =>
    values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
  const yFor = (v: number) => h - 2 - ((v - min) / range) * (h - 4);
  return { xFor, yFor };
};

/**
 * Lightweight inline sparkline. Two visual modes:
 *  - default (line + trailing dot, no fill) — used by catalog row metrics
 *  - filled=true — area-fill variant used by health cards
 */
export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 96,
  height = 24,
  color = 'var(--pl-signal-deep)',
  filled = false,
  trailingDot = true,
  strokeWidth = 1.4,
  ariaLabel,
}) => {
  if (values.length === 0) return null;
  const { xFor, yFor } = computePoints(values, width, height);
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(v).toFixed(2)}`)
    .join(' ');
  const last = values[values.length - 1];
  return (
    <svg
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {filled && (
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill={color}
          opacity="0.10"
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {trailingDot && (
        <circle cx={xFor(values.length - 1)} cy={yFor(last)} r="2" fill={color} />
      )}
    </svg>
  );
};
