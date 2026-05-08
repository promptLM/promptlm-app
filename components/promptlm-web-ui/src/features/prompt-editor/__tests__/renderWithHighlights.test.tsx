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

import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderWithHighlights } from '@promptlm/ui';

const html = (nodes: React.ReactNode[]) =>
  renderToStaticMarkup(React.createElement(React.Fragment, null, ...nodes));

describe('renderWithHighlights', () => {
  it('returns plain string segments for resolved placeholders', () => {
    const out = renderWithHighlights('Hi {{name}}.', {
      values: { name: 'Ada' },
    });
    expect(html(out)).toBe('Hi Ada.');
  });

  it('wraps unresolved placeholders in a span with data-placeholder', () => {
    const out = renderWithHighlights('Hi {{name}}.', { values: {} });
    const markup = html(out);
    expect(markup).toContain('data-placeholder="name"');
    expect(markup).toContain('{{name}}');
  });

  it('mixes resolved and unresolved placeholders in order', () => {
    const out = renderWithHighlights('{{a}} {{b}} {{a}}', {
      values: { a: 'X' },
    });
    const markup = html(out);
    // First and last "a" resolved as "X"; middle "b" highlighted.
    expect(markup.startsWith('X ')).toBe(true);
    expect(markup.endsWith(' X')).toBe(true);
    expect(markup).toContain('data-placeholder="b"');
  });

  it('never emits dangerouslySetInnerHTML — values render as text', () => {
    const out = renderWithHighlights('hi {{name}}', {
      values: { name: '<script>alert(1)</script>' },
    });
    const markup = html(out);
    // `<` from the value must be HTML-encoded by React's text serialization.
    expect(markup).toContain('&lt;script&gt;');
    expect(markup).not.toContain('<script>alert(1)</script>');
  });
});
