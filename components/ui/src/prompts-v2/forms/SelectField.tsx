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

export interface SelectOption {
  value: string;
  label?: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  /** Mirror of `data-testid` etc. forwarded to the underlying `<select>`. */
  selectAttrs?: { 'data-testid'?: string; name?: string; id?: string };
  /** Compact mode: omits the label row (caller renders its own). */
  unlabeled?: boolean;
}

/**
 * v2 dropdown. Mirrors `DiffPickerStrip`'s embedded picker styling so the
 * editor and the diff page share one control vocabulary.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  helperText,
  selectAttrs,
  unlabeled = false,
}) => {
  const hasError = Boolean(error);

  const select = (
    <div
      style={{
        position: 'relative',
        background: disabled ? 'var(--pl-ink-100)' : 'var(--pl-paper)',
        border: `1px solid ${hasError ? 'var(--pl-fail)' : 'var(--pl-ink-300)'}`,
        borderRadius: 6,
      }}
    >
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        {...selectAttrs}
        style={{
          width: '100%',
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: '8px 28px 8px 10px',
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          color: disabled ? 'var(--pl-ink-500)' : 'var(--pl-ink-900)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label ?? option.value}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--pl-mono)',
          fontSize: 11,
          color: 'var(--pl-ink-500)',
          pointerEvents: 'none',
        }}
      >
        ⌄
      </span>
    </div>
  );

  if (unlabeled) {
    return select;
  }

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono
        size={9.5}
        color="var(--pl-ink-500)"
        style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {label}
        {required ? <span style={{ color: 'var(--pl-fail)', marginLeft: 4 }}>*</span> : null}
      </Mono>
      {select}
      {error ? (
        <Mono size={11} color="var(--pl-fail)">
          {error}
        </Mono>
      ) : helperText ? (
        <span style={{ fontSize: 11.5, color: 'var(--pl-ink-600)', lineHeight: 1.4 }}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
};
