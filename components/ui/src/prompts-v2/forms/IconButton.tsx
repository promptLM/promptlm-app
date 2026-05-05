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

export type IconName = 'trash' | 'plus' | 'chevron-down';

const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 14 }) => {
  switch (name) {
    case 'trash':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 4.5h10M6.5 4.5V3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M4 4.5l.5 8a1.5 1.5 0 0 0 1.5 1.4h4a1.5 1.5 0 0 0 1.5-1.4l.5-8M6.5 7v5M9.5 7v5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'plus':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export interface IconButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Visual treatment. `ghost` = no chrome until hover; `outlined` = always-visible border. */
  variant?: 'ghost' | 'outlined';
  size?: number;
  'data-testid'?: string;
}

/**
 * v2 icon-only button. Uses inline SVGs (no `@mui/icons-material`). The
 * accessible name comes from the required `label` prop, exposed as
 * `aria-label`.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'ghost',
  size = 14,
  'data-testid': testId,
}) => {
  const dim = 28;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-testid={testId}
      style={{
        width: dim,
        height: dim,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: variant === 'outlined' ? 'var(--pl-paper)' : 'transparent',
        border: `1px solid ${variant === 'outlined' ? 'var(--pl-ink-300)' : 'transparent'}`,
        borderRadius: 6,
        color: 'var(--pl-ink-600)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
      }}
      onMouseEnter={(event) => {
        if (disabled) return;
        event.currentTarget.style.background = 'var(--pl-ink-100)';
        event.currentTarget.style.color = 'var(--pl-ink-900)';
        event.currentTarget.style.borderColor = 'var(--pl-ink-300)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background =
          variant === 'outlined' ? 'var(--pl-paper)' : 'transparent';
        event.currentTarget.style.color = 'var(--pl-ink-600)';
        event.currentTarget.style.borderColor =
          variant === 'outlined' ? 'var(--pl-ink-300)' : 'transparent';
      }}
    >
      <Icon name={icon} size={size} />
    </button>
  );
};
