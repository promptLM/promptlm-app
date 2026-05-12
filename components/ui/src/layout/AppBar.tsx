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
import { AppBar as MuiAppBar, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export const AppBar = () => {
  return (
    <MuiAppBar position="fixed">
      <Toolbar>
        <MenuIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap>
          PromptLM
        </Typography>
      </Toolbar>
    </MuiAppBar>
  );
};
