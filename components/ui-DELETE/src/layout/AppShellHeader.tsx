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
import { AppBar as MuiAppBar, Toolbar, Typography, Box } from '@mui/material';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import type { ToolbarProps } from '@mui/material/Toolbar';
import type { BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

const mergeSx = (...values: (SxProps<Theme> | undefined)[]): SxProps<Theme> =>
  values.filter(Boolean) as SxProps<Theme>;

export type AppShellHeaderProps = {
  title?: React.ReactNode;
  nav?: React.ReactNode;
  endSlot?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Additional props forwarded to the underlying MUI AppBar component.
   * `position` defaults to `fixed` unless `sticky` is set to false.
   */
  appBarProps?: MuiAppBarProps;
  /** Additional props forwarded to the Toolbar inside the header. */
  toolbarProps?: ToolbarProps;
  /** Customize the Box wrapping the navigation items. */
  navContainerProps?: BoxProps;
  /**
   * Render the header as sticky (position="fixed").
   * Set to false to render with `position="static"` by default.
   */
  sticky?: boolean;
  /** Show or hide the bottom border divider. */
  border?: boolean;
};

export const AppShellHeader: React.FC<AppShellHeaderProps> = ({
  title = 'PromptLM',
  nav,
  endSlot,
  children,
  appBarProps,
  toolbarProps,
  navContainerProps,
  sticky = true,
  border = true,
}) => {
  const { sx: appBarSx, position, ...restAppBarProps } = appBarProps ?? {};
  const baseAppBarSx: SxProps<Theme> = {
    borderBottom: border ? (theme) => `1px solid ${theme.palette.divider}` : undefined,
    backgroundColor: 'var(--plm-shell-surface, #fff)',
  };
  const mergedAppBarSx = mergeSx(baseAppBarSx, appBarSx);

  const { sx: toolbarSx, ...restToolbarProps } = toolbarProps ?? {};
  const baseToolbarSx: SxProps<Theme> = {
    gap: { xs: 2, md: 4 },
    minHeight: { xs: 64, md: 72 },
    flexWrap: { xs: 'wrap', md: 'nowrap' },
    alignItems: 'center',
  };
  const mergedToolbarSx = mergeSx(baseToolbarSx, toolbarSx);

  const { sx: navSx, ...restNavProps } = navContainerProps ?? {};
  const baseNavSx: SxProps<Theme> = {
    display: 'flex',
    gap: { xs: 1, md: 1.5 },
    overflowX: { xs: 'auto', md: 'visible' },
    width: { xs: '100%', md: 'auto' },
    py: { xs: 0.5, md: 0 },
    fontFamily: (theme) => theme.typography.fontFamily,
  };
  const mergedNavSx = mergeSx(baseNavSx, navSx);

  const renderedTitle = React.isValidElement(title) ? (
    title
  ) : (
    <Typography variant="h6" color="text.primary" noWrap sx={{ fontWeight: 600, flexShrink: 0 }}>
      {title}
    </Typography>
  );

  return (
    <MuiAppBar
      position={sticky ? position ?? 'fixed' : position ?? 'static'}
      color="default"
      elevation={0}
      sx={mergedAppBarSx}
      {...restAppBarProps}
    >
      <Toolbar sx={mergedToolbarSx} {...restToolbarProps}>
        {renderedTitle}
        {nav ? (
          <Box component="nav" sx={mergedNavSx} {...restNavProps}>
            {nav}
          </Box>
        ) : null}
        <Box flexGrow={1} />
        {endSlot}
      </Toolbar>
      {children}
    </MuiAppBar>
  );
};
