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

export interface DisclosureProps {
  open: boolean;
  onToggle: () => void;
  /** Trigger label e.g. "advanced parameters". */
  label: string;
  /** Region content rendered when open. */
  children: React.ReactNode;
  /**
   * ID prefix used for `aria-controls`/`aria-labelledby`. Trigger gets
   * `${idPrefix}-toggle`; region gets `${idPrefix}-region` unless
   * `regionId` is set explicitly.
   */
  idPrefix?: string;
  /** Override the auto-derived trigger element id. */
  triggerId?: string;
  /** Override the auto-derived region element id. */
  regionId?: string;
}

/**
 * v2 replacement for the `MUI Collapse + Button` pattern used throughout the
 * editor for "Show advanced parameters", "Show placeholder list", etc. The
 * trigger uses the `pl-btn` ghost class so it matches `EditorTopBar` buttons.
 * The body is conditionally mounted (no animated height — keeping the v2
 * surface's clean hairline aesthetic).
 */
export const Disclosure: React.FC<DisclosureProps> = ({
  open,
  onToggle,
  label,
  children,
  idPrefix,
  triggerId: triggerIdProp,
  regionId: regionIdProp,
}) => {
  const reactId = React.useId();
  const prefix = idPrefix ?? reactId;
  const triggerId = triggerIdProp ?? `${prefix}-toggle`;
  const regionId = regionIdProp ?? `${prefix}-region`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        id={triggerId}
        type="button"
        className="pl-btn pl-btn-ghost"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={regionId}
        style={{
          height: 28,
          padding: '0 10px',
          fontSize: 12,
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 120ms ease',
            fontFamily: 'var(--pl-mono)',
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          ⌄
        </span>
        {open ? `Hide ${label}` : `Show ${label}`}
      </button>
      {open ? (
        <div
          id={regionId}
          role="region"
          aria-labelledby={triggerId}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
