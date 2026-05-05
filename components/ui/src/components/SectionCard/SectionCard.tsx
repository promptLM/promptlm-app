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

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export type SectionCardVariant = 'mui' | 'v2';

const SectionCardVariantContext = React.createContext<SectionCardVariant>('mui');

export const SectionCardVariantProvider: React.FC<{
  variant: SectionCardVariant;
  children: React.ReactNode;
}> = ({ variant, children }) => (
  <SectionCardVariantContext.Provider value={variant}>{children}</SectionCardVariantContext.Provider>
);

export type SectionCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

const renderMuiChrome = ({
  title,
  subtitle,
  action,
  children,
  sx,
  headerSx,
  contentSx,
}: SectionCardProps) => {
  const paperBaseSx: SxProps<Theme> = {
    borderRadius: 2,
    borderColor: 'divider',
    p: 2.25,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
  };

  const headerBaseSx: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 1.5,
  };

  const paperSx: SxProps<Theme> = Array.isArray(sx)
    ? [paperBaseSx, ...sx]
    : sx
    ? [paperBaseSx, sx]
    : [paperBaseSx];

  const headerMergedSx: SxProps<Theme> = Array.isArray(headerSx)
    ? [headerBaseSx, ...headerSx]
    : headerSx
    ? [headerBaseSx, headerSx]
    : [headerBaseSx];

  return (
    <Paper elevation={0} variant="outlined" sx={paperSx}>
      <Box sx={headerMergedSx}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      <Box sx={contentSx}>{children}</Box>
    </Paper>
  );
};

const renderV2Chrome = ({
  title,
  subtitle,
  action,
  children,
  contentSx,
}: SectionCardProps) => (
  <div
    style={{
      border: '1px solid var(--pl-ink-200)',
      borderRadius: 8,
      background: 'var(--pl-paper)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        padding: '10px 16px',
        background: 'var(--pl-canvas)',
        borderBottom: '1px solid var(--pl-ink-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--pl-mono)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--pl-ink-700)',
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontFamily: 'var(--pl-display)',
              fontSize: 12.5,
              color: 'var(--pl-ink-600)',
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {action ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{action}</div> : null}
    </div>
    <Box sx={contentSx} style={{ padding: 16 }}>
      {children}
    </Box>
  </div>
);

export const SectionCard: React.FC<SectionCardProps> = (props) => {
  const variant = React.useContext(SectionCardVariantContext);
  return variant === 'v2' ? renderV2Chrome(props) : renderMuiChrome(props);
};

SectionCard.displayName = 'SectionCard';
