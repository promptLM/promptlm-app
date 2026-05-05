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

export interface ReportSectionProps {
  /** Section ordinal, e.g. "01"; rendered as "§ 01". */
  num: string;
  title: string;
  /** Anchor id for in-page links. */
  anchor: string;
  children: React.ReactNode;
}

/**
 * Report-page section wrapper. Wider padding and slightly larger top spacing
 * than the webui DetailSection (which lives in a sidebar shell).
 */
export const ReportSection: React.FC<ReportSectionProps> = ({ num, title, anchor, children }) => (
  <section
    id={anchor}
    style={{ padding: '36px 56px', borderTop: '1px solid var(--pl-ink-200)' }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
      <Mono
        size={11}
        color="var(--pl-signal-deep)"
        style={{ letterSpacing: '0.14em', fontWeight: 500 }}
      >
        § {num}
      </Mono>
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--pl-display)',
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--pl-ink-900)',
        }}
      >
        {title}
      </h3>
      <div style={{ flex: 1, height: 1, background: 'var(--pl-ink-200)' }} />
      <a
        href={`#${anchor}`}
        style={{
          fontFamily: 'var(--pl-mono)',
          fontSize: 11,
          color: 'var(--pl-ink-500)',
          textDecoration: 'none',
        }}
      >
        #
      </a>
    </div>
    {children}
  </section>
);
