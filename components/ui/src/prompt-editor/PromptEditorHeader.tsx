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
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';
import type { PromptEditorBannerMessage, PromptEditorMode } from './types';

export type PromptEditorHeaderProps = {
  mode: PromptEditorMode;
  title: string;
  description: string;
  isBusy?: boolean;
  isReleasing?: boolean;
  messages?: PromptEditorBannerMessage[];
  onBack?: () => void;
  onCreate?: () => void;
  onEdit?: () => void;
  onRelease?: () => void;
  backLabel?: string;
  createLabel?: string;
  editLabel?: string;
  releaseLabel?: string;
  headerSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
};

export const PromptEditorHeader: React.FC<PromptEditorHeaderProps> = ({
  mode,
  title,
  description,
  isBusy = false,
  isReleasing = false,
  messages = [],
  onBack,
  onCreate,
  onEdit,
  onRelease,
  backLabel = 'Back to prompts',
  createLabel = 'New prompt',
  editLabel = 'Edit prompt',
  releaseLabel = 'Release',
  headerSlot,
  actionsSlot,
}) => {
  const renderActions = () => {
    if (actionsSlot) {
      return actionsSlot;
    }

    return (
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
        {mode === 'create' && onCreate ? (
          <Button
            variant="outlined"
            onClick={onCreate}
            disabled={isBusy}
            data-testid="prompt-editor-create-action"
          >
            {createLabel}
          </Button>
        ) : null}
        {mode === 'edit' ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            {onEdit ? (
              <Button
                variant="outlined"
                onClick={onEdit}
                disabled={isBusy}
                data-testid="prompt-editor-edit-action"
              >
                {editLabel}
              </Button>
            ) : null}
            {onRelease ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={onRelease}
                disabled={isBusy || isReleasing}
                startIcon={
                  isReleasing ? <CircularProgress size={18} color="inherit" /> : <RocketLaunch fontSize="small" />
                }
                data-testid="prompt-editor-release-action"
              >
                {isReleasing ? 'Releasing…' : releaseLabel}
              </Button>
            ) : null}
          </Stack>
        ) : null}
        {onBack ? (
          <Button
            variant="text"
            onClick={onBack}
            disabled={isBusy}
            data-testid="prompt-editor-back-action"
          >
            {backLabel}
          </Button>
        ) : null}
      </Stack>
    );
  };

  return (
    <Stack spacing={2.5} sx={{ mb: 1.5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary" data-testid="prompt-editor-heading">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {headerSlot}
        </Box>
        {renderActions()}
      </Stack>

      {messages.length ? (
        <Stack spacing={1.5}>
          {messages.map((message) => (
            <Alert
              key={message.id ?? `${message.severity}-${message.text}`}
              severity={message.severity}
              action={message.action}
            >
              {message.text}
            </Alert>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
};
