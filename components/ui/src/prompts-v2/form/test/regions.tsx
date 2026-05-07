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
 * Test-tab regions ported from design/handoff/webui/src/prompt-form-test-tab.jsx.
 *
 * The prototype's `DEMO:` simulate-request-change affordance has been
 * stripped per the issue body — replaced with controlled props so the parent
 * (or Storybook) can flip the request-changed banner explicitly.
 */

import * as React from 'react';
import { FormMono, TextArea, GhostButton } from '../atoms';
import type { FormPlaceholder } from '../types';
import { renderWithHighlights } from './renderWithHighlights';
import type { TestRunRecord, TestRunStatus } from './types';

const dotColor = (status: TestRunStatus): string =>
  status === 'ok' ? 'var(--pl-ok)' : status === 'error' ? 'var(--pl-fail)' : 'var(--pl-warn)';

const RegionShell: React.FC<{
  testId: string;
  title: React.ReactNode;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}> = ({ testId, title, children, rightSlot }) => (
  <section
    className="pft-region"
    data-testid={testId}
    style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--pl-ink-200)',
      borderRight: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}
  >
    <header
      className="pft-region-header"
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--pl-ink-200)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <FormMono size={10} color="var(--pl-ink-500)" style={{ flex: 1, letterSpacing: '0.06em' }}>
        {title}
      </FormMono>
      {rightSlot}
    </header>
    <div className="pft-region-body" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      {children}
    </div>
  </section>
);

export interface PlaceholderValuesRegionProps {
  placeholders: ReadonlyArray<FormPlaceholder>;
  values: Readonly<Record<string, string>>;
  onChange: (next: Record<string, string>) => void;
  /** When true, the user has unsaved value edits since last save. */
  dirty: boolean;
  onSave?: () => void;
  onResetToDefaults?: () => void;
}

export const PlaceholderValuesRegion: React.FC<PlaceholderValuesRegionProps> = ({
  placeholders,
  values,
  onChange,
  dirty,
  onSave,
  onResetToDefaults,
}) => (
  <RegionShell
    testId="test-tab-placeholders"
    title="PLACEHOLDERS"
    rightSlot={
      <>
        {dirty && onSave ? (
          <GhostButton mini onClick={onSave}>
            Save
          </GhostButton>
        ) : null}
        {onResetToDefaults ? (
          <GhostButton mini onClick={onResetToDefaults}>
            Reset
          </GhostButton>
        ) : null}
      </>
    }
  >
    {placeholders.length === 0 ? (
      <FormMono size={11} color="var(--pl-ink-500)">
        no placeholders defined.
      </FormMono>
    ) : (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {placeholders.map((p) => (
          <li key={p.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <FormMono size={11} color="var(--pl-ink-900)">
                {p.name}
              </FormMono>
              <FormMono size={10} color={p.required ? 'var(--pl-fail)' : 'var(--pl-ink-500)'}>
                {p.required ? 'required' : 'optional'}
              </FormMono>
              <FormMono size={10} color="var(--pl-ink-500)">
                {p.type}
              </FormMono>
            </div>
            {p.description ? (
              <FormMono size={11} color="var(--pl-ink-600)" style={{ display: 'block', marginBottom: 4 }}>
                {p.description}
              </FormMono>
            ) : null}
            <TextArea
              value={values[p.name] ?? ''}
              onChange={(v: string) => onChange({ ...values, [p.name]: v })}
              rows={3}
              ariaLabel={`value for ${p.name}`}
            />
          </li>
        ))}
      </ul>
    )}
  </RegionShell>
);

export interface RenderedPromptRegionProps {
  /** Messages from `draft.request.messages`. */
  messages: ReadonlyArray<{ role: string; content: string }>;
  values: Readonly<Record<string, string>>;
  startPattern: string;
  endPattern: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export const RenderedPromptRegion: React.FC<RenderedPromptRegionProps> = ({
  messages,
  values,
  startPattern,
  endPattern,
  collapsed,
  onToggleCollapsed,
}) => {
  if (collapsed) {
    return (
      <button
        type="button"
        className="pft-collapsed-strip"
        onClick={onToggleCollapsed}
        data-testid="test-tab-rendered-collapsed"
        style={{
          width: 36,
          flex: '0 0 36px',
          background: 'var(--pl-ink-100)',
          border: 'none',
          borderLeft: '1px solid var(--pl-ink-200)',
          borderRight: '1px solid var(--pl-ink-200)',
          color: 'var(--pl-ink-600)',
          fontFamily: 'var(--pl-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          padding: '14px 0',
        }}
      >
        rendered prompt ›
      </button>
    );
  }
  return (
    <RegionShell
      testId="test-tab-rendered"
      title="RENDERED PROMPT"
      rightSlot={
        <GhostButton mini onClick={onToggleCollapsed}>
          collapse
        </GhostButton>
      }
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <li key={i} style={{ borderTop: i === 0 ? 'none' : '1px dashed var(--pl-ink-200)', paddingTop: i === 0 ? 0 : 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: m.role === 'system' ? 'var(--pl-signal-deep)' : m.role === 'user' ? 'var(--pl-signal)' : 'var(--pl-ok)',
                }}
              />
              <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.08em' }}>
                {m.role.toUpperCase()}
              </FormMono>
            </div>
            <div
              style={{
                fontFamily: 'var(--pl-mono)',
                fontSize: 12,
                lineHeight: 1.55,
                color: 'var(--pl-ink-900)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {renderWithHighlights(m.content, { startPattern, endPattern, values })}
            </div>
          </li>
        ))}
      </ul>
    </RegionShell>
  );
};

export interface OutputRegionProps {
  run: TestRunRecord | null;
  state: 'idle' | 'running' | 'error';
}

export const OutputRegion: React.FC<OutputRegionProps> = ({ run, state }) => (
  <RegionShell testId="test-tab-output" title="OUTPUT">
    {state === 'running' ? (
      <FormMono size={11} color="var(--pl-ink-500)">
        running…
      </FormMono>
    ) : !run ? (
      <FormMono size={11} color="var(--pl-ink-500)">
        no run yet — click Run to execute.
      </FormMono>
    ) : run.status === 'error' ? (
      <div
        data-testid="test-tab-output-error"
        style={{
          border: '1px solid oklch(0.85 0.10 25)',
          borderRadius: 4,
          padding: '8px 10px',
          background: 'oklch(0.98 0.03 25)',
          color: 'oklch(0.42 0.16 25)',
        }}
      >
        <FormMono size={11} color="inherit">
          {run.errorMessage ?? 'run failed'}
        </FormMono>
      </div>
    ) : (
      <>
        <div
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 12,
            lineHeight: 1.55,
            color: 'var(--pl-ink-900)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: 12,
          }}
        >
          {run.assistantText}
        </div>
        {run.toolCalls && run.toolCalls.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {run.toolCalls.map((tc, i) => (
              <li
                key={i}
                style={{
                  border: '1px solid var(--pl-ink-200)',
                  borderRadius: 4,
                  padding: '6px 8px',
                }}
              >
                <FormMono size={11} color="var(--pl-ink-700)">
                  {tc.name}
                </FormMono>
                <div style={{ marginTop: 2 }}>
                  <FormMono size={11} color="var(--pl-ink-500)">
                    {tc.preview}
                  </FormMono>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <footer style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor(run.status) }} />
          <FormMono size={10} color="var(--pl-ink-500)">
            {(run.durationMs / 1000).toFixed(2)}s · {run.tokensIn}in / {run.tokensOut}out
          </FormMono>
        </footer>
      </>
    )}
  </RegionShell>
);
