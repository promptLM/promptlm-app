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

import { createTheme } from '@mui/material';
import type { ThemeOptions, Shadows } from '@mui/material/styles';
import { promptLMDesignTokens } from './tokens';
import { getPromptLMThemeVariant, type PromptLMThemeVariant } from './variants';

export type CreatePromptLMThemeOptions = ThemeOptions & {
  variant?: PromptLMThemeVariant;
};

export const createPromptLMTheme = (overrides: CreatePromptLMThemeOptions = {}) => {
  const tokens = promptLMDesignTokens;
  const { variant, ...themeOverrides } = overrides;
  const selectedVariant = getPromptLMThemeVariant(variant);

  const shadows: Shadows = Array.from({ length: 25 }, (_, index) => {
    if (index === 0) return 'none';
    if (index === 1 || index === 2) return tokens.shadows.sm;
    if (index === 3 || index === 4) return tokens.shadows.md;
    return tokens.shadows.lg;
  }) as Shadows;

  const baseTheme: ThemeOptions = {
    palette: {
      mode: selectedVariant.mode,
      primary: {
        main: selectedVariant.palette.primaryMain,
        light: selectedVariant.palette.primaryLight,
        dark: selectedVariant.palette.primaryDark,
        contrastText: selectedVariant.palette.textPrimary,
      },
      secondary: {
        main: selectedVariant.palette.secondaryMain,
        light: tokens.colors.secondary[300],
        dark: tokens.colors.secondary[700],
        contrastText: selectedVariant.palette.textPrimary,
      },
      background: {
        default: selectedVariant.palette.backgroundDefault,
        paper: selectedVariant.palette.backgroundSurface,
      },
      text: {
        primary: selectedVariant.palette.textPrimary,
        secondary: selectedVariant.palette.textSecondary,
      },
      success: {
        main: tokens.colors.success[500],
      },
      warning: {
        main: tokens.colors.warning[500],
      },
      error: {
        main: tokens.colors.error[500],
      },
    },
    shape: {
      borderRadius: tokens.radius.md,
    },
    spacing: tokens.spacing.base,
    shadows,
    typography: {
      fontFamily: tokens.typography.fontFamily,
      fontWeightRegular: tokens.typography.fontWeightRegular,
      fontWeightMedium: tokens.typography.fontWeightMedium,
      fontWeightBold: tokens.typography.fontWeightBold,
      h1: {
        fontFamily: tokens.typography.headingsFontFamily,
        fontWeight: tokens.typography.fontWeightBold,
      },
      h2: {
        fontFamily: tokens.typography.headingsFontFamily,
        fontWeight: tokens.typography.fontWeightBold,
      },
      h3: {
        fontFamily: tokens.typography.headingsFontFamily,
        fontWeight: tokens.typography.fontWeightBold,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': selectedVariant.cssVars,
          body: {
            background: 'var(--plm-shell-background)',
            color: selectedVariant.palette.textPrimary,
          },
          a: {
            color: 'var(--plm-link-color)',
            textDecorationColor: 'var(--plm-link-color)',
            transition: 'color 0.15s ease',
            '&:hover': {
              color: 'var(--plm-link-hover-color)',
              textDecorationColor: 'var(--plm-link-hover-color)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'var(--plm-card-background, ' + selectedVariant.palette.backgroundSurface + ')',
            border: 'var(--plm-card-border, none)',
            boxShadow: 'var(--plm-card-shadow, ' + selectedVariant.elevations.cardShadow + ')',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            // Add MuiButton styles here
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          margin: 'dense',
        },
      },
      MuiFormControl: {
        defaultProps: {
          margin: 'dense',
          size: 'small',
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            marginBottom: tokens.spacing.base * 0.5,
          },
        },
      },
    },
  };

  return createTheme({ ...baseTheme, ...themeOverrides });
};
