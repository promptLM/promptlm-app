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

export type DiffLineKind = 'add' | 'del';

export interface DiffLineProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: DiffLineKind;
  /** Negative inline-margin so the line bleeds to the edges of a padded code block. */
  bleedPadding?: number;
}

const KIND_STYLES: Record<DiffLineKind, React.CSSProperties> = {
  add: {
    background: 'oklch(0.96 0.04 155)',
    borderLeft: '2px solid oklch(0.55 0.13 155)',
    color: 'oklch(0.30 0.10 155)',
  },
  del: {
    background: 'oklch(0.96 0.04 25)',
    borderLeft: '2px solid oklch(0.55 0.15 25)',
    color: 'oklch(0.36 0.13 25)',
    textDecoration: 'line-through',
    textDecorationColor: 'oklch(0.55 0.15 25)',
  },
};

/**
 * Inline diff line for code/message blocks. Renders a full-width band by
 * bleeding past the parent block's horizontal padding (default 16px).
 */
export const DiffLine = React.forwardRef<HTMLSpanElement, DiffLineProps>(function DiffLine(
  { kind, bleedPadding = 16, style, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      {...rest}
      style={{
        display: 'inline-block',
        width: `calc(100% + ${bleedPadding * 2}px)`,
        marginLeft: -bleedPadding,
        padding: `0 ${bleedPadding - 2}px 0 ${bleedPadding - 2}px`,
        ...KIND_STYLES[kind],
        ...style,
      }}
    >
      {children}
    </span>
  );
});
