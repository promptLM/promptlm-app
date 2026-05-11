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

export interface DocumentChromeProps {
  /** Repository or report label, e.g. "promptlm report · github.com/acme/agents". */
  source: string;
  /** Breadcrumb segments — last is rendered emphasized. */
  breadcrumb?: readonly string[];
  /** Optional path or detail label rendered on the right (e.g. spec file path). */
  detail?: string;
  /** Optional secondary link (e.g. "open in diff →"). */
  secondaryLink?: { label: string; href: string };
}

/**
 * Document-style header used by the static report and the read-oriented detail
 * view. Renders a tiny pLM avatar on the left, a breadcrumb in the middle, and
 * an optional path + secondary link on the right. Lives on a `--pl-paper`
 * strip with a hairline bottom border.
 */
export const DocumentChrome: React.FC<DocumentChromeProps> = ({
  source,
  breadcrumb = [],
  detail,
  secondaryLink,
}) => (
  <div
    style={{
      borderBottom: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      padding: '14px 56px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: 'var(--pl-ink-900)',
          color: 'var(--pl-paper)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--pl-mono)',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span>p</span>
        <span style={{ color: 'var(--pl-signal)' }}>L</span>
        <span>M</span>
      </span>
      <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
        {source}
      </Mono>
    </span>

    {breadcrumb.length > 0 && (
      <>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <Mono size={11} color="var(--pl-ink-500)">
          {breadcrumb.map((seg, i) => (
            <React.Fragment key={`${seg}-${i}`}>
              <span
                style={{
                  color: i === breadcrumb.length - 1 ? 'var(--pl-ink-900)' : 'var(--pl-ink-500)',
                }}
              >
                {seg}
              </span>
              {i < breadcrumb.length - 1 && '  /  '}
            </React.Fragment>
          ))}
        </Mono>
      </>
    )}

    <div style={{ flex: 1 }} />
    {detail && (
      <Mono size={11} color="var(--pl-ink-500)">
        {detail}
      </Mono>
    )}
    {secondaryLink && (
      <>
        <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
        <a
          href={secondaryLink.href}
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 11,
            color: 'var(--pl-signal-deep)',
            textDecoration: 'none',
            borderBottom: '1px dashed var(--pl-signal-deep)',
          }}
        >
          {secondaryLink.label}
        </a>
      </>
    )}
  </div>
);
