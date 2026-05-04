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

export type EditorMode = 'create' | 'edit';

export interface EditorTopBarMessage {
  severity: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

export interface EditorTopBarProps {
  mode: EditorMode;
  /** Breadcrumb segments leading to the prompt; last is rendered emphasised. */
  breadcrumb: readonly string[];
  /** Disable the save action (busy / pending requests). */
  isBusy?: boolean;
  /** Save button is in-flight. */
  isSaving?: boolean;
  /** Release button is in-flight. */
  isReleasing?: boolean;
  /** Inline messages rendered under the breadcrumb (errors, info). */
  messages?: readonly EditorTopBarMessage[];
  /** Save action label override (defaults to "Save prompt"). */
  saveLabel?: string;
  /** Release action label override (defaults to "Release"). */
  releaseLabel?: string;
  onSave: () => void;
  /** Optional release action; omitted in create mode. */
  onRelease?: () => void;
  onBack?: () => void;
}

const SEVERITY_TONES: Record<EditorTopBarMessage['severity'], { bg: string; bd: string; fg: string }> = {
  info: {
    bg: 'color-mix(in oklch, var(--pl-signal) 8%, var(--pl-paper))',
    bd: 'color-mix(in oklch, var(--pl-signal) 30%, var(--pl-ink-200))',
    fg: 'var(--pl-signal-ink)',
  },
  success: {
    bg: 'color-mix(in oklch, var(--pl-ok) 10%, var(--pl-paper))',
    bd: 'color-mix(in oklch, var(--pl-ok) 35%, var(--pl-ink-200))',
    fg: 'oklch(0.32 0.10 155)',
  },
  warning: {
    bg: 'color-mix(in oklch, var(--pl-warn) 14%, var(--pl-paper))',
    bd: 'color-mix(in oklch, var(--pl-warn) 40%, var(--pl-ink-200))',
    fg: 'oklch(0.42 0.10 75)',
  },
  error: {
    bg: 'color-mix(in oklch, var(--pl-fail) 10%, var(--pl-paper))',
    bd: 'color-mix(in oklch, var(--pl-fail) 35%, var(--pl-ink-200))',
    fg: 'oklch(0.42 0.13 25)',
  },
};

/**
 * Sticky topbar for the prompt editor. Mirrors the visual language of
 * `CatalogTopBar` so the editor doesn't feel like a different app — same
 * 52px height, same hairline border, same breadcrumb treatment. Inline
 * messages slot below the breadcrumb at the same height as the buttons.
 */
export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  mode,
  breadcrumb,
  isBusy = false,
  isSaving = false,
  isReleasing = false,
  messages = [],
  saveLabel = 'Save prompt',
  releaseLabel = 'Release',
  onSave,
  onRelease,
  onBack,
}) => {
  const last = breadcrumb[breadcrumb.length - 1];
  const lead = breadcrumb.slice(0, -1);
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--pl-paper)',
        borderBottom: '1px solid var(--pl-ink-200)',
      }}
    >
      <header
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
        }}
      >
        <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
          {lead.length > 0 && <>{lead.join(' · ')} / </>}
          <span style={{ color: 'var(--pl-ink-800)' }}>{last}</span>
        </Mono>

        <div style={{ flex: 1 }} />

        {onBack && (
          <button
            type="button"
            className="pl-btn pl-btn-ghost"
            style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            onClick={onBack}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="pl-btn pl-btn-primary"
          style={{ height: 32, padding: '0 14px', fontSize: 13 }}
          onClick={onSave}
          disabled={isBusy || isSaving}
        >
          {isSaving ? 'Saving…' : saveLabel}
        </button>
        {mode === 'edit' && onRelease && (
          <button
            type="button"
            className="pl-btn pl-btn-ghost"
            style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            onClick={onRelease}
            disabled={isBusy || isReleasing}
          >
            {isReleasing ? 'Releasing…' : releaseLabel}
          </button>
        )}
      </header>

      {messages.length > 0 && (
        <div
          role="status"
          style={{ padding: '0 24px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {messages.map((m, i) => {
            const tone = SEVERITY_TONES[m.severity];
            return (
              <div
                key={`${m.severity}-${i}`}
                style={{
                  fontSize: 12.5,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: tone.bg,
                  border: `1px solid ${tone.bd}`,
                  color: tone.fg,
                }}
              >
                {m.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
