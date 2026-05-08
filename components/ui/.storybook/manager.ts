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

// Storybook manager-side theme. Aligns the chrome around the stories
// (sidebar, toolbar, brand bar) with the promptLM brand. Hex values are
// resolved from the canonical pl-* oklch tokens in
// design/handoff/brand/tokens.css (same conversion path used for the
// favicon / OG renders in #111 BS-5 and BS-6):
//
//   pl-paper        oklch(0.985 0.003 240)  -> #f8fafc
//   pl-ink-900      oklch(0.16  0.02  250)  -> #070e16
//   pl-ink-600      oklch(0.45  0.015 250)  -> #5a626d  (approx)
//   pl-ink-200      oklch(0.92  0.006 240)  -> #e7eaef  (approx)
//   pl-signal-deep  oklch(0.55  0.18  235)  -> #007cca
//
// We can't use CSS variables here — Storybook's manager UI is its own
// React app and the theme object is consumed at construction time, so the
// values have to be inlined. When tokens.css moves, propagate by re-running
// the BS-2 audit in #111 and editing this file.
//
// See #111 BS-8.

import { create } from '@storybook/theming';
import { addons } from '@storybook/manager-api';

const theme = create({
  base: 'light',
  brandTitle: 'promptLM',
  brandUrl: 'https://promptlm.dev/',
  brandImage: './favicon.svg',
  brandTarget: '_self',

  // Surfaces
  appBg: '#f8fafc',
  appContentBg: '#f8fafc',
  appPreviewBg: '#f8fafc',
  appBorderColor: '#e7eaef',
  appBorderRadius: 8,

  // Type
  fontBase: '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',

  // Body text
  textColor: '#070e16',
  textInverseColor: '#f8fafc',
  textMutedColor: '#5a626d',

  // Toolbar
  barTextColor: '#5a626d',
  barHoverColor: '#007cca',
  barSelectedColor: '#070e16',
  barBg: '#f8fafc',

  // Inputs (search field, addon panels)
  inputBg: '#f8fafc',
  inputBorder: '#e7eaef',
  inputTextColor: '#070e16',
  inputBorderRadius: 6,

  // Color accents
  colorPrimary: '#070e16',
  colorSecondary: '#007cca',
});

addons.setConfig({ theme });
