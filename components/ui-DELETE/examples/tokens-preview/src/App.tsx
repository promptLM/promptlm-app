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

import { useMemo } from 'react';
import {
  Box,
  CssBaseline,
  Divider,
  Grid,
  Paper,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import { promptLMDesignTokens } from '@promptlm/ui';

const tokens = promptLMDesignTokens;

function ColorScale({ name, scale }: { name: string; scale: Record<string, string> }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {name}
      </Typography>
      <Grid container spacing={1}>
        {Object.entries(scale).map(([key, value]) => (
          <Grid key={key} item xs={6} sm={4} md={2}>
            <Paper
              elevation={2}
              sx={{
                height: 80,
                borderRadius: 2,
                bgcolor: value,
                color: tokens.colors.text.inverted,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="caption">{name}.{key}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function SpacingScale() {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Spacing scale (base {tokens.spacing.base}px)
      </Typography>
      <Grid container spacing={2}>
        {tokens.spacing.scale.map((multiplier) => {
          const pxValue = multiplier * tokens.spacing.base;
          return (
            <Grid key={multiplier} item xs={6} sm={4} md={3}>
              <Paper
                elevation={1}
                sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  ×{multiplier}
                </Typography>
                <Box
                  sx={{
                    height: 12,
                    width: pxValue,
                    bgcolor: tokens.colors.primary[400],
                    borderRadius: tokens.radius.xs,
                  }}
                />
                <Typography variant="caption">{pxValue}px</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

function RadiusPreview() {
  const radiusEntries = Object.entries(tokens.radius) as Array<[string, number]>;
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Border radius tokens
      </Typography>
      <Grid container spacing={2}>
        {radiusEntries.map(([name, value]) => (
          <Grid key={name} item xs={6} sm={3}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: 120,
                borderRadius: value,
                bgcolor: tokens.colors.background.surface,
                boxShadow: tokens.shadows.md,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="body1">{name.toUpperCase()}</Typography>
              <Typography variant="caption">{value}px</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function ShadowPreview() {
  const shadowEntries = Object.entries(tokens.shadows) as Array<[string, string]>;
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Elevation tokens
      </Typography>
      <Grid container spacing={2}>
        {shadowEntries.map(([name, value]) => (
          <Grid key={name} item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: 140,
                borderRadius: tokens.radius.md,
                boxShadow: value,
                bgcolor: tokens.colors.background.surface,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {name.toUpperCase()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function App() {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: tokens.colors.primary[500],
          },
          secondary: {
            main: tokens.colors.secondary[500],
          },
          background: {
            default: tokens.colors.background.default,
            paper: tokens.colors.background.surface,
          },
          text: {
            primary: tokens.colors.text.primary,
            secondary: tokens.colors.text.secondary,
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
        spacing: tokens.spacing.base,
        shape: {
          borderRadius: tokens.radius.md,
        },
        typography: {
          fontFamily: tokens.typography.fontFamily,
          fontWeightRegular: tokens.typography.fontWeightRegular,
          fontWeightMedium: tokens.typography.fontWeightMedium,
          fontWeightBold: tokens.typography.fontWeightBold,
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: tokens.colors.background.default,
          color: tokens.colors.text.primary,
          p: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            PromptLM Design Tokens
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Interactive preview utilities for colors, spacing, radius, and shadows.
          </Typography>
        </Box>

        <ColorScale name="Primary" scale={tokens.colors.primary} />
        <ColorScale name="Secondary" scale={tokens.colors.secondary} />
        <ColorScale name="Neutral" scale={tokens.colors.neutral} />
        <ColorScale name="Success" scale={tokens.colors.success} />
        <ColorScale name="Warning" scale={tokens.colors.warning} />
        <ColorScale name="Error" scale={tokens.colors.error} />

        <Divider light sx={{ my: 2 }} />

        <SpacingScale />

        <Divider light sx={{ my: 2 }} />

        <RadiusPreview />

        <Divider light sx={{ my: 2 }} />

        <ShadowPreview />
      </Box>
    </ThemeProvider>
  );
}
