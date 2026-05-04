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

export interface PlaceholderTokenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Placeholder name without braces (e.g. `agent_name`); braces are added automatically. */
  name?: string;
  /** Render with a dashed underline used by the inline-diff view in the editor. */
  underline?: boolean;
}

/**
 * Styled chip for `{{placeholder}}` tokens. When `name` is provided the braces
 * are added; otherwise children are rendered verbatim (use this for ad-hoc
 * highlighting of an existing brace-wrapped string).
 */
export const PlaceholderToken = React.forwardRef<HTMLSpanElement, PlaceholderTokenProps>(
  function PlaceholderToken({ name, underline = false, style, children, ...rest }, ref) {
    const content = name !== undefined ? `{{${name}}}` : children;
    return (
      <span
        ref={ref}
        {...rest}
        style={{
          display: 'inline-block',
          background: 'oklch(0.95 0.05 240)',
          border: '1px solid oklch(0.85 0.08 240)',
          color: 'var(--pl-signal-deep)',
          padding: '0 4px',
          borderRadius: 3,
          fontFamily: 'var(--pl-mono)',
          fontSize: '0.95em',
          borderBottom: underline ? '1px dashed var(--pl-signal-deep)' : undefined,
          ...style,
        }}
      >
        {content}
      </span>
    );
  },
);
