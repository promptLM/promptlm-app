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
import type { GroupCatalogBlock, GroupCatalogItem } from './types';

const COLUMNS = '1.4fr 0.6fr 0.5fr 1.3fr 0.5fr 0.5fr 0.7fr 0.7fr';
const HEADERS = [
  'Name',
  'Version',
  'Rev',
  'Model',
  'Msgs',
  'Vars',
  'Status',
  'Updated',
] as const;

const STATUS_TONE: Record<string, string> = {
  production: 'oklch(0.45 0.12 155)',
  staging: 'oklch(0.50 0.13 75)',
  review: 'oklch(0.50 0.13 75)',
  experimental: 'var(--pl-ink-500)',
  draft: 'var(--pl-ink-500)',
  failing: 'var(--pl-fail)',
};

const tone = (status: GroupCatalogItem['status']): string =>
  STATUS_TONE[status] ?? 'var(--pl-ink-500)';

export interface GroupBlocksProps {
  groups: readonly GroupCatalogBlock[];
  /** Click handler for prompt rows — typically navigates to the detail page. */
  onSelect?: (item: GroupCatalogItem) => void;
}

/** Catalog at HEAD organised by group. One bordered table per group. */
export const GroupBlocks: React.FC<GroupBlocksProps> = ({ groups, onSelect }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
    {groups.map((g) => (
      <div key={g.name}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <Mono
            size={11}
            color="var(--pl-ink-900)"
            style={{ fontWeight: 500, letterSpacing: '0.04em' }}
          >
            {g.name}
          </Mono>
          <Mono size={10} color="var(--pl-ink-500)">
            {g.count} prompts
          </Mono>
          <div style={{ flex: 1, height: 1, background: 'var(--pl-ink-200)' }} />
        </div>
        <div
          style={{
            border: '1px solid var(--pl-ink-200)',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--pl-paper)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: COLUMNS,
              padding: '8px 16px',
              background: 'var(--pl-canvas)',
              borderBottom: '1px solid var(--pl-ink-200)',
              gap: 12,
            }}
          >
            {HEADERS.map((h) => (
              <Mono
                key={h}
                size={9.5}
                color="var(--pl-ink-500)"
                style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
              >
                {h}
              </Mono>
            ))}
          </div>
          {g.items.map((item, i) => {
            const handleClick = onSelect ? () => onSelect(item) : undefined;
            return (
              <div
                key={item.name}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={
                  onSelect
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelect(item);
                        }
                      }
                    : undefined
                }
                style={{
                  display: 'grid',
                  gridTemplateColumns: COLUMNS,
                  alignItems: 'center',
                  padding: '10px 16px',
                  gap: 12,
                  borderBottom:
                    i === g.items.length - 1 ? 'none' : '1px solid var(--pl-ink-200)',
                  cursor: onSelect ? 'pointer' : 'default',
                  outline: 'none',
                }}
              >
                <Mono size={12} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
                  {item.name}
                </Mono>
                <Mono size={11} color="var(--pl-ink-700)">
                  {item.version}
                </Mono>
                <Mono size={11} color="var(--pl-ink-500)">
                  {item.rev}
                </Mono>
                <Mono
                  size={11}
                  color="var(--pl-ink-700)"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.model}
                </Mono>
                <Mono
                  size={11}
                  color="var(--pl-ink-700)"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {item.msgs}
                </Mono>
                <Mono
                  size={11}
                  color="var(--pl-ink-700)"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {item.ph}
                </Mono>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 999,
                      background: tone(item.status),
                    }}
                  />
                  <Mono size={10.5} color={tone(item.status)}>
                    {item.status}
                  </Mono>
                </span>
                <Mono size={10.5} color="var(--pl-ink-500)">
                  {item.updated}
                </Mono>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);
