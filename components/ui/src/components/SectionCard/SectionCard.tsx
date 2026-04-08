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

export type SectionCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  children,
  sx,
  headerSx,
  contentSx,
}) => {
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
    <Paper
      elevation={0}
      variant="outlined"
      sx={paperSx}
    >
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

SectionCard.displayName = 'SectionCard';
