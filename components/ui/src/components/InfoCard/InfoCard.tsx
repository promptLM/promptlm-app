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
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import type { ChipProps, SxProps, Theme } from '@mui/material';

export type InfoCardMetadataItem = {
  label: string;
  value: React.ReactNode;
};

export type InfoCardProps = {
  title: string;
  subtitle?: string;
  description?: React.ReactNode;
  statusLabel?: string;
  statusColor?: ChipProps['color'];
  metadata?: InfoCardMetadataItem[];
  actions?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
  actionAreaTestId?: string;
};

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  description,
  statusLabel,
  statusColor = 'default',
  metadata,
  actions,
  onClick,
  disabled = false,
  selected = false,
  icon,
  sx,
  actionAreaTestId,
}) => {
  const clickable = Boolean(onClick);

  const content = (
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        {icon ? <Stack alignItems="center" sx={{ pt: 0.5 }}>{icon}</Stack> : null}
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 600, flexGrow: 1, color: 'text.primary' }}
              noWrap
            >
              {title}
            </Typography>
            {statusLabel ? <Chip size="small" color={statusColor} label={statusLabel} /> : null}
          </Stack>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
      </Stack>

      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}

      {metadata && metadata.length ? (
        <Stack spacing={1.5} divider={<Divider flexItem light />}>
          {metadata.map((item) => (
            <Stack
              key={item.label}
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                {item.label}
              </Typography>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ flexGrow: 1, textAlign: 'right', wordBreak: 'break-word' }}
              >
                {item.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : null}

    </CardContent>
  );

  const actionsNode = actions ? (
    <CardActions sx={{ px: 3, pb: 3, pt: 0 }} disableSpacing>
      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
        {actions}
      </Stack>
    </CardActions>
  ) : null;

  const cardSx: SxProps<Theme> = [
    ...(clickable && !disabled ? [{ cursor: 'pointer' as const }] : []),
    ...(selected
      ? [
          {
            borderColor: (theme: Theme) => theme.palette.primary.light,
            boxShadow: (theme: Theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.18)}`,
          } as const,
        ]
      : []),
    ...(disabled ? [{ opacity: 0.6 }] : []),
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <Card variant={selected ? 'outlined' : 'elevation'} sx={cardSx}>
      {clickable ? (
        <CardActionArea
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          sx={{ height: '100%' }}
          data-testid={actionAreaTestId}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
      {actionsNode}
    </Card>
  );
};
