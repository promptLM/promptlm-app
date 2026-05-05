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

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'url' | 'email';
  required?: boolean;
  disabled?: boolean;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  /** Numeric inputs: forwarded to the underlying input. */
  inputAttrs?: Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    'min' | 'max' | 'step' | 'inputMode' | 'pattern' | 'autoComplete' | 'autoFocus'
  > & { 'data-testid'?: string };
  /** Optional ref forwarded to the underlying input element. */
  inputRef?: React.Ref<HTMLInputElement>;
}

const FIELD_LABEL_STYLE: React.CSSProperties = {
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

/**
 * v2 single-line text input. Mirrors the look of `DiffPickerStrip`'s dropdown
 * fields: mono uppercase label, hairline border, slate-blue focus ring. No
 * MUI dependency — pure HTML + `--pl-*` tokens.
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helperText,
  inputAttrs,
  inputRef,
}) => {
  const hasError = Boolean(error);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono size={9.5} color="var(--pl-ink-500)" style={FIELD_LABEL_STYLE}>
        {label}
        {required ? <span style={{ color: 'var(--pl-fail)', marginLeft: 4 }}>*</span> : null}
      </Mono>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        {...inputAttrs}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          lineHeight: 1.5,
          color: 'var(--pl-ink-900)',
          background: disabled ? 'var(--pl-ink-100)' : 'var(--pl-paper)',
          border: `1px solid ${hasError ? 'var(--pl-fail)' : 'var(--pl-ink-300)'}`,
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(event) => {
          event.currentTarget.style.borderColor = hasError
            ? 'var(--pl-fail)'
            : 'var(--pl-signal-deep)';
          event.currentTarget.style.boxShadow = `0 0 0 2px ${
            hasError
              ? 'color-mix(in oklch, var(--pl-fail) 25%, transparent)'
              : 'color-mix(in oklch, var(--pl-signal) 25%, transparent)'
          }`;
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = hasError
            ? 'var(--pl-fail)'
            : 'var(--pl-ink-300)';
          event.currentTarget.style.boxShadow = 'none';
        }}
      />
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

export interface TextAreaProps extends Omit<TextFieldProps, 'type' | 'inputAttrs' | 'inputRef'> {
  rows?: number;
  textareaAttrs?: Pick<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'autoFocus' | 'maxLength' | 'minLength'
  > & { 'data-testid'?: string; 'aria-label'?: string };
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  onSelect?: React.ReactEventHandler<HTMLTextAreaElement>;
  onClick?: React.MouseEventHandler<HTMLTextAreaElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
}

/**
 * v2 multi-line text input. Same visual language as `TextField`. Selection
 * events are forwarded so `MessagesCard` can drive placeholder insertion.
 */
export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  rows = 3,
  textareaAttrs,
  textareaRef,
  onSelect,
  onClick,
  onKeyUp,
  onFocus,
  onBlur,
}) => {
  const hasError = Boolean(error);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono size={9.5} color="var(--pl-ink-500)" style={FIELD_LABEL_STYLE}>
        {label}
        {required ? <span style={{ color: 'var(--pl-fail)', marginLeft: 4 }}>*</span> : null}
      </Mono>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError || undefined}
        onSelect={onSelect}
        onClick={onClick}
        onKeyUp={onKeyUp}
        {...textareaAttrs}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--pl-ink-900)',
          background: disabled ? 'var(--pl-ink-100)' : 'var(--pl-paper)',
          border: `1px solid ${hasError ? 'var(--pl-fail)' : 'var(--pl-ink-300)'}`,
          borderRadius: 6,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        onFocus={(event) => {
          event.currentTarget.style.borderColor = hasError
            ? 'var(--pl-fail)'
            : 'var(--pl-signal-deep)';
          event.currentTarget.style.boxShadow = `0 0 0 2px ${
            hasError
              ? 'color-mix(in oklch, var(--pl-fail) 25%, transparent)'
              : 'color-mix(in oklch, var(--pl-signal) 25%, transparent)'
          }`;
          onFocus?.(event);
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = hasError
            ? 'var(--pl-fail)'
            : 'var(--pl-ink-300)';
          event.currentTarget.style.boxShadow = 'none';
          onBlur?.(event);
        }}
      />
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
