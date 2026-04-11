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

import type { Decorator, Preview } from '@storybook/react';
import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createPromptLMTheme } from '../src/theme/createPromptLMTheme';

const withTheme: Decorator = (Story, context) => {
  const variant = context.globals.themeVariant ?? 'lightTech';
  const theme = createPromptLMTheme({ variant });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Story />
    </ThemeProvider>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    themeVariant: {
      name: 'Theme',
      description: 'PromptLM theme variant',
      defaultValue: 'lightTech',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'lightTech', title: 'Light' },
          { value: 'darkTech', title: 'Dark' },
        ],
      },
    },
  },
};

export default preview;
