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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

import { UnsavedChangesDialog } from '../UnsavedChangesDialog';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Props = React.ComponentProps<typeof UnsavedChangesDialog>;

const renderDialog = async (props: Props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  await act(async () => {
    root.render(<UnsavedChangesDialog {...props} />);
  });
  return {
    container,
    rerender: async (next: Props) => {
      await act(async () => {
        root.render(<UnsavedChangesDialog {...next} />);
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

const findButton = (label: string): HTMLButtonElement | null => {
  const buttons = Array.from(document.body.querySelectorAll('button'));
  return (buttons.find((b) => b.textContent?.trim() === label) as HTMLButtonElement) ?? null;
};

describe('UnsavedChangesDialog', () => {
  it('renders nothing in the document when closed', async () => {
    const harness = await renderDialog({
      open: false,
      onSave: vi.fn(),
      onDiscard: vi.fn(),
      onCancel: vi.fn(),
    });
    try {
      expect(document.body.querySelector('[data-testid="unsaved-changes-dialog"]')).toBeNull();
    } finally {
      await harness.unmount();
    }
  });

  it('renders Save changes / Discard / Cancel buttons when open', async () => {
    const harness = await renderDialog({
      open: true,
      onSave: vi.fn(),
      onDiscard: vi.fn(),
      onCancel: vi.fn(),
    });
    try {
      // Radix portals to document.body, so query there.
      expect(document.body.querySelector('[data-testid="unsaved-changes-dialog"]')).not.toBeNull();
      expect(findButton('Save changes')).not.toBeNull();
      expect(findButton('Discard')).not.toBeNull();
      expect(findButton('Cancel')).not.toBeNull();
    } finally {
      await harness.unmount();
    }
  });

  it('invokes the correct callback on each button click', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const onCancel = vi.fn();
    const harness = await renderDialog({
      open: true,
      onSave,
      onDiscard,
      onCancel,
    });
    try {
      await act(async () => {
        findButton('Save changes')!.click();
      });
      expect(onSave).toHaveBeenCalledTimes(1);

      await act(async () => {
        findButton('Discard')!.click();
      });
      expect(onDiscard).toHaveBeenCalledTimes(1);

      await act(async () => {
        findButton('Cancel')!.click();
      });
      expect(onCancel).toHaveBeenCalledTimes(1);
    } finally {
      await harness.unmount();
    }
  });

  it('disables all actions while saving', async () => {
    const harness = await renderDialog({
      open: true,
      isSaving: true,
      onSave: vi.fn(),
      onDiscard: vi.fn(),
      onCancel: vi.fn(),
    });
    try {
      expect(findButton('Saving…')?.disabled).toBe(true);
      expect(findButton('Discard')?.disabled).toBe(true);
      expect(findButton('Cancel')?.disabled).toBe(true);
    } finally {
      await harness.unmount();
    }
  });
});
