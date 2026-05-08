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

/**
 * Refined Graph (Mark C2) — the canonical promptLM brand mark. Two solid
 * ink input nodes anchor the figure; the cyan accent output node establishes
 * destination. Used in the app sidebar, report header, and Storybook chrome.
 *
 * Source of truth: design/handoff/brand/logos.jsx (`MarkGraph`). All colors
 * resolve via CSS variables so future signal/ink shifts propagate without a
 * code edit. See #111 BS-4 for adoption history.
 */
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
    {/* ink edges: top-input → output, top-input → bottom-input */}
    <line
      x1="7"
      y1="7"
      x2="17"
      y2="12"
      stroke="var(--pl-ink-900)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="7"
      y1="7"
      x2="7"
      y2="17"
      stroke="var(--pl-ink-900)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* signal edge: bottom-input → output (the accent line) */}
    <line
      x1="7"
      y1="17"
      x2="17"
      y2="12"
      stroke="var(--pl-signal-deep)"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    {/* solid ink input nodes */}
    <circle cx="7" cy="7" r="2.6" fill="var(--pl-ink-900)" />
    <circle cx="7" cy="17" r="2.6" fill="var(--pl-ink-900)" />
    {/* signal output node */}
    <circle cx="17" cy="12" r="2.8" fill="var(--pl-signal-deep)" />
  </svg>
);
