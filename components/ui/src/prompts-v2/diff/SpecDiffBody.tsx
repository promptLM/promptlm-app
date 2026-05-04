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
import { diffArray, diffObject, formatDiffValue } from './diffHelpers';
import type { DiffKind, DiffPromptSpec } from './types';

const TONE: Record<Exclude<DiffKind, 'same'>, { bd: string; bg: string; col: string; glyph: string }> = {
  add: {
    bd: 'oklch(0.55 0.13 155)',
    bg: 'oklch(0.97 0.04 155)',
    col: 'oklch(0.36 0.10 155)',
    glyph: '+',
  },
  del: {
    bd: 'oklch(0.55 0.15 25)',
    bg: 'oklch(0.97 0.04 25)',
    col: 'oklch(0.40 0.13 25)',
    glyph: '−',
  },
  edit: {
    bd: 'var(--pl-signal-deep)',
    bg: 'oklch(0.99 0.02 240)',
    col: 'var(--pl-signal-deep)',
    glyph: '~',
  },
};

const DiffSide: React.FC<{
  value: string;
  kind: 'old' | 'new' | 'empty' | null;
}> = ({ value, kind }) => {
  if (kind === 'empty') {
    return (
      <span
        style={{
          fontFamily: 'var(--pl-mono)',
          fontSize: 11,
          color: 'var(--pl-ink-400)',
          padding: '2px 8px',
        }}
      >
        —
      </span>
    );
  }
  const tone =
    kind === 'old'
      ? { bg: 'oklch(0.94 0.05 25)', bd: 'oklch(0.86 0.06 25)', col: 'oklch(0.36 0.13 25)', glyph: '−' }
      : kind === 'new'
      ? { bg: 'oklch(0.94 0.05 155)', bd: 'oklch(0.86 0.05 155)', col: 'oklch(0.30 0.10 155)', glyph: '+' }
      : null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        padding: '2px 8px',
        borderRadius: 4,
        background: tone?.bg,
        border: tone ? `1px solid ${tone.bd}` : 'none',
        minHeight: 22,
      }}
    >
      {tone && (
        <span
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 11,
            color: tone.col,
            fontWeight: 600,
          }}
        >
          {tone.glyph}
        </span>
      )}
      <span
        style={{
          fontFamily: 'var(--pl-mono)',
          fontSize: 11.5,
          color: tone?.col || 'var(--pl-ink-800)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
};

interface DiffFieldProps {
  path: string;
  l?: string;
  r?: string;
  kind?: 'add' | 'del' | 'edit';
}

const DiffField: React.FC<DiffFieldProps> = ({ path, l, r, kind }) => {
  const s = kind ? TONE[kind] : null;
  const lKind: 'old' | 'new' | 'empty' | null =
    kind === 'add' ? 'empty' : kind === 'edit' || kind === 'del' ? 'old' : null;
  const rKind: 'old' | 'new' | 'empty' | null =
    kind === 'del' ? 'empty' : kind === 'edit' || kind === 'add' ? 'new' : null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr 1fr',
        padding: '8px 16px',
        alignItems: 'flex-start',
        gap: 16,
        background: s?.bg,
        borderLeft: s ? `2px solid ${s.bd}` : '2px solid transparent',
      }}
    >
      <Mono size={11} color="var(--pl-ink-700)" style={{ paddingTop: 2 }}>
        {path}
      </Mono>
      <DiffSide value={l ?? ''} kind={lKind} />
      <DiffSide value={r ?? ''} kind={rKind} />
    </div>
  );
};

interface DiffGroupProps {
  title: string;
  status: 'unchanged' | 'changed';
  footnote?: string;
  children?: React.ReactNode;
}

const DiffGroup: React.FC<DiffGroupProps> = ({ title, status, footnote, children }) => {
  const sBg = status === 'changed' ? 'oklch(0.99 0.02 240)' : 'var(--pl-canvas)';
  const sCol = status === 'changed' ? 'var(--pl-signal-deep)' : 'var(--pl-ink-500)';
  return (
    <div style={{ borderBottom: '1px solid var(--pl-ink-200)' }}>
      <div
        style={{
          padding: '10px 16px',
          background: sBg,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Mono size={11} color={sCol} style={{ letterSpacing: '0.06em', fontWeight: 500 }}>
          {title}
        </Mono>
        <span style={{ flex: 1 }} />
        <Mono size={10} color={sCol} style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          {status}
        </Mono>
        {footnote && (
          <Mono size={10} color="var(--pl-ink-500)">
            · {footnote}
          </Mono>
        )}
      </div>
      {children}
    </div>
  );
};

export interface SpecDiffBodyProps {
  A: DiffPromptSpec | null | undefined;
  B: DiffPromptSpec | null | undefined;
  /** Source path label for the header strip (e.g. "prompts/rag/doc-rag-answer.toml"). */
  sourcePath?: string;
}

const renderField = (
  path: string,
  l: unknown,
  r: unknown,
  kind: DiffKind,
): React.ReactNode => {
  if (kind === 'same') {
    return (
      <DiffField
        key={path}
        path={path}
        l={formatDiffValue(l)}
        r={formatDiffValue(r)}
      />
    );
  }
  if (kind === 'add') {
    return <DiffField key={path} path={path} kind="add" r={formatDiffValue(r)} />;
  }
  if (kind === 'del') {
    return <DiffField key={path} path={path} kind="del" l={formatDiffValue(l)} />;
  }
  return (
    <DiffField
      key={path}
      path={path}
      kind="edit"
      l={formatDiffValue(l)}
      r={formatDiffValue(r)}
    />
  );
};

/**
 * Field-level diff between two PromptSpec snapshots. Groups: meta, request,
 * placeholders, messages, rules. Sections labelled `unchanged` collapse their
 * rows; `changed` sections render every field. The header strip with legend
 * sits above the body for context.
 */
export const SpecDiffBody: React.FC<SpecDiffBodyProps> = ({ A, B, sourcePath }) => {
  if (!A || !B) {
    return (
      <div
        style={{
          padding: '24px 16px',
          border: '1px dashed var(--pl-ink-300)',
          borderRadius: 10,
          color: 'var(--pl-ink-600)',
          fontSize: 13.5,
          textAlign: 'center',
        }}
      >
        Pick prompts and revisions on both sides to render the diff.
      </div>
    );
  }

  const versionChanged = A.version !== B.version;
  const revisionChanged = A.revision !== B.revision;
  const groupChanged = A.group !== B.group;
  const nameChanged = A.name !== B.name;
  const metaChanged = versionChanged || revisionChanged || groupChanged || nameChanged;

  const requestEntries = diffObject(A.request as Record<string, unknown>, B.request as Record<string, unknown>);
  const requestParamEntries = diffObject(
    (A.request.parameters ?? {}) as Record<string, unknown>,
    (B.request.parameters ?? {}) as Record<string, unknown>,
  );
  const requestChanged =
    requestEntries.some((e) => e.kind !== 'same') ||
    requestParamEntries.some((e) => e.kind !== 'same');

  const placeholdersDiff = diffArray(A.placeholders ?? [], B.placeholders ?? []);
  const placeholdersChanged = placeholdersDiff.some((e) => e.kind !== 'same');

  const messagesDiff = diffArray(A.messages ?? [], B.messages ?? []);
  const messagesChanged = messagesDiff.some((e) => e.kind !== 'same');

  const rulesDiff = diffArray(A.rules ?? [], B.rules ?? []);
  const rulesChanged = rulesDiff.some((e) => e.kind !== 'same');

  return (
    <div>
      {/* Header strip with legend */}
      <div
        style={{
          padding: '12px 16px',
          border: '1px solid var(--pl-ink-200)',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          background: 'var(--pl-canvas)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {sourcePath && (
          <>
            <Mono size={11} color="var(--pl-ink-700)">
              {sourcePath}
            </Mono>
            <span style={{ width: 1, height: 12, background: 'var(--pl-ink-300)' }} />
          </>
        )}
        <Mono size={11} color="var(--pl-ink-500)">
          parsed as <span style={{ color: 'var(--pl-ink-800)' }}>PromptSpec</span>
        </Mono>
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: 'oklch(0.55 0.13 155)' }} />
          <Mono size={10} color="var(--pl-ink-600)">added</Mono>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: 'oklch(0.55 0.15 25)' }} />
          <Mono size={10} color="var(--pl-ink-600)">removed</Mono>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--pl-signal-deep)' }} />
          <Mono size={10} color="var(--pl-ink-600)">changed</Mono>
        </span>
      </div>

      <div
        style={{
          border: '1px solid var(--pl-ink-200)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          background: 'var(--pl-paper)',
          overflow: 'hidden',
        }}
      >
        <DiffGroup title="meta" status={metaChanged ? 'changed' : 'unchanged'}>
          {metaChanged && (
            <>
              <DiffField
                path="name"
                l={JSON.stringify(A.name)}
                r={JSON.stringify(B.name)}
                kind={nameChanged ? 'edit' : undefined}
              />
              <DiffField
                path="group"
                l={JSON.stringify(A.group)}
                r={JSON.stringify(B.group)}
                kind={groupChanged ? 'edit' : undefined}
              />
              <DiffField
                path="version"
                l={JSON.stringify(A.version)}
                r={JSON.stringify(B.version)}
                kind={versionChanged ? 'edit' : undefined}
              />
              <DiffField
                path="revision"
                l={String(A.revision)}
                r={String(B.revision)}
                kind={revisionChanged ? 'edit' : undefined}
              />
            </>
          )}
        </DiffGroup>

        <DiffGroup title="request" status={requestChanged ? 'changed' : 'unchanged'}>
          {requestChanged && (
            <>
              {requestEntries
                .filter((e) => e.k !== 'parameters')
                .map((e) => renderField(`request.${e.k}`, e.l, e.r, e.kind))}
              {requestParamEntries.map((e) =>
                renderField(`request.parameters.${e.k}`, e.l, e.r, e.kind),
              )}
            </>
          )}
        </DiffGroup>

        <DiffGroup
          title={`placeholders · ${A.placeholders?.length ?? 0} → ${B.placeholders?.length ?? 0}`}
          status={placeholdersChanged ? 'changed' : 'unchanged'}
        >
          {placeholdersChanged &&
            placeholdersDiff.map((e, i) =>
              renderField(`placeholders[${i}]`, e.l, e.r, e.kind),
            )}
        </DiffGroup>

        <DiffGroup
          title={`messages · ${A.messages?.length ?? 0} → ${B.messages?.length ?? 0}`}
          status={messagesChanged ? 'changed' : 'unchanged'}
        >
          {messagesChanged &&
            messagesDiff.map((e, i) => renderField(`messages[${i}]`, e.l, e.r, e.kind))}
        </DiffGroup>

        <DiffGroup
          title={`rules · ${A.rules?.length ?? 0} → ${B.rules?.length ?? 0}`}
          status={rulesChanged ? 'changed' : 'unchanged'}
        >
          {rulesChanged &&
            rulesDiff.map((e, i) => renderField(`rules[${i}]`, e.l, e.r, e.kind))}
        </DiffGroup>
      </div>
    </div>
  );
};
