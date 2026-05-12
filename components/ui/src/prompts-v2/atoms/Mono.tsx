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

export interface MonoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  color?: string;
}

export const Mono = React.forwardRef<HTMLSpanElement, MonoProps>(function Mono(
  { size = 12, color = 'var(--pl-ink-700)', style, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      {...rest}
      style={{
        fontFamily: 'var(--pl-mono)',
        fontSize: typeof size === 'number' ? `${size}px` : size,
        color,
        letterSpacing: '-0.005em',
        ...style,
      }}
    >
      {children}
    </span>
  );
});
