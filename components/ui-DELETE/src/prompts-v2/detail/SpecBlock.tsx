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

export interface SpecBlockProps {
  title: string;
  children: React.ReactNode;
}

export const SpecBlock: React.FC<SpecBlockProps> = ({ title, children }) => (
  <div
    style={{
      marginBottom: 16,
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 8,
      background: 'var(--pl-paper)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        padding: '8px 16px',
        background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)',
      }}
    >
      <Mono
        size={11}
        color="var(--pl-ink-700)"
        style={{ fontWeight: 500, letterSpacing: '0.04em' }}
      >
        {title}
      </Mono>
    </div>
    {children}
  </div>
);

export interface KVProps {
  k: string;
  v: React.ReactNode;
  /** Hide the bottom border (used when this is the last row in a block). */
  last?: boolean;
}

export const KV: React.FC<KVProps> = ({ k, v, last }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      padding: '8px 16px',
      alignItems: 'baseline',
      borderBottom: last ? 'none' : '1px solid var(--pl-ink-200)',
    }}
  >
    <Mono size={11.5} color="var(--pl-ink-700)">
      {k}
    </Mono>
    <Mono size={12} color="var(--pl-ink-900)">
      {typeof v === 'string' || typeof v === 'number' ? String(v) : v}
    </Mono>
  </div>
);
