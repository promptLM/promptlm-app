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
import React from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { AppShell } from './AppShell';
import { AppShellHeader } from './AppShellHeader';

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppShell>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Workspace Overview
          </Typography>
          <Typography color="text.secondary">
            The default shell renders the shared header offset, side navigation, and centered content column.
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Active Project
          </Typography>
          <Typography color="text.secondary">PromptLM Core</Typography>
        </Paper>
      </Stack>
    </AppShell>
  ),
};

export const CustomSlots: Story = {
  render: () => (
    <AppShell
      appBar={
        <AppShellHeader
          title="Prompt Workspace"
          nav={
            <>
              <Chip label="Prompts" color="primary" size="small" />
              <Chip label="Evaluations" variant="outlined" size="small" />
            </>
          }
        />
      }
      sideNav={
        <Box
          sx={{
            width: 240,
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            p: 3,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Custom navigation slot
          </Typography>
        </Box>
      }
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Custom shell composition
        </Typography>
      </Paper>
    </AppShell>
  ),
};
