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

import type { Meta, StoryObj } from '@storybook/react';
import { AppShellHeader } from './AppShellHeader';
import { Box, Button, Stack, Chip, Typography, ThemeProvider, CssBaseline } from '@mui/material';
import { createPromptLMTheme } from '../theme/createPromptLMTheme';

const meta: Meta<typeof AppShellHeader> = {
  title: 'Layout/AppShellHeader',
  component: AppShellHeader,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppShellHeader>;

const navItemSx = {
  px: { xs: 1.5, md: 2 },
  py: { xs: 0.75, md: 1 },
  borderRadius: 1.5,
  color: 'text.secondary',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    color: 'primary.main',
    backgroundColor: (theme: any) => theme.palette.action.hover,
  },
};

const nav = (
  <Stack direction="row" spacing={1.5}>
    <Button variant="text" sx={navItemSx} size="small">
      Dashboard
    </Button>
    <Button variant="text" sx={navItemSx} size="small">
      Projects
    </Button>
    <Button variant="text" sx={navItemSx} size="small">
      Prompts
    </Button>
    <Button variant="contained" sx={navItemSx} size="small">
      New Prompt
    </Button>
  </Stack>
);

const endSlot = (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography variant="body2" color="text.secondary">
      Active project
    </Typography>
    <Chip label="PromptLM Design" size="small" color="primary" />
  </Stack>
);

export const Default: Story = {
  args: {
    nav,
    endSlot,
  },
};

export const WithCustomTitle: Story = {
  args: {
    title: (
      <Box display="flex" alignItems="center" gap={1}>
        <img src="https://promptlm.dev/logo.svg" alt="PromptLM" width={28} height={28} />
        <Typography variant="h6" fontWeight={700}>
          PromptLM UI Kit
        </Typography>
      </Box>
    ),
    nav,
    endSlot,
  },
};

export const DarkVariant: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: (args) => {
    const darkTheme = createPromptLMTheme({ variant: 'darkAurora' });
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline enableColorScheme />
        <Box minHeight="100vh" bgcolor="var(--plm-shell-background)" p={4}>
          <AppShellHeader {...args} />
          <Box mt={20} p={3} borderRadius={2} bgcolor="var(--plm-card-background)">
            <Typography variant="body1" color="text.secondary">
              The darkAurora theme applies updated palettes, shadows, and shell styling.
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  },
  args: {
    nav,
    endSlot,
  },
};
