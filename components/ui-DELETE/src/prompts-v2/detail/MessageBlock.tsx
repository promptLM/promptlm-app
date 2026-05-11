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
import type { MessageRole } from './types';

const ROLE_TONES: Record<
  MessageRole,
  { bg: string; bd: string; col: string }
> = {
  system: { bg: 'var(--pl-ink-100)', bd: 'var(--pl-ink-200)', col: 'var(--pl-ink-700)' },
  user: { bg: 'oklch(0.97 0.03 240)', bd: 'oklch(0.86 0.04 240)', col: 'var(--pl-signal-deep)' },
  assistant: { bg: 'oklch(0.97 0.03 30)', bd: 'oklch(0.86 0.04 30)', col: 'oklch(0.45 0.13 30)' },
};

export interface MessageBlockProps {
  role: MessageRole;
  body: string;
  /** Wraps each `{{placeholder}}` substring in a styled chip. Disable for raw display. */
  highlightPlaceholders?: boolean;
}

const PLACEHOLDER_RE = /(\{\{[^}]+\}\})/g;

const renderBodyWithPlaceholders = (body: string): React.ReactNode => {
  const parts = body.split(PLACEHOLDER_RE);
  return parts.map((chunk, i) =>
    chunk.startsWith('{{') && chunk.endsWith('}}') ? (
      <span
        key={i}
        style={{
          background: 'color-mix(in oklch, var(--pl-signal) 18%, transparent)',
          color: 'var(--pl-signal-ink)',
          padding: '1px 4px',
          borderRadius: 3,
          borderBottom: '1px dashed var(--pl-signal-deep)',
        }}
      >
        {chunk}
      </span>
    ) : (
      <React.Fragment key={i}>{chunk}</React.Fragment>
    ),
  );
};

export const MessageBlock: React.FC<MessageBlockProps> = ({
  role,
  body,
  highlightPlaceholders = true,
}) => {
  const tone = ROLE_TONES[role];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          padding: '3px 8px',
          background: tone.bg,
          border: `1px solid ${tone.bd}`,
          color: tone.col,
          fontFamily: 'var(--pl-mono)',
          fontSize: 10.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          borderRadius: 4,
          fontWeight: 500,
          textAlign: 'center',
          marginTop: 2,
        }}
      >
        {role}
      </span>
      <pre
        style={{
          margin: 0,
          padding: '8px 12px',
          background: 'var(--pl-canvas)',
          border: '1px solid var(--pl-ink-200)',
          borderRadius: 5,
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--pl-ink-800)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {highlightPlaceholders ? renderBodyWithPlaceholders(body) : body}
      </pre>
    </div>
  );
};
