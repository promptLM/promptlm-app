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
import { Badge, Box, Button, Tab, Tabs, Typography } from '@mui/material';
import type { PromptEditorExecutionOption, PromptEditorTab, PromptEditorTabDefinition } from './types';

export type PromptEditorTabsProps = {
  tabs: PromptEditorTabDefinition[];
  value: PromptEditorTab;
  onChange: (value: PromptEditorTab) => void;
  executionOptions?: {
    selectedId?: string | null;
    options: PromptEditorExecutionOption[];
    onSelect: (id: string) => void;
  };
  tabPanelSlot?: React.ReactNode;
};

export const PromptEditorTabs: React.FC<PromptEditorTabsProps> = ({
  tabs,
  value,
  onChange,
  executionOptions,
  tabPanelSlot,
}) => {
  const handleChange = (_: React.SyntheticEvent, nextValue: string) => {
    onChange(nextValue as PromptEditorTab);
  };

  return (
    <Box>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
      >
        {tabs.map((tab) => {
          const label = tab.badge ? (
            <Badge badgeContent={tab.badge} color="primary" max={999} sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
              {tab.label}
            </Badge>
          ) : (
            tab.label
          );

          return (
            <Tab
              key={tab.value}
              value={tab.value}
              label={label}
              disabled={tab.disabled}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          );
        })}
      </Tabs>

      {value === 'preview' && executionOptions ? (
        <Box display="flex" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {executionOptions.options.map((option) => {
            const active = executionOptions.selectedId === option.id;
            return (
              <Button
                key={option.id}
                variant={active ? 'contained' : 'outlined'}
                size="small"
                onClick={() => executionOptions.onSelect(option.id)}
                sx={{
                  textTransform: 'none',
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Typography component="span" variant="body2">
                  {option.label}
                </Typography>
                {option.helperText ? (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 0.5, opacity: 0.7 }}
                  >
                    {option.helperText}
                  </Typography>
                ) : null}
              </Button>
            );
          })}
        </Box>
      ) : null}

      {tabPanelSlot}
    </Box>
  );
};
