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

export interface MiniLogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
}

/** Bracket+circle promptLM mark — used in the app sidebar and report header. */
export const MiniLogo: React.FC<MiniLogoProps> = ({ size = 22, style, ...rest }) => (
  <svg
    {...rest}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: 'block', ...style }}
    aria-hidden="true"
  >
    <path
      d="M8 4 L4 4 L4 20 L8 20"
      stroke="var(--pl-ink-900)"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    <path
      d="M16 4 L20 4 L20 20 L16 20"
      stroke="var(--pl-ink-900)"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    <circle cx="12" cy="12" r="3" fill="none" stroke="var(--pl-signal-deep)" strokeWidth="1.6" />
  </svg>
);
