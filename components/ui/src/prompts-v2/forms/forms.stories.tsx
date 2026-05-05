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
import { TextField, TextArea } from './TextField';
import { SelectField } from './SelectField';
import { SwitchField } from './SwitchField';
import { IconButton } from './IconButton';
import { Disclosure } from './Disclosure';

const meta: Meta = {
  title: 'Prompts v2 / Forms',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

const VENDOR_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
];

const Stack: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>{children}</div>
);

export const Inputs: Story = {
  render: () => {
    const [name, setName] = useState('doc-rag-answer');
    const [description, setDescription] = useState('');
    const [vendor, setVendor] = useState('anthropic');
    return (
      <Stack>
        <TextField
          label="prompt name"
          value={name}
          onChange={setName}
          required
          helperText="Only letters, numbers, '-' and '_' are allowed."
        />
        <TextField
          label="api endpoint"
          value=""
          onChange={() => undefined}
          placeholder="https://api.example.com/v1"
          error="Must be an absolute https URL."
        />
        <SelectField label="vendor" value={vendor} onChange={setVendor} options={VENDOR_OPTIONS} />
        <TextArea
          label="description"
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="What does this prompt do?"
        />
      </Stack>
    );
  },
};

export const Toggles: Story = {
  render: () => {
    const [stream, setStream] = useState(false);
    const [evals, setEvals] = useState(true);
    return (
      <Stack>
        <SwitchField checked={stream} onChange={setStream} label="Stream responses" />
        <SwitchField checked={evals} onChange={setEvals} label="Enable evaluations" />
        <SwitchField checked={false} onChange={() => undefined} label="Disabled" disabled />
      </Stack>
    );
  },
};

export const Buttons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <IconButton icon="plus" label="Add" onClick={() => undefined} variant="outlined" />
      <IconButton icon="trash" label="Remove" onClick={() => undefined} />
      <IconButton icon="chevron-down" label="Expand" onClick={() => undefined} />
      <IconButton icon="trash" label="Disabled" onClick={() => undefined} disabled />
    </div>
  ),
};

export const DisclosureExample: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Stack>
        <Disclosure open={open} onToggle={() => setOpen((v) => !v)} label="advanced parameters">
          <TextField label="temperature" value="0.7" onChange={() => undefined} type="number" />
          <TextField label="top p" value="1" onChange={() => undefined} type="number" />
          <SwitchField checked={false} onChange={() => undefined} label="Stream" />
        </Disclosure>
      </Stack>
    );
  },
};
