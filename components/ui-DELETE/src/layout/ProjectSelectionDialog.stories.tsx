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
import { ProjectSelectionDialog } from './ProjectSelectionDialog';
import React from 'react';
import { Stack, TextField, Typography, Button, Alert, ThemeProvider, CssBaseline, Box } from '@mui/material';
import { createPromptLMTheme } from '../theme/createPromptLMTheme';

const meta: Meta<typeof ProjectSelectionDialog> = {
  title: 'Layout/ProjectSelectionDialog',
  component: ProjectSelectionDialog,
  parameters: {
    layout: 'centered',
  },
  args: {
    open: true,
  },
  argTypes: {
    onRefresh: { action: 'refresh' },
    onSelect: { action: 'select' },
    onClose: { action: 'close' },
  },
};

export default meta;

type Story = StoryObj<typeof ProjectSelectionDialog>;

const MOCK_PROJECTS = [
  {
    id: 'project-1',
    name: 'PromptLM Core',
    repositoryUrl: 'https://github.com/promptlm/core',
    localPath: '/repos/promptlm-core',
    description: 'Primary prompt workspace used for integration tests.',
  },
  {
    id: 'project-2',
    name: 'Marketing Experiments',
    repositoryUrl: 'https://github.com/promptlm/marketing-prompts',
    localPath: '/repos/promptlm-marketing',
    description: 'Campaign prompts for growth experiments.',
  },
];

export const Default: Story = {
  args: {
    projects: MOCK_PROJECTS,
    activeProjectId: 'project-1',
    error: null,
    isLoading: false,
  },
};

export const WithTabs: Story = {
  args: {
    projects: MOCK_PROJECTS,
    activeProjectId: 'project-1',
    tabs: [
      {
        id: 'create',
        label: 'Add project',
        content: (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Create new project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provision a fresh PromptLM workspace. Specify the repository name and base directory where the repo
              should be created.
            </Typography>
            <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
              <TextField label="Repository name" placeholder="promptlm-example" fullWidth required />
              <TextField label="Parent directory" placeholder="/Users/alex/repos" fullWidth required />
            </Stack>
            <TextField
              label="Description"
              placeholder="Optional context for collaborators"
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="contained" color="primary">
                Create project
              </Button>
            </Stack>
          </Stack>
        ),
      },
      {
        id: 'import',
        label: 'Import local',
        content: (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Import local repository
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Point PromptLM at an existing Git repository on your machine. We will scan it for prompt specifications.
            </Typography>
            <TextField label="Repository path" placeholder="/Users/alex/repos/promptlm-local" fullWidth required />
            <TextField label="Display name" placeholder="Marketing prompts" fullWidth />
            <Alert severity="info">Ensure the directory contains an initialized Git repository.</Alert>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="contained" color="primary">
                Import repository
              </Button>
            </Stack>
          </Stack>
        ),
      },
      {
        id: 'clone',
        label: 'Clone remote',
        content: (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Clone remote repository
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provide the remote Git URL and choose where it should be cloned locally. Optionally override the project
              name that appears in PromptLM.
            </Typography>
            <TextField
              label="Remote URL"
              placeholder="https://github.com/promptlm/example-prompts.git"
              fullWidth
              required
            />
            <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
              <TextField label="Target directory" placeholder="/Users/alex/repos" fullWidth required />
              <TextField label="Project name" placeholder="Example prompts" fullWidth />
            </Stack>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="contained" color="primary">
                Clone repository
              </Button>
            </Stack>
          </Stack>
        ),
      },
    ],
  },
};

export const Loading: Story = {
  args: {
    projects: [],
    activeProjectId: undefined,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    projects: MOCK_PROJECTS,
    activeProjectId: 'project-1',
    error: 'Failed to load projects',
  },
};

export const EmptyState: Story = {
  args: {
    projects: [],
    activeProjectId: undefined,
  },
};

export const DarkVariant: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: (args) => {
    const darkTheme = createPromptLMTheme({
      variant: 'darkAurora',
      components: {
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: 'var(--plm-card-background, #141832)',
              color: 'var(--plm-text-primary)',
            },
          },
        },
      },
    });

    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline enableColorScheme />
        <Box bgcolor="var(--plm-shell-background)" minHeight="100vh" p={6}>
          <ProjectSelectionDialog {...args} />
        </Box>
      </ThemeProvider>
    );
  },
  args: {
    projects: MOCK_PROJECTS,
    activeProjectId: 'project-2',
    tabs: [
      {
        id: 'create',
        label: 'Add project',
        content: (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Create new project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provision a fresh PromptLM workspace. Specify the repository name and base directory where the repo
              should be created.
            </Typography>
            <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
              <TextField label="Repository name" placeholder="promptlm-neon" fullWidth required />
              <TextField label="Parent directory" placeholder="/Users/alex/repos" fullWidth required />
            </Stack>
            <TextField
              label="Description"
              placeholder="Optional context for collaborators"
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="contained" color="primary">
                Create project
              </Button>
            </Stack>
          </Stack>
        ),
      },
      {
        id: 'import',
        label: 'Import local',
        content: (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Import local repository
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Point PromptLM at an existing Git repository on your machine. We will scan it for prompt specifications.
            </Typography>
            <TextField label="Repository path" placeholder="/Users/alex/repos/promptlm-local" fullWidth required />
            <TextField label="Display name" placeholder="Marketing prompts" fullWidth />
            <Alert severity="info">Ensure the directory contains an initialized Git repository.</Alert>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="contained" color="primary">
                Import repository
              </Button>
            </Stack>
          </Stack>
        ),
      },
      {
        id: 'clone',
        label: 'Clone remote',
        content: (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Clone remote repository
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provide the remote Git URL and choose where it should be cloned locally. Optionally override the project
              name that appears in PromptLM.
            </Typography>
            <TextField
              label="Remote URL"
              placeholder="https://github.com/promptlm/example-prompts.git"
              fullWidth
              required
            />
            <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
              <TextField label="Target directory" placeholder="/Users/alex/repos" fullWidth required />
              <TextField label="Project name" placeholder="Example prompts" fullWidth />
            </Stack>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="contained" color="primary">
                Clone repository
              </Button>
            </Stack>
          </Stack>
        ),
      },
    ],
  },
};
