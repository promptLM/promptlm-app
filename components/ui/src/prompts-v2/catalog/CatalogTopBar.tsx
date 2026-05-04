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

export interface CatalogTopBarProps {
  /** Breadcrumb segments, leftmost first. The last segment is rendered emphasized. */
  breadcrumb: readonly string[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSync?: () => void;
  onNewPrompt?: () => void;
  /** Whether the sync action is currently running (disables the button + shows feedback). */
  syncing?: boolean;
  /** Optional kbd hint shown in the search field (e.g. "⌘K"). */
  searchKbdHint?: string;
}

const FONT = 'var(--pl-display)';
const MONO = 'var(--pl-mono)';

export const CatalogTopBar: React.FC<CatalogTopBarProps> = ({
  breadcrumb,
  searchQuery,
  onSearchChange,
  onSync,
  onNewPrompt,
  syncing = false,
  searchKbdHint = '⌘K',
}) => {
  const last = breadcrumb[breadcrumb.length - 1];
  const lead = breadcrumb.slice(0, -1);
  return (
    <header
      style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        borderBottom: '1px solid var(--pl-ink-200)',
        background: 'var(--pl-paper)',
      }}
    >
      <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
        {lead.length > 0 && <>{lead.join(' · ')} / </>}
        <span style={{ color: 'var(--pl-ink-800)' }}>{last}</span>
      </Mono>

      <div style={{ flex: 1, maxWidth: 380, marginLeft: 'auto', position: 'relative' }}>
        <input
          aria-label="Search prompts"
          placeholder="Search prompts, tags, ids…"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          style={{
            width: '100%',
            height: 32,
            padding: '0 12px 0 32px',
            background: 'var(--pl-ink-100)',
            border: '1px solid var(--pl-ink-200)',
            borderRadius: 7,
            fontFamily: FONT,
            fontSize: 13,
            color: 'var(--pl-ink-800)',
            outline: 'none',
          }}
        />
        <span
          aria-hidden="true"
          style={{ position: 'absolute', left: 11, top: 8, fontSize: 13, color: 'var(--pl-ink-500)' }}
        >
          ⌕
        </span>
        {searchKbdHint && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 8,
              top: 7,
              fontFamily: MONO,
              fontSize: 10,
              color: 'var(--pl-ink-500)',
              border: '1px solid var(--pl-ink-200)',
              borderRadius: 4,
              padding: '1px 5px',
              background: 'var(--pl-paper)',
            }}
          >
            {searchKbdHint}
          </span>
        )}
      </div>

      {onSync && (
        <button
          type="button"
          className="pl-btn pl-btn-ghost"
          style={{ height: 32, padding: '0 12px', fontSize: 13 }}
          onClick={onSync}
          disabled={syncing}
        >
          <span style={{ fontFamily: MONO, fontSize: 12 }}>↻</span>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      )}
      {onNewPrompt && (
        <button
          type="button"
          className="pl-btn pl-btn-primary"
          style={{ height: 32, padding: '0 14px', fontSize: 13 }}
          onClick={onNewPrompt}
        >
          <span style={{ fontFamily: MONO, fontSize: 14, marginTop: -1 }}>+</span> New prompt
        </button>
      )}
    </header>
  );
};
