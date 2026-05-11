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

const meta: Meta = {
  title: 'UI/Button (Placeholder)',
  render: () => (
    <button
      type="button"
      style={{
        padding: '0.6rem 1.2rem',
        borderRadius: '0.75rem',
        border: 'none',
        background: 'linear-gradient(135deg, #0ea5e9, #312e81)',
        color: '#f8fafc',
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        cursor: 'pointer',
        boxShadow: '0 12px 24px rgba(59, 130, 246, 0.25)',
      }}
    >
      Placeholder Button
    </button>
  ),
};

export default meta;

type Story = StoryObj;

export const Placeholder: Story = {};
