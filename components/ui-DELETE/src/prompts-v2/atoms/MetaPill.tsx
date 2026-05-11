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
import { Mono } from './Mono';

export interface MetaPillProps {
  label: string;
  /** Plain value rendered as text (use `mono` to render in JetBrains Mono). */
  value?: React.ReactNode;
  /** Override the value rendering; takes precedence over `value`. */
  children?: React.ReactNode;
  mono?: boolean;
}

/**
 * Title-block meta pill — `version`, `model`, `status` etc. on the prompt
 * detail header. Always shows an uppercase mono label and a value; pass
 * `children` for richer content (e.g. a status dot inline with text).
 */
export const MetaPill: React.FC<MetaPillProps> = ({ label, value, children, mono }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 8,
      padding: '5px 12px',
      border: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      borderRadius: 999,
    }}
  >
    <Mono
      size={10}
      color="var(--pl-ink-500)"
      style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
    >
      {label}
    </Mono>
    {children ?? (
      <span
        style={{
          fontFamily: mono ? 'var(--pl-mono)' : 'var(--pl-display)',
          fontSize: 12.5,
          color: 'var(--pl-ink-900)',
        }}
      >
        {value}
      </span>
    )}
  </span>
);
