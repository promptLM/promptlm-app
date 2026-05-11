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
import { CATALOG_GRID_COLUMNS, CatalogRow } from './CatalogRow';
import type { CatalogRowItem } from './types';

export interface CatalogListProps {
  prompts: readonly CatalogRowItem[];
  /** ID of the prompt to render highlighted. */
  highlightedId?: string;
  onSelect?: (prompt: CatalogRowItem) => void;
  /** Hide operational columns when no execution data is wired. */
  showOperational?: boolean;
  /** Optional empty-state node when `prompts` is empty. */
  emptyState?: React.ReactNode;
}

const HEADER_LABELS = ['Prompt', 'Model', 'Status', 'Executions', 'p95', ''] as const;

export const CatalogList: React.FC<CatalogListProps> = ({
  prompts,
  highlightedId,
  onSelect,
  showOperational = true,
  emptyState,
}) => {
  if (prompts.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: CATALOG_GRID_COLUMNS,
          padding: '0 16px 8px',
          borderBottom: '1px solid var(--pl-ink-200)',
          gap: 16,
        }}
      >
        {HEADER_LABELS.map((label, i) => (
          <Mono
            key={label || `col-${i}`}
            size={10.5}
            color="var(--pl-ink-500)"
            style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            {label}
          </Mono>
        ))}
      </div>
      <div role="list">
        {prompts.map((p) => (
          <CatalogRow
            key={p.id}
            prompt={p}
            highlighted={p.id === highlightedId}
            onSelect={onSelect}
            showOperational={showOperational}
          />
        ))}
      </div>
    </div>
  );
};
