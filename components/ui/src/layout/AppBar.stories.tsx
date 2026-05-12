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
import { Box } from '@mui/material';
import { AppBar } from './AppBar';

const meta: Meta<typeof AppBar> = {
  title: 'Layout/AppBar',
  component: AppBar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppBar>;

export const Default: Story = {
  render: () => (
    <Box sx={{ minHeight: 120 }}>
      <AppBar />
    </Box>
  ),
};
