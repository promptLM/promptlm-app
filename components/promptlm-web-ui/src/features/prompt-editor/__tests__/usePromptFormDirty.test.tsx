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

/** @vitest-environment jsdom */

import React, { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

import { usePromptFormDirty } from '../dirtyState';
import { createEmptyPromptDraft, promptEditorReducer } from '../draftState';
import type { PromptEditorState } from '../types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const Harness = ({
  current,
  baseline,
  onChange,
}: {
  current: PromptEditorState;
  baseline: PromptEditorState | null;
  onChange: (isDirty: boolean) => void;
}) => {
  const isDirty = usePromptFormDirty({ current, baseline });
  React.useEffect(() => {
    onChange(isDirty);
  }, [isDirty, onChange]);
  return <span data-testid="dirty">{String(isDirty)}</span>;
};

type HarnessProps = {
  current: PromptEditorState;
  baseline: PromptEditorState | null;
};

const renderHarness = async (initial: HarnessProps) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let lastDirty = false;
  const onChange = (v: boolean) => {
    lastDirty = v;
  };

  await act(async () => {
    root.render(<Harness {...initial} onChange={onChange} />);
  });

  return {
    get isDirty() {
      return lastDirty;
    },
    rerender: async (next: HarnessProps) => {
      await act(async () => {
        root.render(<Harness {...next} onChange={onChange} />);
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('usePromptFormDirty', () => {
  it('reports clean during hydration (baseline === null)', async () => {
    const current = createEmptyPromptDraft();
    const harness = await renderHarness({ current, baseline: null });
    try {
      expect(harness.isDirty).toBe(false);
    } finally {
      await harness.unmount();
    }
  });

  it('reports clean once baseline matches current state', async () => {
    const baseline = createEmptyPromptDraft();
    const current = createEmptyPromptDraft();
    const harness = await renderHarness({ current, baseline });
    try {
      expect(harness.isDirty).toBe(false);
    } finally {
      await harness.unmount();
    }
  });

  it('flips to dirty when current diverges from baseline, and clears when baseline catches up', async () => {
    const baseline = createEmptyPromptDraft();
    const edited = promptEditorReducer(baseline, {
      type: 'update-metadata',
      field: 'description',
      value: 'changed',
    });

    const harness = await renderHarness({ current: edited, baseline });
    try {
      expect(harness.isDirty).toBe(true);
      await harness.rerender({ current: edited, baseline: edited });
      expect(harness.isDirty).toBe(false);
    } finally {
      await harness.unmount();
    }
  });
});
