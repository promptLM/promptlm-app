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
import type { CatalogFacetGroupSpec, CatalogFacetItem } from './types';

export interface CatalogFacetRailProps {
  groups: readonly CatalogFacetGroupSpec[];
  /** Called when a facet item is selected. Group `id` identifies which group, item `id` is the new active value. */
  onSelect?: (groupId: string, itemId: string) => void;
}

export interface CatalogFacetGroupProps {
  label: string;
  items: readonly CatalogFacetItem[];
  activeId?: string | null;
  onSelect?: (itemId: string) => void;
}

export const CatalogFacetGroup: React.FC<CatalogFacetGroupProps> = ({
  label,
  items,
  activeId,
  onSelect,
}) => (
  <div>
    <Mono
      size={10.5}
      color="var(--pl-ink-500)"
      style={{
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: 8,
        paddingLeft: 8,
      }}
    >
      {label}
    </Mono>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }} role="list">
      {items.map((it) => {
        const isActive = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            role="listitem"
            aria-pressed={isActive}
            onClick={() => onSelect?.(it.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 8px',
              borderRadius: 5,
              cursor: 'pointer',
              border: 'none',
              textAlign: 'left',
              background: isActive ? 'var(--pl-ink-100)' : 'transparent',
              fontSize: 12.5,
              fontFamily: 'var(--pl-display)',
              color: isActive ? 'var(--pl-ink-900)' : 'var(--pl-ink-700)',
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {it.dot && (
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: it.dot,
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ flex: 1 }}>{it.label}</span>
            <Mono size={10.5} color="var(--pl-ink-500)">
              {it.count}
            </Mono>
          </button>
        );
      })}
    </div>
  </div>
);

export const CatalogFacetRail: React.FC<CatalogFacetRailProps> = ({ groups, onSelect }) => (
  <aside
    style={{
      borderRight: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
    }}
  >
    {groups.map((g) => (
      <CatalogFacetGroup
        key={g.id}
        label={g.label}
        items={g.items}
        activeId={g.activeId ?? null}
        onSelect={(itemId) => onSelect?.(g.id, itemId)}
      />
    ))}
  </aside>
);
