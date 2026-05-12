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

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Checkbox,
  FieldLabel,
  FormMono,
  GhostButton,
  NumberInput,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from './atoms';

const meta: Meta = {
  title: 'Prompts v2 / Form / Atoms',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

const Stack: React.FC<{ children: React.ReactNode; cols?: number }> = ({ children, cols = 1 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: cols === 1 ? '1fr' : `repeat(${cols}, minmax(0, 1fr))`,
      gap: 14,
      maxWidth: 480,
    }}
  >
    {children}
  </div>
);

export const Inputs: Story = {
  render: () => {
    const [name, setName] = useState('doc-rag-answer');
    const [description, setDescription] = useState('Answer doc questions');
    const [vendor, setVendor] = useState('anthropic');
    const [temp, setTemp] = useState(0.2);
    return (
      <Stack>
        <div>
          <FieldLabel required>Name</FieldLabel>
          <TextInput value={name} onChange={setName} mono placeholder="e.g. doc-rag-answer" />
        </div>
        <div>
          <FieldLabel required error="Required.">
            Group
          </FieldLabel>
          <TextInput value="" onChange={() => undefined} mono placeholder="e.g. rag" />
        </div>
        <div>
          <FieldLabel hint="optional">Snapshot</FieldLabel>
          <TextInput value="" onChange={() => undefined} mono compact placeholder="2025-04-14" />
        </div>
        <div>
          <FieldLabel required>Vendor</FieldLabel>
          <Select
            compact
            value={vendor}
            onChange={setVendor}
            options={[
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'openai', label: 'OpenAI' },
              { value: 'google', label: 'Google' },
            ]}
          />
        </div>
        <div>
          <FieldLabel error="0–2">Temperature</FieldLabel>
          <NumberInput value={temp} onChange={setTemp} min={0} max={2} step={0.1} error="0–2" />
        </div>
        <div>
          <FieldLabel required>Description</FieldLabel>
          <TextArea
            value={description}
            onChange={setDescription}
            rows={4}
            mono={false}
            placeholder="What does this prompt do?"
          />
        </div>
      </Stack>
    );
  },
};

export const Buttons: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryButton>Save & release</PrimaryButton>
          <PrimaryButton disabled>Save & release</PrimaryButton>
          <GhostButton>Save draft</GhostButton>
          <GhostButton mini>+ Add</GhostButton>
          <GhostButton danger mini>
            ×
          </GhostButton>
        </div>
        <Checkbox checked={checked} onChange={setChecked} label="Enable evaluations" />
        <FormMono size={11} color="oklch(0.45 0.12 155)">
          ✓ ready to save
        </FormMono>
        <FormMono size={11} color="oklch(0.50 0.15 25)">
          ! 3 errors
        </FormMono>
      </div>
    );
  },
};
