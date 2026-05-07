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
 * Two-tab strip below the form's sticky header.
 *
 * Source of truth: design/handoff/webui/src/prompt-form.jsx (Tab strip section
 * + sticky positioning rules). Sticky `top: 50` per the spec — that puts it
 * just below the 56-px sticky header without overlapping.
 */

import * as React from 'react';
import { FormMono } from './atoms';

export type FormTabId = 'editor' | 'test';

export interface TabStripProps {
  active: FormTabId;
  onChange: (tab: FormTabId) => void;
  /** When > 0, the Test tab shows a small numeric badge. */
  testRunCount?: number;
  testId?: string;
}

const TabButton: React.FC<{
  id: FormTabId;
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}> = ({ id, active, onClick, badge, children }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    data-testid={`form-tab-${id}`}
    data-active={active ? 'true' : 'false'}
    style={{
      position: 'relative',
      padding: '10px 16px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: active ? 'var(--pl-ink-900)' : 'var(--pl-ink-600)',
      fontFamily: 'var(--pl-display)',
      fontSize: 13,
      fontWeight: active ? 500 : 400,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    {children}
    {badge && badge > 0 ? (
      <FormMono
        size={10}
        color="var(--pl-ink-600)"
        style={{
          padding: '1px 6px',
          background: 'var(--pl-ink-100)',
          borderRadius: 999,
        }}
      >
        {badge}
      </FormMono>
    ) : null}
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: -1,
        height: 2,
        background: active ? 'var(--pl-ink-900)' : 'transparent',
        borderRadius: 2,
      }}
    />
  </button>
);

export const TabStrip: React.FC<TabStripProps> = ({
  active,
  onChange,
  testRunCount = 0,
  testId = 'prompt-form-tab-strip',
}) => (
  <div
    role="tablist"
    aria-label="Prompt form tabs"
    data-testid={testId}
    style={{
      position: 'sticky',
      top: 50,
      zIndex: 9,
      background: 'var(--pl-paper)',
      borderBottom: '1px solid var(--pl-ink-200)',
      paddingLeft: 20,
      display: 'flex',
      alignItems: 'flex-end',
      gap: 4,
    }}
  >
    <TabButton id="editor" active={active === 'editor'} onClick={() => onChange('editor')}>
      Editor
    </TabButton>
    <TabButton
      id="test"
      active={active === 'test'}
      onClick={() => onChange('test')}
      badge={testRunCount}
    >
      Test
    </TabButton>
  </div>
);
