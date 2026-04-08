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
import { Box, Toolbar } from '@mui/material';
import { AppBar } from './AppBar';
import { SideNav } from './SideNav';

type AppShellProps = {
  children: React.ReactNode;
  appBar?: React.ReactNode;
  sideNav?: React.ReactNode;
  headerOffset?: number;
};

const MAIN_CONTENT_MAX_WIDTH = 'var(--plm-content-max-width, 1320px)';

export const AppShell: React.FC<AppShellProps> = ({ children, appBar, sideNav, headerOffset = 72 }) => {
  const renderedSideNav = sideNav === undefined ? <SideNav /> : sideNav;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--plm-shell-background)',
      }}
    >
      {renderedSideNav}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {appBar ?? <AppBar />}
        <Toolbar
          sx={{
            minHeight: {
              xs: Math.min(headerOffset, 64),
              md: headerOffset,
            },
          }}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 2, sm: 3, md: 6 },
            py: { xs: 3, md: 5 },
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: MAIN_CONTENT_MAX_WIDTH,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
