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
 * Release-flow side rail. Slides in from the right (~420px, semi-modal) when
 * the user clicks the Release CTA in the form's sticky header.
 *
 * Source of truth: design/handoff/playbook/surfaces/release-flow.html.
 *
 * The rail is fully controlled — the parent owns the state machine and just
 * passes the current `state` and callbacks. This makes Storybook trivial and
 * keeps PR 2 (real backend wiring) tightly scoped to the parent's reducer.
 */

import * as React from 'react';
import { FormMono, GhostButton, PrimaryButton } from '../atoms';
import type { ReleaseGateResult } from '../releaseGates';

export type ReleaseRailState =
  | 'idle'
  | 'saving'
  | 'running'
  | 'released'
  | 'blocked-prompt'
  | 'blocked-infra';

export interface ReleaseRailDiffSummary {
  /** Plain summary like "3 messages changed · 1 placeholder added · model unchanged". */
  summary: string;
  /** Optional handler for the "View diff" link. */
  onViewDiff?: () => void;
}

export interface ReleaseRailLastRun {
  /** "ok" / "error" / "pending" — colours the dot. */
  status: 'ok' | 'error' | 'pending';
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  /** "View in Test tab" link handler. */
  onView?: () => void;
}

export interface ReleaseRailProps {
  open: boolean;
  state: ReleaseRailState;
  /** Display string for the current version (e.g. "1.8.0"). */
  currentVersion: string;
  /** Display string for the next version after release (e.g. "1.9.0"). */
  nextVersion: string;
  /** Pre-release checks — typically the four gates from `evaluateReleaseGates`. */
  gates: ReadonlyArray<ReleaseGateResult>;
  diff: ReleaseRailDiffSummary | null;
  lastRun: ReleaseRailLastRun | null;
  /** When `state` is 'blocked-prompt' or 'blocked-infra', the message body. */
  errorMessage?: string;
  onRelease: () => void;
  onCancel: () => void;
  onClose: () => void;
  onRetry?: () => void;
  testId?: string;
}

const dotColor = (status: ReleaseRailLastRun['status']): string => {
  switch (status) {
    case 'ok':
      return 'var(--pl-ok)';
    case 'error':
      return 'var(--pl-fail)';
    default:
      return 'var(--pl-warn)';
  }
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-block',
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color,
      flex: '0 0 auto',
    }}
  />
);

const Spinner: React.FC = () => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-block',
      width: 11,
      height: 11,
      border: '1.5px solid var(--pl-ink-300)',
      borderTopColor: 'var(--pl-signal-deep)',
      borderRadius: '50%',
      animation: 'pl-rail-spin 700ms linear infinite',
    }}
  />
);

let railCssInjected = false;
const ensureRailCss = () => {
  if (railCssInjected || typeof document === 'undefined') return;
  if (document.getElementById('pl-release-rail-css')) {
    railCssInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = 'pl-release-rail-css';
  style.textContent = `
    @keyframes pl-rail-spin { to { transform: rotate(360deg); } }
    .pl-release-rail-overlay {
      position: fixed; inset: 0; background: oklch(0.20 0.02 250 / 0.32);
      z-index: 49; opacity: 0; pointer-events: none; transition: opacity 140ms ease;
    }
    .pl-release-rail-overlay.open { opacity: 1; pointer-events: auto; }
    .pl-release-rail {
      position: fixed; top: 0; right: 0; bottom: 0; width: 420px; z-index: 50;
      background: var(--pl-paper); border-left: 1px solid var(--pl-ink-200);
      box-shadow: var(--pl-shadow-lg);
      transform: translateX(100%); transition: transform 180ms ease;
      display: flex; flex-direction: column;
    }
    .pl-release-rail.open { transform: translateX(0); }
  `;
  document.head.appendChild(style);
  railCssInjected = true;
};

const stateBanner = (state: ReleaseRailState): { label: string; tone: 'idle' | 'progress' | 'ok' | 'fail' } | null => {
  switch (state) {
    case 'saving':
      return { label: 'Saving draft…', tone: 'progress' };
    case 'running':
      return { label: 'Running pre-release check…', tone: 'progress' };
    case 'released':
      return { label: 'Released', tone: 'ok' };
    case 'blocked-prompt':
      return { label: 'Blocked — prompt failed pre-release check', tone: 'fail' };
    case 'blocked-infra':
      return { label: 'Blocked — infrastructure error', tone: 'fail' };
    default:
      return null;
  }
};

export const ReleaseRail: React.FC<ReleaseRailProps> = ({
  open,
  state,
  currentVersion,
  nextVersion,
  gates,
  diff,
  lastRun,
  errorMessage,
  onRelease,
  onCancel,
  onClose,
  onRetry,
  testId = 'release-rail',
}) => {
  ensureRailCss();
  const banner = stateBanner(state);
  const isBusy = state === 'saving' || state === 'running';
  const isBlocked = state === 'blocked-prompt' || state === 'blocked-infra';

  return (
    <>
      <div
        className={`pl-release-rail-overlay${open ? ' open' : ''}`}
        onClick={open ? onClose : undefined}
        aria-hidden={!open}
      />
      <aside
        className={`pl-release-rail${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Release flow"
        aria-modal="true"
        data-testid={testId}
        data-state={state}
      >
        <header
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--pl-ink-200)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <FormMono size={11} color="var(--pl-ink-500)" style={{ flex: 1 }}>
            release{' '}
            <span style={{ color: 'var(--pl-ink-900)' }}>v{currentVersion}</span>{' '}
            →{' '}
            <span style={{ color: 'var(--pl-ink-900)' }}>v{nextVersion}</span>
          </FormMono>
          <GhostButton onClick={onClose} mini>
            ×
          </GhostButton>
        </header>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {banner ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 4,
                background:
                  banner.tone === 'fail'
                    ? 'oklch(0.97 0.04 25)'
                    : banner.tone === 'ok'
                    ? 'oklch(0.97 0.04 155)'
                    : 'var(--pl-ink-100)',
                color:
                  banner.tone === 'fail'
                    ? 'oklch(0.42 0.16 25)'
                    : banner.tone === 'ok'
                    ? 'oklch(0.36 0.13 155)'
                    : 'var(--pl-ink-700)',
              }}
              data-testid="release-rail-banner"
            >
              {banner.tone === 'progress' ? <Spinner /> : null}
              {banner.tone === 'ok' ? <Dot color="var(--pl-ok)" /> : null}
              {banner.tone === 'fail' ? <Dot color="var(--pl-fail)" /> : null}
              <FormMono size={11} color="inherit">
                {banner.label}
              </FormMono>
            </div>
          ) : null}

          <section data-testid="release-rail-checks">
            <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
              PRE-RELEASE CHECKS
            </FormMono>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {gates.map((g) => (
                <li
                  key={g.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  data-testid={`release-rail-check-${g.id}`}
                  data-passed={g.passed ? 'true' : 'false'}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 14,
                      display: 'inline-flex',
                      justifyContent: 'center',
                      color: g.passed ? 'var(--pl-ok)' : 'var(--pl-fail)',
                      fontFamily: 'var(--pl-mono)',
                      fontSize: 12,
                    }}
                  >
                    {g.passed ? '✓' : '✗'}
                  </span>
                  <FormMono size={11} color={g.passed ? 'var(--pl-ink-700)' : 'var(--pl-ink-900)'}>
                    {g.tooltip}
                  </FormMono>
                </li>
              ))}
            </ul>
          </section>

          {diff ? (
            <section data-testid="release-rail-diff">
              <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
                DIFF SUMMARY
              </FormMono>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FormMono size={11} color="var(--pl-ink-700)" style={{ flex: 1 }}>
                  {diff.summary}
                </FormMono>
                {diff.onViewDiff ? (
                  <GhostButton mini onClick={diff.onViewDiff}>
                    View diff
                  </GhostButton>
                ) : null}
              </div>
            </section>
          ) : null}

          {lastRun ? (
            <section data-testid="release-rail-last-run">
              <FormMono size={10} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
                LAST TEST RUN
              </FormMono>
              <div
                style={{
                  marginTop: 6,
                  border: '1px solid var(--pl-ink-200)',
                  borderRadius: 4,
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Dot color={dotColor(lastRun.status)} />
                <FormMono size={11} color="var(--pl-ink-700)" style={{ flex: 1 }}>
                  {(lastRun.durationMs / 1000).toFixed(2)}s · {lastRun.tokensIn}in / {lastRun.tokensOut}out
                </FormMono>
                {lastRun.onView ? (
                  <GhostButton mini onClick={lastRun.onView}>
                    View in Test tab
                  </GhostButton>
                ) : null}
              </div>
            </section>
          ) : null}

          {isBlocked ? (
            <section
              data-testid="release-rail-error"
              style={{
                border: '1px solid oklch(0.85 0.10 25)',
                borderRadius: 4,
                padding: '10px 12px',
                background: 'oklch(0.98 0.03 25)',
                color: 'oklch(0.42 0.16 25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <FormMono size={11} color="inherit">
                {errorMessage ?? 'Release blocked — see message above.'}
              </FormMono>
              {onRetry ? (
                <div>
                  <GhostButton mini onClick={onRetry}>
                    {state === 'blocked-infra' ? 'Retry' : 'Try again'}
                  </GhostButton>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--pl-ink-200)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <GhostButton onClick={onCancel} disabled={isBusy}>
            Cancel
          </GhostButton>
          <PrimaryButton
            onClick={onRelease}
            disabled={isBusy || state === 'released' || gates.some((g) => !g.passed)}
            testId="release-rail-confirm"
          >
            {state === 'saving' ? 'Saving…' : state === 'running' ? 'Releasing…' : 'Release'}
          </PrimaryButton>
        </footer>
      </aside>
    </>
  );
};
