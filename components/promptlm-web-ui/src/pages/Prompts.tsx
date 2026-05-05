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

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CatalogFacetRail,
  CatalogList,
  CatalogTopBar,
  Mono,
  type CatalogFacetGroupSpec,
  type CatalogRowItem,
} from '@promptlm/ui';
import { usePrompts } from '@/api/hooks';
import { mapPromptSpecToCatalogRowItem } from '@api-common/viewModels/promptsV2';
import { featureFlags } from '@/lib/featureFlags';
import { useProjectsContext } from '@api-common/projects/ProjectsContext';
import { getProjectName } from '@api-common/projectModel';

type FacetState = {
  group: string | null;
  vendor: string | null;
  status: string | null;
};

const INITIAL_FACETS: FacetState = { group: 'all', vendor: null, status: null };

const buildFacetGroups = (
  prompts: readonly CatalogRowItem[],
  state: FacetState,
): CatalogFacetGroupSpec[] => {
  const countBy = <K extends string>(getter: (p: CatalogRowItem) => K | undefined): Map<K, number> => {
    const map = new Map<K, number>();
    for (const p of prompts) {
      const key = getter(p);
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };

  const vendorCounts = countBy((p) => p.vendor);
  const statusCounts = countBy((p) => p.status);

  const groups: CatalogFacetGroupSpec[] = [
    {
      id: 'group',
      label: 'Group',
      activeId: state.group ?? null,
      items: [
        { id: 'all', label: 'All prompts', count: prompts.length },
      ],
    },
    {
      id: 'vendor',
      label: 'Vendor',
      activeId: state.vendor ?? null,
      items: Array.from(vendorCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, count]) => ({ id, label: capitalize(id), count })),
    },
    {
      id: 'status',
      label: 'Status',
      activeId: state.status ?? null,
      items: Array.from(statusCounts.entries()).map(([id, count]) => ({
        id,
        label: capitalize(id),
        count,
        dot: STATUS_DOT[id as keyof typeof STATUS_DOT],
      })),
    },
  ];
  return groups;
};

const STATUS_DOT = {
  production: 'var(--pl-ok)',
  staging: 'var(--pl-warn)',
  experimental: 'var(--pl-ink-500)',
  failing: 'var(--pl-fail)',
} as const;

const capitalize = (value: string): string =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);

const matchesFilter = (item: CatalogRowItem, state: FacetState, query: string): boolean => {
  if (state.vendor && item.vendor !== state.vendor) return false;
  if (state.status && item.status !== state.status) return false;
  if (!query) return true;
  const haystack = `${item.name} ${item.description} ${item.id}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
};

export default function Prompts() {
  const navigate = useNavigate();
  const { activeProject } = useProjectsContext();
  const { data, isLoading, error, refresh } = usePrompts();
  const [searchQuery, setSearchQuery] = useState('');
  const [facets, setFacets] = useState<FacetState>(INITIAL_FACETS);
  const [syncing, setSyncing] = useState(false);

  const items = useMemo<CatalogRowItem[]>(
    () => (data ?? []).map(mapPromptSpecToCatalogRowItem),
    [data],
  );

  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item, facets, searchQuery.trim())),
    [items, facets, searchQuery],
  );

  const groups = useMemo(() => buildFacetGroups(items, facets), [items, facets]);

  const projectLabel = activeProject ? getProjectName(activeProject) : 'no project';

  const handleSync = async () => {
    setSyncing(true);
    try {
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <CatalogTopBar
        breadcrumb={[projectLabel, 'prompts']}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSync={handleSync}
        syncing={syncing || isLoading}
        onNewPrompt={() => navigate('/prompts/new')}
      />

      {error && (
        <div
          role="alert"
          style={{
            margin: '16px 32px 0',
            padding: '12px 16px',
            background: 'color-mix(in oklch, var(--pl-fail) 8%, var(--pl-paper))',
            border: '1px solid color-mix(in oklch, var(--pl-fail) 30%, var(--pl-ink-200))',
            color: 'oklch(0.42 0.13 25)',
            borderRadius: 'var(--pl-r-md)',
            fontSize: 13.5,
          }}
        >
          Failed to load prompts. {error.message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '212px 1fr',
          flex: 1,
          minHeight: 0,
        }}
      >
        <CatalogFacetRail
          groups={groups}
          onSelect={(groupId, itemId) =>
            setFacets((prev) => ({
              ...prev,
              [groupId]: prev[groupId as keyof FacetState] === itemId ? null : itemId,
            }))
          }
        />

        <main style={{ padding: '24px 32px 64px', overflow: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <div>
              <Mono
                size={11}
                color="var(--pl-ink-500)"
                style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Library
              </Mono>
              <h1
                style={{
                  margin: '2px 0 4px',
                  fontFamily: 'var(--pl-display)',
                  fontSize: 30,
                  fontWeight: 500,
                  letterSpacing: '-0.025em',
                  color: 'var(--pl-ink-900)',
                }}
              >
                Prompts
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--pl-ink-600)' }}>
                {filtered.length} of {items.length} prompts
              </p>
            </div>
          </div>

          <CatalogList
            prompts={filtered}
            onSelect={(prompt) => navigate(`/prompts/${prompt.id}`)}
            showOperational={featureFlags.executionMetrics}
            emptyState={
              <div
                style={{
                  padding: 48,
                  textAlign: 'center',
                  border: '1px dashed var(--pl-ink-300)',
                  borderRadius: 'var(--pl-r-lg)',
                  color: 'var(--pl-ink-600)',
                  fontSize: 14,
                }}
              >
                {items.length === 0
                  ? 'No prompts in this project yet.'
                  : 'No prompts match your filters.'}
              </div>
            }
          />
        </main>
      </div>
    </div>
  );
}
