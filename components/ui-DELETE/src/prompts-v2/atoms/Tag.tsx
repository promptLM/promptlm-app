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

export type TagTone = 'neutral' | 'signal' | 'ok' | 'warn' | 'fail';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
}

const TONE_STYLES: Record<TagTone, { bg: string; fg: string; bd: string }> = {
  neutral: {
    bg: 'var(--pl-ink-100)',
    fg: 'var(--pl-ink-700)',
    bd: 'var(--pl-ink-200)',
  },
  signal: {
    bg: 'color-mix(in oklch, var(--pl-signal) 12%, var(--pl-paper))',
    fg: 'var(--pl-signal-ink)',
    bd: 'color-mix(in oklch, var(--pl-signal) 30%, var(--pl-ink-200))',
  },
  ok: {
    bg: 'color-mix(in oklch, var(--pl-ok) 14%, var(--pl-paper))',
    fg: 'oklch(0.32 0.10 155)',
    bd: 'color-mix(in oklch, var(--pl-ok) 35%, var(--pl-ink-200))',
  },
  warn: {
    bg: 'color-mix(in oklch, var(--pl-warn) 18%, var(--pl-paper))',
    fg: 'oklch(0.42 0.10 75)',
    bd: 'color-mix(in oklch, var(--pl-warn) 40%, var(--pl-ink-200))',
  },
  fail: {
    bg: 'color-mix(in oklch, var(--pl-fail) 14%, var(--pl-paper))',
    fg: 'oklch(0.42 0.13 25)',
    bd: 'color-mix(in oklch, var(--pl-fail) 35%, var(--pl-ink-200))',
  },
};

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { tone = 'neutral', style, children, ...rest },
  ref,
) {
  const s = TONE_STYLES[tone];
  return (
    <span
      ref={ref}
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        fontFamily: 'var(--pl-mono)',
        fontSize: 10.5,
        letterSpacing: '0.02em',
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
        borderRadius: 4,
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </span>
  );
});
