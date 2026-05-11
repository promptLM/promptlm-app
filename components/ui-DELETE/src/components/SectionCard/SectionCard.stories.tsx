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
import { Button, Stack, Typography } from '@mui/material';
import { SectionCard } from './SectionCard';

const meta: Meta<typeof SectionCard> = {
  title: 'Components/SectionCard',
  component: SectionCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'Prompt summary',
    subtitle: 'Current prompt metadata and execution hints',
    children: (
      <Stack spacing={1}>
        <Typography variant="body2">Vendor: OpenAI</Typography>
        <Typography variant="body2">Model: gpt-4.1-mini</Typography>
      </Stack>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof SectionCard>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button size="small">Refresh</Button>,
  },
};
