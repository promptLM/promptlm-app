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
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';

export type CloneProjectFormValues = {
  remoteUrl: string;
  targetDirectory: string;
  projectName: string;
};

export type CloneProjectFormProps = {
  initialValues?: Partial<CloneProjectFormValues>;
  onSubmit?: (values: CloneProjectFormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  statusEvent?: { status: string; message?: string } | null;
  statusError?: string | null;
};

const DEFAULT_VALUES: CloneProjectFormValues = {
  remoteUrl: '',
  targetDirectory: '',
  projectName: '',
};

export const CloneProjectForm: React.FC<CloneProjectFormProps> = ({
  initialValues,
  onSubmit,
  submitLabel = 'Clone repository',
  isSubmitting = false,
  error,
  statusEvent,
  statusError,
}) => {
  const [values, setValues] = React.useState<CloneProjectFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const handleChange = (field: keyof CloneProjectFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(values);
  };

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600}>
        Clone remote repository
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Provide the remote Git URL and choose where it should be cloned locally. Optionally override the project name
        that appears in PromptLM.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Remote URL"
        placeholder="https://github.com/promptlm/example-prompts.git"
        value={values.remoteUrl}
        onChange={handleChange('remoteUrl')}
        inputProps={{ 'data-testid': 'clone-remote-url' }}
        fullWidth
        required
      />
      <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
        <TextField
          label="Target directory"
          placeholder="/Users/alex/repos"
          value={values.targetDirectory}
          onChange={handleChange('targetDirectory')}
          inputProps={{ 'data-testid': 'clone-target-dir' }}
          fullWidth
          required
        />
        <TextField
          label="Project name"
          placeholder="Example prompts"
          value={values.projectName}
          onChange={handleChange('projectName')}
          inputProps={{ 'data-testid': 'clone-project-name' }}
          fullWidth
        />
      </Stack>
      {(statusEvent || statusError) ? (
        <Alert
          severity={statusError || statusEvent?.status === 'failed' ? 'error' : 'info'}
          data-testid="clone-status-alert"
        >
          {statusError ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" fontWeight={600}>
                Live clone status unavailable
              </Typography>
              <Typography variant="body2">{statusError}</Typography>
            </Stack>
          ) : (
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {statusEvent?.status}
              </Typography>
              <Typography variant="body2">{statusEvent?.message}</Typography>
            </Stack>
          )}
        </Alert>
      ) : null}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="contained" color="primary" type="submit" disabled={isSubmitting} data-testid="clone-submit">
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
};
