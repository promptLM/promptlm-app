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

export interface PartHeaderProps {
  letter: string;
  title: string;
  sub?: string;
}

/** Big editorial divider used to mark Part A / Part B in the static report. */
export const PartHeader: React.FC<PartHeaderProps> = ({ letter, title, sub }) => (
  <div
    style={{
      padding: '48px 56px 28px',
      borderTop: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      display: 'flex',
      alignItems: 'baseline',
      gap: 22,
    }}
  >
    <span
      aria-hidden="true"
      style={{
        fontFamily: 'var(--pl-mono)',
        fontSize: 56,
        fontWeight: 500,
        color: 'var(--pl-ink-200)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}
    >
      {letter}
    </span>
    <div>
      <Mono
        size={11}
        color="var(--pl-ink-500)"
        style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}
      >
        Part {letter}
      </Mono>
      <h2
        style={{
          margin: '4px 0 0',
          fontFamily: 'var(--pl-display)',
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          color: 'var(--pl-ink-900)',
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--pl-ink-600)' }}>{sub}</p>
      )}
    </div>
  </div>
);
