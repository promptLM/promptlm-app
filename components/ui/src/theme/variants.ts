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

export type PromptLMThemeVariant = 'lightTech' | 'darkAurora';

export type PromptLMThemeVariantConfig = {
  mode: 'light' | 'dark';
  palette: {
    primaryMain: string;
    primaryDark: string;
    primaryLight: string;
    secondaryMain: string;
    backgroundDefault: string;
    backgroundSurface: string;
    textPrimary: string;
    textSecondary: string;
    divider: string;
  };
  elevations: {
    cardShadow: string;
  };
  cssVars: Record<string, string>;
};

export const promptLMThemeVariants: Record<PromptLMThemeVariant, PromptLMThemeVariantConfig> = {
  lightTech: {
    mode: 'light',
    palette: {
      primaryMain: '#b0caff',
      primaryDark: '#1C3F7A',
      primaryLight: '#4A74C1',
      secondaryMain: '#5A6ACF',
      backgroundDefault: '#F4F6FA',
      backgroundSurface: '#FFFFFF',
      textPrimary: '#1F2434',
      textSecondary: '#586273',
      divider: '#D6DEEC',
    },
    elevations: {
      cardShadow: '0 16px 40px -20px rgba(25, 54, 104, 0.24)',
    },
    cssVars: {
      '--plm-shell-background': 'linear-gradient(135deg, #F4F6FA 0%, #E9ECF3 100%)',
      '--plm-shell-surface': '#FFFFFF',
      '--plm-shell-border': '1px solid rgba(214, 222, 236, 0.6)',
      '--plm-nav-background': 'rgba(246, 248, 252, 0.92)',
      '--plm-nav-border': '1px solid rgba(203, 213, 225, 0.6)',
      '--plm-nav-hover': 'rgba(46, 90, 172, 0.08)',
      '--plm-nav-active': 'rgba(46, 90, 172, 0.12)',
      '--plm-nav-active-indicator': '#2E5AAC',
      '--plm-appbar-background': 'rgba(255, 255, 255, 0.82)',
      '--plm-appbar-border': '1px solid rgba(203, 213, 225, 0.6)',
      '--plm-appbar-backdrop': 'blur(12px)',
      '--plm-text-primary': '#1F2434',
      '--plm-text-secondary': '#586273',
      '--plm-link-color': '#2E5AAC',
      '--plm-link-hover-color': '#23478C',
      '--plm-card-background': 'linear-gradient(180deg, rgba(46, 90, 172, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
      '--plm-card-border': '1px solid rgba(214, 222, 236, 0.7)',
      '--plm-card-shadow': '0 20px 45px -28px rgba(19, 33, 68, 0.35)',
      '--plm-table-header-bg': 'rgba(226, 232, 240, 0.6)',
      '--plm-table-row-hover': 'rgba(46, 90, 172, 0.06)',
      '--plm-border-soft': 'rgba(210, 220, 238, 0.9)',
      '--plm-content-max-width': '1320px',
      '--plm-button-primary-bg': 'linear-gradient(135deg, #4A8DFF 0%, #6EA5FF 100%)',
      '--plm-button-primary-hover-bg': 'linear-gradient(135deg, #3C79E0 0%, #5A95F0 100%)',
      '--plm-button-primary-text': '#FFFFFF',
    },
  },
  darkAurora: {
    mode: 'dark',
    palette: {
      primaryMain: '#5EF0FF',
      primaryDark: '#1D9FAF',
      primaryLight: '#8BFAFF',
      secondaryMain: '#A855F7',
      backgroundDefault: '#070817',
      backgroundSurface: '#10142B',
      textPrimary: '#F6F8FF',
      textSecondary: '#8FA6FF',
      divider: 'rgba(94, 140, 255, 0.32)',
    },
    elevations: {
      cardShadow: '0 20px 45px -28px rgba(5, 9, 24, 0.65)',
    },
    cssVars: {
      '--plm-shell-background': 'linear-gradient(160deg, #05060f 0%, #101734 55%, #16254f 100%)',
      '--plm-shell-surface': '#10142B',
      '--plm-shell-border': '1px solid rgba(72, 103, 180, 0.35)',
      '--plm-nav-background': 'rgba(16, 20, 43, 0.96)',
      '--plm-nav-border': '1px solid rgba(72, 103, 180, 0.35)',
      '--plm-nav-hover': 'rgba(94, 240, 255, 0.14)',
      '--plm-nav-active': 'rgba(94, 240, 255, 0.22)',
      '--plm-nav-active-indicator': '#5EF0FF',
      '--plm-appbar-background': 'rgba(10, 14, 32, 0.88)',
      '--plm-appbar-border': '1px solid rgba(72, 103, 180, 0.35)',
      '--plm-appbar-backdrop': 'blur(14px)',
      '--plm-text-primary': '#F6F8FF',
      '--plm-text-secondary': '#8FA6FF',
      '--plm-link-color': '#5EF0FF',
      '--plm-link-hover-color': '#8BFAFF',
      '--plm-card-background': 'linear-gradient(185deg, rgba(94, 240, 255, 0.12) 0%, rgba(16, 20, 43, 0.94) 100%)',
      '--plm-card-border': '1px solid rgba(94, 140, 255, 0.38)',
      '--plm-card-shadow': '0 28px 60px -26px rgba(6, 12, 30, 0.75)',
      '--plm-table-header-bg': 'rgba(24, 33, 66, 0.85)',
      '--plm-table-row-hover': 'rgba(94, 240, 255, 0.16)',
      '--plm-border-soft': 'rgba(72, 103, 180, 0.55)',
      '--plm-content-max-width': '1320px',
      '--plm-button-primary-bg': 'linear-gradient(135deg, #5EF0FF 0%, #7AF6FF 60%, #A855F7 100%)',
      '--plm-button-primary-hover-bg': 'linear-gradient(135deg, #46d5e6 0%, #5EF0FF 55%, #9338f0 100%)',
      '--plm-button-primary-text': '#ffffff',
    },
  },
};

export const defaultPromptLMThemeVariant: PromptLMThemeVariant = 'lightTech';

export const getPromptLMThemeVariant = (variant: PromptLMThemeVariant = defaultPromptLMThemeVariant) =>
  promptLMThemeVariants[variant];
