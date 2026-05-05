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
import { FormMono } from './atoms';

export interface CollapsibleProps {
  title: React.ReactNode;
  hint?: React.ReactNode;
  /** Number of validation errors inside this section — surfaced as a pill. */
  errorCount?: number;
  /** Right-aligned header slot (e.g. "+ Add" / "enable" toggle). Wrapped to absorb header click. */
  action?: React.ReactNode;
  /** Initial open state. Caller can also drive open state externally via `open`/`onOpenChange`. */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dense?: boolean;
  /** Stable id used for ARIA wiring; defaults to a generated React id. */
  idPrefix?: string;
  /** Override the auto-derived header trigger id (`${idPrefix}-toggle`). */
  triggerId?: string;
  /** Override the auto-derived region id (`${idPrefix}-region`). */
  regionId?: string;
  children: React.ReactNode;
}

/**
 * v2 form collapsible. Click anywhere on the header row to toggle. Shows an
 * inline error count pill when `errorCount > 0` and an optional right-side
 * action slot that doesn't propagate clicks.
 *
 * Mirrors the `Collapsible` component in `prompt-form.jsx` exactly — same
 * layout, paddings, colours, and `pl-form-collapser` rotation animation.
 */
export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  hint,
  errorCount = 0,
  action,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  dense,
  idPrefix,
  triggerId: triggerIdProp,
  regionId: regionIdProp,
  children,
}) => {
  const reactId = React.useId();
  const prefix = idPrefix ?? reactId;
  const triggerId = triggerIdProp ?? `${prefix}-toggle`;
  const regionId = regionIdProp ?? `${prefix}-region`;

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const toggle = () => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <section
      style={{
        borderBottom: '1px solid var(--pl-ink-200)',
        paddingBottom: open ? (dense ? 12 : 16) : 0,
      }}
    >
      <header
        id={triggerId}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: dense ? '10px 0 8px' : '14px 0 10px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span
          className={`pl-form-collapser ${open ? 'open' : ''}`}
          aria-hidden="true"
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 10,
            color: 'var(--pl-ink-500)',
            display: 'inline-block',
            width: 12,
            lineHeight: 1,
          }}
        >
          ›
        </span>
        <h4
          style={{
            margin: 0,
            fontFamily: 'var(--pl-display)',
            fontSize: dense ? 13 : 14,
            fontWeight: 500,
            color: 'var(--pl-ink-900)',
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </h4>
        {hint ? (
          <FormMono size={10.5} color="var(--pl-ink-500)">
            {hint}
          </FormMono>
        ) : null}
        {errorCount > 0 ? (
          <span
            style={{
              padding: '1px 6px',
              background: 'oklch(0.96 0.04 25)',
              color: 'oklch(0.50 0.15 25)',
              border: '1px solid oklch(0.85 0.10 25)',
              fontFamily: 'var(--pl-mono)',
              fontSize: 10,
              fontWeight: 500,
              borderRadius: 999,
            }}
          >
            {errorCount}
          </span>
        ) : null}
        <div style={{ flex: 1 }} />
        {open && action ? (
          <span onClick={(event) => event.stopPropagation()}>{action}</span>
        ) : null}
      </header>
      {open ? (
        <div id={regionId} role="region" aria-labelledby={triggerId}>
          {children}
        </div>
      ) : null}
    </section>
  );
};
