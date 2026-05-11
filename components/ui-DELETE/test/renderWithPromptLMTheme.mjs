import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPromptLMTheme } from '../dist/index.js';

export const renderWithPromptLMTheme = (node) =>
  renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      { theme: createPromptLMTheme({ variant: 'lightTech' }) },
      React.createElement(CssBaseline, null),
      node,
    ),
  );
