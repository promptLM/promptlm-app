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

export type PromptLMColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type PromptLMColorTokens = {
  primary: PromptLMColorScale;
  secondary: PromptLMColorScale;
  neutral: PromptLMColorScale;
  success: PromptLMColorScale;
  warning: PromptLMColorScale;
  error: PromptLMColorScale;
  background: {
    default: string;
    surface: string;
    subtle: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverted: string;
  };
};

export type PromptLMSpacingTokens = {
  scale: number[];
  base: number;
};

export type PromptLMRadiusTokens = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export type PromptLMShadowTokens = {
  sm: string;
  md: string;
  lg: string;
};

export type PromptLMTypographyTokens = {
  fontFamily: string;
  headingsFontFamily: string;
  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightBold: number;
};

export type PromptLMDesignTokens = {
  colors: PromptLMColorTokens;
  spacing: PromptLMSpacingTokens;
  radius: PromptLMRadiusTokens;
  shadows: PromptLMShadowTokens;
  typography: PromptLMTypographyTokens;
};

export const promptLMDesignTokens: PromptLMDesignTokens = {
  colors: {
    primary: {
      50: '#f0f6ff',
      100: '#d9e6ff',
      200: '#b0caff',
      300: '#82a9ff',
      400: '#4f82ff',
      500: '#1f5cff',
      600: '#1647d9',
      700: '#1035b3',
      800: '#0a248c',
      900: '#041463'
    },
    secondary: {
      50: '#f5f8ff',
      100: '#e4ebff',
      200: '#c7d5fe',
      300: '#9fb5fd',
      400: '#6f8dfb',
      500: '#4863f5',
      600: '#364ad2',
      700: '#2837a8',
      800: '#1b267f',
      900: '#111854'
    },
    neutral: {
      50: '#f7f7f9',
      100: '#ececf1',
      200: '#d8d9e3',
      300: '#b9bccd',
      400: '#9499b5',
      500: '#6f7598',
      600: '#54597a',
      700: '#3d425d',
      800: '#2a2d41',
      900: '#1a1c2a'
    },
    success: {
      50: '#edfdf4',
      100: '#d3f9e2',
      200: '#a8f0c5',
      300: '#6de29f',
      400: '#37c976',
      500: '#15a85b',
      600: '#0f8649',
      700: '#0c6639',
      800: '#08492a',
      900: '#042d1b'
    },
    warning: {
      50: '#fff9ed',
      100: '#ffefcf',
      200: '#ffdca0',
      300: '#ffc06a',
      400: '#ffa036',
      500: '#ff7d07',
      600: '#db5d02',
      700: '#b54202',
      800: '#8f2f01',
      900: '#661f00'
    },
    error: {
      50: '#fff1f1',
      100: '#ffd7d7',
      200: '#ffa9a9',
      300: '#ff7474',
      400: '#ff3d3d',
      500: '#ff1111',
      600: '#db0b0b',
      700: '#b70606',
      800: '#910202',
      900: '#680101'
    },
    background: {
      default: '#0d1024',
      surface: '#141832',
      subtle: '#1d2244'
    },
    text: {
      primary: '#ffffff',
      secondary: '#d7daf2',
      muted: '#9aa2c6',
      inverted: '#0d1024'
    }
  },
  spacing: {
    base: 4,
    scale: [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8]
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20
  },
  shadows: {
    sm: '0px 1px 2px rgba(13, 16, 36, 0.16)',
    md: '0px 4px 20px rgba(13, 16, 36, 0.18)',
    lg: '0px 10px 40px rgba(13, 16, 36, 0.22)'
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headingsFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700
  }
};
