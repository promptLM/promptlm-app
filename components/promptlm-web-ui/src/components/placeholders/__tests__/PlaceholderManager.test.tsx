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

import { PlaceholderManager, type Placeholder } from '../PlaceholderManager';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderManager = async (props: {
  placeholders: Placeholder[];
  onPlaceholdersChange: (placeholders: Placeholder[]) => void;
}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  await act(async () => {
    root.render(
      <PlaceholderManager
        placeholders={props.placeholders}
        config={{ openSequence: '[[', closeSequence: ']]' }}
        onPlaceholdersChange={props.onPlaceholdersChange}
        onConfigChange={() => {}}
      />,
    );
  });

  return {
    container,
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

describe('PlaceholderManager', () => {
  it('does not expose multi-value cycle affordances', async () => {
    const onPlaceholdersChange = vi.fn();
    const placeholders: Placeholder[] = [
      {
        id: 'placeholder-1',
        name: 'number_one',
        values: ['1', '2'],
        currentValueIndex: 1,
      },
    ];

    const view = await renderManager({ placeholders, onPlaceholdersChange });
    try {
      expect(view.container.querySelector('[title="Click to cycle values"]')).toBeNull();
      expect(view.container.textContent).toContain('1 value');
    } finally {
      await view.unmount();
    }
  });

  it('shows only one effective value even when multiple values are provided', async () => {
    const onPlaceholdersChange = vi.fn();
    const placeholders: Placeholder[] = [
      {
        id: 'placeholder-1',
        name: 'number_one',
        values: ['1', '2', '3'],
        currentValueIndex: 2,
      },
    ];

    const view = await renderManager({ placeholders, onPlaceholdersChange });
    try {
      const preview = view.container.querySelector('[data-testid="placeholder-row-number_one"] p');
      expect(preview?.textContent).toContain('1');
      expect(preview?.textContent).not.toContain('2');
      expect(preview?.textContent).not.toContain('3');
    } finally {
      await view.unmount();
    }
  });
});
