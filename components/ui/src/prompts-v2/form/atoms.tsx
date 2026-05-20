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

/**
 * Compact form atoms scoped to the v2 prompt form. Sized down from the
 * `prompts-v2/forms/*` atoms — these match the visual density of the editor
 * design (tight 4–6px paddings, 12–13px type, lowercase mono labels).
 *
 * Built without MUI; styles inline so the form ships even without the global
 * Tailwind preflight.
 */

import * as React from 'react';

const ERR_BORDER = 'oklch(0.65 0.15 25)';
const ERR_TEXT = 'oklch(0.50 0.15 25)';

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '6px 9px',
  fontFamily: 'var(--pl-display)',
  fontSize: 13,
  color: 'var(--pl-ink-900)',
  background: 'var(--pl-paper)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--pl-ink-200)',
  borderRadius: 4,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 120ms ease',
};

const inputMono: React.CSSProperties = {
  ...inputBase,
  fontFamily: 'var(--pl-mono)',
  fontSize: 12,
};

/** Inject one-shot CSS for placeholder colour + collapser rotation. */
let cssInjected = false;
const ensureFormCss = () => {
  if (cssInjected || typeof document === 'undefined') return;
  if (document.getElementById('pl-form-css')) {
    cssInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = 'pl-form-css';
  style.textContent = `
    .pl-form-input::placeholder, .pl-form-input textarea::placeholder { color: var(--pl-ink-400); opacity: 1; }
    .pl-form-input:focus { border-color: var(--pl-signal-deep) !important; }
    .pl-form-input:focus.pl-form-err { border-color: ${ERR_BORDER} !important; }
    .pl-form-collapser { transition: transform 120ms ease; }
    .pl-form-collapser.open { transform: rotate(90deg); }
  `;
  document.head.appendChild(style);
  cssInjected = true;
};

if (typeof document !== 'undefined') {
  ensureFormCss();
}

/** Mono span used throughout the form for status, hints, and meta lines. */
export const FormMono: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & {
    size?: number;
    color?: string;
  }
> = ({ size = 11, color = 'var(--pl-ink-700)', style, children, ...rest }) => (
  <span
    {...rest}
    style={{
      fontFamily: 'var(--pl-mono)',
      fontSize: size,
      color,
      letterSpacing: '-0.005em',
      ...style,
    }}
  >
    {children}
  </span>
);

export interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Optional id on the underlying `<label>` for `for=` association. */
  htmlFor?: string;
}

/** Mono uppercase label with optional required asterisk and inline hint/error. */
export const FieldLabel: React.FC<FieldLabelProps> = ({
  children,
  required,
  hint,
  error,
  htmlFor,
}) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
    <label
      htmlFor={htmlFor}
      style={{
        fontFamily: 'var(--pl-mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: 'var(--pl-ink-600)',
      }}
    >
      {children}
      {required ? <span style={{ color: ERR_TEXT, marginLeft: 3 }}>*</span> : null}
    </label>
    {error ? (
      <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, color: ERR_TEXT }}>! {error}</span>
    ) : hint ? (
      <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 10, color: 'var(--pl-ink-400)' }}>
        {hint}
      </span>
    ) : null}
  </div>
);

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: React.ReactNode;
  mono?: boolean;
  compact?: boolean;
  testId?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  inputRef?: React.Ref<HTMLInputElement>;
  id?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  error,
  mono,
  compact,
  testId,
  inputMode,
  inputRef,
  id,
}) => (
  <input
    id={id}
    ref={inputRef}
    className={`pl-form-input ${error ? 'pl-form-err' : ''}`}
    type="text"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    inputMode={inputMode}
    data-testid={testId}
    aria-invalid={error ? true : undefined}
    style={{
      ...(mono ? inputMono : inputBase),
      ...(compact ? { padding: '4px 8px', fontSize: 12 } : {}),
      ...(error ? { borderColor: ERR_BORDER } : {}),
    }}
  />
);

export interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: React.ReactNode;
  mono?: boolean;
  testId?: string;
  ariaLabel?: string;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  onSelect?: React.ReactEventHandler<HTMLTextAreaElement>;
  onClick?: React.MouseEventHandler<HTMLTextAreaElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  /** Override the default field chrome — used by the message editor for a flush textarea inside its own border. */
  flush?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  rows = 3,
  error,
  mono = true,
  testId,
  ariaLabel,
  textareaRef,
  onSelect,
  onClick,
  onKeyUp,
  onFocus,
  onBlur,
  flush,
}) => (
  <textarea
    ref={textareaRef}
    className={`pl-form-input ${error ? 'pl-form-err' : ''}`}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    rows={rows}
    data-testid={testId}
    aria-label={ariaLabel}
    aria-invalid={error ? true : undefined}
    onSelect={onSelect}
    onClick={onClick}
    onKeyUp={onKeyUp}
    onFocus={onFocus}
    onBlur={onBlur}
    style={
      flush
        ? {
            width: '100%',
            fontFamily: 'var(--pl-mono)',
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'var(--pl-ink-900)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            padding: '4px 4px',
          }
        : {
            ...(mono ? inputMono : inputBase),
            ...(error ? { borderColor: ERR_BORDER } : {}),
            resize: 'vertical',
            lineHeight: 1.55,
          }
    }
  />
);

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  error?: React.ReactNode;
  testId?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  step = 0.1,
  min,
  max,
  error,
  testId,
}) => (
  <input
    className={`pl-form-input ${error ? 'pl-form-err' : ''}`}
    type="number"
    value={Number.isFinite(value) ? value : ''}
    onChange={(event) => {
      const next = Number.parseFloat(event.target.value);
      onChange(Number.isFinite(next) ? next : 0);
    }}
    step={step}
    min={min}
    max={max}
    data-testid={testId}
    aria-invalid={error ? true : undefined}
    style={{
      ...inputMono,
      ...(error ? { borderColor: ERR_BORDER } : {}),
      width: '100%',
    }}
  />
);

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  error?: React.ReactNode;
  compact?: boolean;
  testId?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  error,
  compact,
  testId,
  id,
}) => (
  <select
    id={id}
    className={`pl-form-input ${error ? 'pl-form-err' : ''}`}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    data-testid={testId}
    aria-invalid={error ? true : undefined}
    style={{
      ...inputBase,
      ...(compact ? { padding: '4px 8px', fontSize: 12 } : {}),
      ...(error ? { borderColor: ERR_BORDER } : {}),
      cursor: 'pointer',
    }}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  size?: number;
  testId?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  size = 13,
  testId,
}) => (
  <label
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      cursor: 'pointer',
      userSelect: 'none',
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      data-testid={testId}
      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--pl-signal-deep)' }}
    />
    <span style={{ fontFamily: 'var(--pl-display)', fontSize: size, color: 'var(--pl-ink-800)' }}>
      {label}
    </span>
  </label>
);

export interface GhostButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  danger?: boolean;
  mini?: boolean;
  disabled?: boolean;
  testId?: string;
  type?: 'button' | 'submit';
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  onClick,
  onMouseDown,
  danger,
  mini,
  disabled,
  testId,
  type = 'button',
}) => (
  <button
    onClick={onClick}
    onMouseDown={onMouseDown}
    type={type}
    disabled={disabled}
    data-testid={testId}
    style={{
      padding: mini ? '3px 8px' : '5px 10px',
      fontFamily: 'var(--pl-mono)',
      fontSize: mini ? 10 : 11,
      letterSpacing: '0.04em',
      background: 'transparent',
      border: `1px solid ${danger ? 'oklch(0.80 0.10 25)' : 'var(--pl-ink-200)'}`,
      color: danger ? ERR_TEXT : 'var(--pl-ink-700)',
      borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
    }}
  >
    {children}
  </button>
);

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  testId?: string;
  type?: 'button' | 'submit';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled,
  testId,
  type = 'button',
}) => (
  <button
    onClick={onClick}
    type={type}
    disabled={disabled}
    data-testid={testId}
    style={{
      padding: '7px 14px',
      fontFamily: 'var(--pl-display)',
      fontSize: 13,
      fontWeight: 500,
      background: disabled ? 'var(--pl-ink-300)' : 'var(--pl-ink-900)',
      color: 'var(--pl-paper)',
      border: 'none',
      borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);
