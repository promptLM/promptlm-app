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
import { Mono, Sparkline, StatusDot, Tag, VendorMark } from '../atoms';
import type { CatalogRowItem } from './types';

export interface CatalogRowProps {
  prompt: CatalogRowItem;
  /** Show a left-edge accent + faint signal-tinted background. */
  highlighted?: boolean;
  /** Click handler for the row (typically navigates to the detail page). */
  onSelect?: (prompt: CatalogRowItem) => void;
  /** Hide operational columns (Executions, p95) when execution capture is unavailable. */
  showOperational?: boolean;
}

export const CATALOG_GRID_COLUMNS = '1fr 140px 100px 110px 110px 28px';
const FONT_MONO = 'var(--pl-mono)';

const formatLatency = (ms?: number): string => {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
};

const formatLatencyShort = (ms?: number): string => {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
};

export const CatalogRow: React.FC<CatalogRowProps> = ({
  prompt: p,
  highlighted = false,
  onSelect,
  showOperational = true,
}) => {
  const handleClick = onSelect ? () => onSelect(p) : undefined;
  const successPct = p.successRate != null ? `${(p.successRate * 100).toFixed(1)}%` : '—';
  const successOk = (p.successRate ?? 1) >= 0.95;

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(p);
              }
            }
          : undefined
      }
      style={{
        display: 'grid',
        gridTemplateColumns: CATALOG_GRID_COLUMNS,
        padding: '14px 16px',
        gap: 16,
        borderBottom: '1px solid var(--pl-ink-200)',
        alignItems: 'center',
        background: highlighted
          ? 'color-mix(in oklch, var(--pl-signal) 5%, transparent)'
          : 'transparent',
        position: 'relative',
        cursor: onSelect ? 'pointer' : 'default',
        outline: 'none',
      }}
    >
      {highlighted && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--pl-signal-deep)',
          }}
        />
      )}

      {/* Prompt cell */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <Mono size={13.5} color="var(--pl-ink-900)" style={{ fontWeight: 500 }}>
            {p.name}
          </Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">
            v{p.version}
          </Mono>
          <Mono
            size={10.5}
            color="var(--pl-ink-500)"
            style={{ background: 'var(--pl-ink-100)', padding: '1px 5px', borderRadius: 3 }}
          >
            r{p.revision}
          </Mono>
          {p.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--pl-ink-600)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 3,
          }}
        >
          {p.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Mono size={10.5} color="var(--pl-ink-500)">
            {p.id}
          </Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">·</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">
            {p.placeholders} placeholders · {p.messages} msgs
          </Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">·</Mono>
          <Mono size={10.5} color="var(--pl-ink-500)">
            updated {p.updatedAt}
          </Mono>
        </div>
      </div>

      {/* Model */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <VendorMark vendor={p.vendor} size={14} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
          <Mono
            size={11.5}
            color="var(--pl-ink-800)"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {p.model}
          </Mono>
          <Mono size={10} color="var(--pl-ink-500)" style={{ textTransform: 'capitalize' }}>
            {p.vendor}
          </Mono>
        </div>
      </div>

      {/* Status */}
      <StatusDot status={p.status} />

      {/* Executions */}
      {showOperational ? (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <Mono size={13} color="var(--pl-ink-900)" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {p.executions != null ? p.executions.toLocaleString() : '—'}
          </Mono>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mono
              size={10}
              color={successOk ? 'oklch(0.45 0.12 155)' : 'oklch(0.50 0.13 75)'}
            >
              {successPct}
            </Mono>
            {p.successSeries && p.successSeries.length > 1 && (
              <Sparkline
                values={p.successSeries}
                width={48}
                height={14}
                color={successOk ? 'var(--pl-ok)' : 'var(--pl-warn)'}
                ariaLabel={`success-rate trend for ${p.name}`}
              />
            )}
          </div>
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      {/* p95 latency */}
      {showOperational ? (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <Mono size={13} color="var(--pl-ink-900)" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatLatency(p.p95LatencyMs)}
          </Mono>
          <Mono size={10} color="var(--pl-ink-500)">
            avg {formatLatencyShort(p.avgLatencyMs)}
          </Mono>
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      {/* Action */}
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          color: 'var(--pl-ink-500)',
          fontFamily: FONT_MONO,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ›
      </span>
    </div>
  );
};
