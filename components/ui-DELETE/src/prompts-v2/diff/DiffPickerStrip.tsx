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

import * as React from 'react';
import { Mono } from '../atoms';
import type { DiffCorpus, DiffSelection } from './types';

const SIDE_TONES = {
  A: {
    color: 'oklch(0.55 0.15 25)',
    bg: 'oklch(0.97 0.04 25)',
    bd: 'oklch(0.86 0.06 25)',
    label: 'baseline',
  },
  B: {
    color: 'oklch(0.45 0.12 155)',
    bg: 'oklch(0.97 0.04 155)',
    bd: 'oklch(0.86 0.05 155)',
    label: 'compare',
  },
} as const;

const DropdownField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <Mono
      size={9.5}
      color="var(--pl-ink-500)"
      style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
    >
      {label}
    </Mono>
    <div
      style={{
        position: 'relative',
        background: 'var(--pl-paper)',
        border: '1px solid var(--pl-ink-300)',
        borderRadius: 6,
      }}
    >
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: '8px 28px 8px 10px',
          fontFamily: 'var(--pl-mono)',
          fontSize: 12,
          color: 'var(--pl-ink-800)',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--pl-mono)',
          fontSize: 11,
          color: 'var(--pl-ink-500)',
          pointerEvents: 'none',
        }}
      >
        ⌄
      </span>
    </div>
  </label>
);

interface PickerProps {
  side: 'A' | 'B';
  prompt: string;
  rev: string;
  corpus: DiffCorpus;
  metaWhen?: string;
  metaAuthor?: string;
  metaSha?: string;
  onSelectPrompt: (prompt: string, rev: string) => void;
  onSelectRev: (rev: string) => void;
}

const Picker: React.FC<PickerProps> = ({
  side,
  prompt,
  rev,
  corpus,
  metaWhen,
  metaAuthor,
  metaSha,
  onSelectPrompt,
  onSelectRev,
}) => {
  const tone = SIDE_TONES[side];
  const promptList = Object.keys(corpus);
  const entry = corpus[prompt];
  const revList = entry ? Object.keys(entry.revisions) : [];

  return (
    <div
      style={{
        border: `1px solid ${tone.bd}`,
        background: tone.bg,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 5,
            background: tone.color,
            color: 'var(--pl-paper)',
            fontFamily: 'var(--pl-mono)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {side}
        </span>
        <Mono
          size={11}
          color={tone.color}
          style={{ letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 500 }}
        >
          {tone.label}
        </Mono>
        <span style={{ flex: 1 }} />
        {(metaAuthor || metaWhen || metaSha) && (
          <Mono size={10.5} color="var(--pl-ink-500)">
            {[metaAuthor, metaWhen, metaSha].filter(Boolean).join(' · ')}
          </Mono>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr', gap: 10 }}>
        <DropdownField
          label="prompt"
          value={prompt}
          onChange={(next) => {
            const firstRev = Object.keys(corpus[next]?.revisions ?? {})[0] ?? rev;
            onSelectPrompt(next, firstRev);
          }}
        >
          {promptList.map((p) => (
            <option key={p} value={p}>
              {p} · {corpus[p].group}
            </option>
          ))}
        </DropdownField>
        <DropdownField label="revision" value={rev} onChange={onSelectRev}>
          {revList.map((r) => {
            const meta = entry?.revisions[r];
            return (
              <option key={r} value={r}>
                {r}
                {meta?.version ? ` · ${meta.version}` : ''}
              </option>
            );
          })}
        </DropdownField>
      </div>
    </div>
  );
};

export interface DiffPickerStripProps {
  selection: DiffSelection;
  corpus: DiffCorpus;
  onChange: (next: DiffSelection) => void;
}

export const DiffPickerStrip: React.FC<DiffPickerStripProps> = ({
  selection,
  corpus,
  onChange,
}) => {
  const A = corpus[selection.promptA]?.revisions[selection.revA];
  const B = corpus[selection.promptB]?.revisions[selection.revB];

  const swap = () =>
    onChange({
      promptA: selection.promptB,
      revA: selection.revB,
      promptB: selection.promptA,
      revB: selection.revA,
    });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 56px 1fr',
        gap: 14,
        alignItems: 'stretch',
      }}
    >
      <Picker
        side="A"
        prompt={selection.promptA}
        rev={selection.revA}
        corpus={corpus}
        metaWhen={A?.when}
        metaAuthor={A?.author}
        metaSha={A?.sha}
        onSelectPrompt={(prompt, rev) => onChange({ ...selection, promptA: prompt, revA: rev })}
        onSelectRev={(rev) => onChange({ ...selection, revA: rev })}
      />
      <button
        type="button"
        onClick={swap}
        title="swap sides"
        aria-label="swap sides"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--pl-paper)',
          border: '1px solid var(--pl-ink-200)',
          borderRadius: 999,
          fontFamily: 'var(--pl-mono)',
          fontSize: 13,
          color: 'var(--pl-ink-700)',
          cursor: 'pointer',
          alignSelf: 'center',
          height: 36,
          width: 36,
          marginInline: 'auto',
        }}
      >
        ⇄
      </button>
      <Picker
        side="B"
        prompt={selection.promptB}
        rev={selection.revB}
        corpus={corpus}
        metaWhen={B?.when}
        metaAuthor={B?.author}
        metaSha={B?.sha}
        onSelectPrompt={(prompt, rev) => onChange({ ...selection, promptB: prompt, revB: rev })}
        onSelectRev={(rev) => onChange({ ...selection, revB: rev })}
      />
    </div>
  );
};
