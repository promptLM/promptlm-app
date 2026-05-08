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

// Webapp Storybook manager theme. Mirrors components/ui/.storybook/manager.ts
// (single source of truth for the brand colors lives in the comment block
// there). The webapp Storybook serves favicons + OG image from ../public/
// via staticDirs, so we point brandImage at the 192px favicon for the
// brand bar; the smaller 32px renders directly via the linked icons in
// manager-head.html.
//
// See #111 BS-8.

import { create } from '@storybook/theming';
import { addons } from '@storybook/manager-api';

const theme = create({
  base: 'light',
  brandTitle: 'promptLM · webapp',
  brandUrl: 'https://promptlm.dev/',
  brandImage: './favicon-192.png',
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

  // Inputs
  inputBg: '#f8fafc',
  inputBorder: '#e7eaef',
  inputTextColor: '#070e16',
  inputBorderRadius: 6,

  // Color accents
  colorPrimary: '#070e16',
  colorSecondary: '#007cca',
});

addons.setConfig({ theme });
