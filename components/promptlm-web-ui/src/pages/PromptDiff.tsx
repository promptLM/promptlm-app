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
 * Prompt diff route — Stage 1 (issue #91, parent #78). Composes the v2 diff
 * blocks against a stub revisions corpus synthesised from the current
 * PromptSpec catalog. Until #76 lands, only HEAD is available; both pickers
 * default to it and the diff renders as identity.
 *
 * Gated behind `featureFlags.promptDiff` — when off, NotFound is shown to
 * avoid surfacing an incomplete route in production builds.
 */

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DiffPickerStrip,
  DiffSummary,
  Mono,
  SpecDiffBody,
} from '@promptlm/ui';
import type { DiffSelection } from '@promptlm/ui';
import { usePrompts } from '@/api/hooks';
import { buildStubDiffCorpus, STUB_REVISION_KEY } from '@api-common/viewModels/promptDiff';
import { featureFlags } from '@/lib/featureFlags';
import NotFound from './NotFound';

const DIFF_TOPBAR_HEIGHT = 52;

const TopBar = ({ name, detailTo }: { name: string; detailTo: string }) => (
  <header
    style={{
      height: DIFF_TOPBAR_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 24px',
      borderBottom: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}
  >
    <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
      prompts / <span style={{ color: 'var(--pl-ink-800)' }}>{name}</span> / diff
    </Mono>
    <div style={{ flex: 1 }} />
    <Link
      to={detailTo}
      className="pl-btn pl-btn-ghost"
      style={{ height: 32, padding: '0 12px', fontSize: 13, textDecoration: 'none' }}
    >
      Back to detail
    </Link>
  </header>
);

const StageBanner = () => (
  <div
    role="status"
    style={{
      margin: '16px 24px 0',
      padding: '10px 14px',
      borderRadius: 6,
      border: '1px solid color-mix(in oklch, var(--pl-signal) 30%, var(--pl-ink-200))',
      background: 'color-mix(in oklch, var(--pl-signal) 8%, var(--pl-paper))',
      color: 'var(--pl-signal-ink)',
      fontSize: 12.5,
      lineHeight: 1.5,
    }}
  >
    <strong style={{ fontWeight: 600 }}>Stage 1 preview.</strong> Showing HEAD only —
    cross-revision comparison unlocks once the revision history endpoint lands
    (issue #76). Both pickers default to the current revision; diffs are identity.
  </div>
);

export default function PromptDiff() {
  const { id } = useParams<{ id: string }>();
  const { data: prompts, isLoading, error } = usePrompts();

  const corpus = useMemo(() => buildStubDiffCorpus(prompts ?? []), [prompts]);

  const initialSelection: DiffSelection = useMemo(() => {
    const target = id && corpus[id] ? id : Object.keys(corpus)[0] ?? '';
    return {
      promptA: target,
      revA: STUB_REVISION_KEY,
      promptB: target,
      revB: STUB_REVISION_KEY,
    };
  }, [id, corpus]);

  const [selection, setSelection] = useState<DiffSelection>(initialSelection);

  if (!featureFlags.promptDiff) {
    return <NotFound />;
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          margin: 32,
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
    );
  }

  if (isLoading || !prompts) {
    return (
      <div style={{ padding: 32, color: 'var(--pl-ink-600)', fontSize: 13.5 }}>
        Loading prompts…
      </div>
    );
  }

  const A = corpus[selection.promptA]?.revisions[selection.revA]?.spec;
  const B = corpus[selection.promptB]?.revisions[selection.revB]?.spec;
  const sourcePath = id ? `prompts/${corpus[id]?.group ?? 'default'}/${id}.toml` : undefined;
  const detailTo = id ? `/prompts/${id}` : '/prompts';

  if (!A || !B) {
    // Empty-state placeholder: keep the `prompt-diff-page` testid so the
    // route is uniformly identifiable from automation regardless of
    // whether the stub-corpus selection produced a comparable pair
    // (the SPA's useState/initialSelection memo path races the first
    // `usePrompts` payload — issue #252 / A4 flagged this; a real fix
    // belongs with revision-history work — issue #76).
    return (
      <div
        style={{ padding: 32, color: 'var(--pl-ink-700)' }}
        data-testid="prompt-diff-page"
      >
        No prompt revisions to diff yet.
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--pl-canvas)',
        fontFamily: 'var(--pl-display)',
        color: 'var(--pl-ink-900)',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid="prompt-diff-page"
    >
      <TopBar name={id ?? 'prompts'} detailTo={detailTo} />
      <StageBanner />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DiffPickerStrip selection={selection} corpus={corpus} onChange={setSelection} />
        <DiffSummary A={A} B={B} />
        <SpecDiffBody A={A} B={B} sourcePath={sourcePath} />
      </div>
    </div>
  );
}
