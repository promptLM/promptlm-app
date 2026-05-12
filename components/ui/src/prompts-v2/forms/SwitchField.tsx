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

export interface SwitchFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  /** Optional id for label association. */
  id?: string;
  'data-testid'?: string;
}

/**
 * v2 toggle. Slate track + electric-cyan thumb when on. Layout-friendly:
 * caller-supplied label wraps to the left of the toggle so it can sit in a
 * card action slot or next to a heading.
 */
export const SwitchField: React.FC<SwitchFieldProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  'data-testid': testId,
}) => {
  const switchId = id ?? React.useId();

  const trackOn = 'color-mix(in oklch, var(--pl-signal) 60%, var(--pl-paper))';
  const trackOff = 'var(--pl-ink-200)';
  const thumb = checked ? 'var(--pl-signal-deep)' : 'var(--pl-ink-500)';

  return (
    <label
      htmlFor={switchId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label ? (
        <span
          style={{
            fontFamily: 'var(--pl-display)',
            fontSize: 13,
            color: 'var(--pl-ink-800)',
          }}
        >
          {label}
        </span>
      ) : null}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        data-testid={testId}
        style={{
          position: 'relative',
          width: 32,
          height: 18,
          padding: 0,
          background: checked ? trackOn : trackOff,
          border: '1px solid var(--pl-ink-300)',
          borderRadius: 10,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 120ms ease',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 16 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: thumb,
            transition: 'left 120ms ease',
          }}
        />
      </button>
    </label>
  );
};
