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

export type VendorId = 'anthropic' | 'openai' | string;

export interface VendorMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  vendor: VendorId;
  size?: number;
}

/**
 * Geometric mark for an LLM vendor — not a company logo. Draws a filled square
 * for Anthropic and an outlined circle for OpenAI; unknown vendors fall back to
 * the OpenAI mark so the chrome still renders.
 */
export const VendorMark = React.forwardRef<HTMLSpanElement, VendorMarkProps>(function VendorMark(
  { vendor, size = 14, style, ...rest },
  ref,
) {
  if (vendor === 'anthropic') {
    return (
      <span
        ref={ref}
        {...rest}
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          background: 'var(--pl-ink-900)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
      >
        <span
          style={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: 1,
            background: 'var(--pl-paper)',
          }}
        />
      </span>
    );
  }
  return (
    <span
      ref={ref}
      {...rest}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: '1.5px solid var(--pl-ink-700)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <span
        style={{
          width: size * 0.32,
          height: size * 0.32,
          borderRadius: 999,
          background: 'var(--pl-ink-700)',
        }}
      />
    </span>
  );
});
