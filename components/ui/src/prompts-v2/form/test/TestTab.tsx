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
 * Test tab parent. Hosts:
 *   - Run controls bar (model label, Run / Re-run, request-changed banner)
 *   - Three drag-resizable regions (placeholders / rendered / output)
 *   - Run history strip (live executions[] for the current request shape)
 *   - History flyover (older runs from the repo-history endpoint, mocked)
 *
 * Drag-resize range: center column 220–640px (per the playbook spec). The
 * prototype's `DEMO:` simulate-request-change affordance has been removed —
 * the parent (or Storybook) flips `requestChanged` explicitly.
 */

import * as React from 'react';
import type { PromptFormDraft } from '../types';
import { OutputRegion, PlaceholderValuesRegion, RenderedPromptRegion } from './regions';
import { RunControlsBar } from './RunControlsBar';
import { RunHistoryStrip } from './RunHistoryStrip';
import { HistoryFlyover } from './HistoryFlyover';
import type { RepoHistoryItem, TestRunRecord } from './types';

const CENTER_MIN = 220;
const CENTER_MAX = 640;
const COLLAPSED_W = 36;

let resizerCssInjected = false;
const ensureResizerCss = () => {
  if (resizerCssInjected || typeof document === 'undefined') return;
  if (document.getElementById('pl-test-tab-css')) {
    resizerCssInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = 'pl-test-tab-css';
  style.textContent = `
    .pft-resizer { width: 4px; cursor: col-resize; background: transparent; transition: background 100ms ease; }
    .pft-resizer:hover, .pft-resizer.dragging { background: var(--pl-signal); }
    .pft-resizer.dragging { background: var(--pl-signal-deep); }
  `;
  document.head.appendChild(style);
  resizerCssInjected = true;
};

const useCenterResize = (initial: number) => {
  const [width, setWidth] = React.useState(initial);
  const [collapsed, setCollapsed] = React.useState(false);
  const [dragging, setDragging] = React.useState<'left' | 'right' | null>(null);

  const startRef = React.useRef<{ x: number; w: number } | null>(null);

  const onPointerDown = (which: 'left' | 'right') => (e: React.PointerEvent) => {
    if (collapsed) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, w: width };
    setDragging(which);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const next = dragging === 'right' ? start.w + dx : start.w - dx;
      setWidth(Math.max(CENTER_MIN, Math.min(CENTER_MAX, next)));
    };
    const onUp = () => {
      setDragging(null);
      startRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  return {
    width,
    collapsed,
    dragging,
    onPointerDownLeft: onPointerDown('left'),
    onPointerDownRight: onPointerDown('right'),
    toggleCollapsed: () => setCollapsed((c) => !c),
  };
};

export interface TestTabProps {
  draft: PromptFormDraft;
  /** Live executions filtered to the current request shape. */
  executions: ReadonlyArray<TestRunRecord>;
  /** Repo-history items for the History flyover (mocked in PR 1). */
  repoHistory: ReadonlyArray<RepoHistoryItem>;
  /** Whether the request shape has changed since the last run on this tab. */
  requestChanged: boolean;
  values: Record<string, string>;
  onChangeValues: (next: Record<string, string>) => void;
  /** Whether values differ from saved defaults. */
  valuesDirty: boolean;
  onSaveValues?: () => void;
  onResetValues?: () => void;
  onRun: () => void;
  onRerun?: () => void;
  /** Run state surfaced to the Output region. */
  runState: 'idle' | 'running' | 'error';
  /** Callback to acknowledge the request-changed banner. */
  onClearRequestChanged?: () => void;
}

export const TestTab: React.FC<TestTabProps> = ({
  draft,
  executions,
  repoHistory,
  requestChanged,
  values,
  onChangeValues,
  valuesDirty,
  onSaveValues,
  onResetValues,
  onRun,
  onRerun,
  runState,
  onClearRequestChanged,
}) => {
  ensureResizerCss();
  const resize = useCenterResize(360);

  const [activeRunId, setActiveRunId] = React.useState<string | null>(
    executions.length > 0 ? executions[0].id : null,
  );
  React.useEffect(() => {
    if (executions.length === 0) {
      setActiveRunId(null);
      return;
    }
    if (!activeRunId || !executions.some((e) => e.id === activeRunId)) {
      setActiveRunId(executions[0].id);
    }
  }, [executions, activeRunId]);

  const [historyOpen, setHistoryOpen] = React.useState(false);

  const activeRun = executions.find((e) => e.id === activeRunId) ?? null;

  const centerStyle: React.CSSProperties = resize.collapsed
    ? { flex: `0 0 ${COLLAPSED_W}px`, display: 'flex' }
    : { flex: `0 0 ${resize.width}px`, display: 'flex', minWidth: CENTER_MIN };

  return (
    <div
      data-testid="test-tab"
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--pl-canvas)',
      }}
    >
      <RunControlsBar
        vendor={draft.request.vendor}
        model={draft.request.model}
        modelSnapshot={draft.request.modelSnapshot || undefined}
        running={runState === 'running'}
        canRerun={executions.length > 0 && !requestChanged}
        requestChanged={requestChanged}
        onRun={onRun}
        onRerun={onRerun}
        onClearRequestChanged={onClearRequestChanged}
        saveStatus={valuesDirty ? 'unsaved' : 'saved'}
      />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <PlaceholderValuesRegion
            placeholders={draft.placeholders.list}
            values={values}
            onChange={onChangeValues}
            dirty={valuesDirty}
            onSave={onSaveValues}
            onResetToDefaults={onResetValues}
          />
        </div>

        <div
          className={`pft-resizer${resize.dragging === 'left' ? ' dragging' : ''}`}
          aria-orientation="vertical"
          role="separator"
          data-testid="test-tab-resizer-left"
          onPointerDown={resize.onPointerDownLeft}
        />

        <div style={centerStyle}>
          <RenderedPromptRegion
            messages={draft.request.messages}
            values={values}
            startPattern={draft.placeholders.startPattern}
            endPattern={draft.placeholders.endPattern}
            collapsed={resize.collapsed}
            onToggleCollapsed={resize.toggleCollapsed}
          />
        </div>

        <div
          className={`pft-resizer${resize.dragging === 'right' ? ' dragging' : ''}`}
          aria-orientation="vertical"
          role="separator"
          data-testid="test-tab-resizer-right"
          onPointerDown={resize.onPointerDownRight}
        />

        <div style={{ flex: 1, minWidth: 280, display: 'flex' }}>
          <OutputRegion run={activeRun} state={runState} />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <RunHistoryStrip
          executions={executions}
          activeId={activeRunId}
          setActiveId={setActiveRunId}
          onViewHistory={() => setHistoryOpen((v) => !v)}
        />
        <HistoryFlyover
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          items={repoHistory}
        />
      </div>
    </div>
  );
};
