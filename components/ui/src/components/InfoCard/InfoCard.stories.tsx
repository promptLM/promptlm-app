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
import { Box, Button, Stack } from '@mui/material';
import { InfoCard } from './InfoCard';

const meta: Meta<typeof InfoCard> = {
  title: 'Components/InfoCard',
  component: InfoCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'PromptLM Core',
    subtitle: 'Repository: github.com/promptlm/core',
    description: 'Primary workspace that powers the live PromptLM experience.',
    statusLabel: 'Healthy',
    statusColor: 'success',
    metadata: [
      { label: 'Updated', value: new Date().toLocaleString() },
      { label: 'Prompts', value: 42 },
      { label: 'Maintainer', value: 'PromptLM Team' },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof InfoCard>;

export const Default: Story = {};

export const WithActions: Story = {
  render: (args) => (
    <InfoCard
      {...args}
      actions={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined">
            Details
          </Button>
          <Button size="small" variant="contained">
            Open project
          </Button>
        </Stack>
      }
    />
  ),
};

export const Gallery: Story = {
  render: (args) => (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 360px)' }} gap={2.5}>
      {[1, 2, 3].map((index) => (
        <InfoCard
          key={index}
          {...args}
          title={`Project ${index}`}
          subtitle={`Repository: github.com/promptlm/sample-${index}`}
          metadata={[
            { label: 'Updated', value: new Date(Date.now() - index * 36e5).toLocaleString() },
            { label: 'Prompts', value: 10 * index },
          ]}
          statusLabel={index === 3 ? 'Degraded' : 'Healthy'}
          statusColor={index === 3 ? 'warning' : 'success'}
        />
      ))}
    </Box>
  ),
};
