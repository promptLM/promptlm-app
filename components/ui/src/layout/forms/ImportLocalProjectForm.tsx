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

export type ImportLocalProjectFormValues = {
  repositoryPath: string;
  displayName: string;
};

export type ImportLocalProjectFormProps = {
  initialValues?: Partial<ImportLocalProjectFormValues>;
  onSubmit?: (values: ImportLocalProjectFormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const DEFAULT_VALUES: ImportLocalProjectFormValues = {
  repositoryPath: '',
  displayName: '',
};

export const ImportLocalProjectForm: React.FC<ImportLocalProjectFormProps> = ({
  initialValues,
  onSubmit,
  submitLabel = 'Import repository',
  isSubmitting = false,
  error,
}) => {
  const [values, setValues] = React.useState<ImportLocalProjectFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const handleChange = (field: keyof ImportLocalProjectFormValues) =>
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
        Import local repository
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Point PromptLM at an existing Git repository on your machine. We will scan it for prompt specifications and
        add it to your workspace list.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Repository path"
        placeholder="/Users/alex/repos/promptlm-local"
        value={values.repositoryPath}
        onChange={handleChange('repositoryPath')}
        inputProps={{ 'data-testid': 'import-repo-path' }}
        fullWidth
        required
      />
      <TextField
        label="Display name"
        placeholder="Marketing prompts"
        value={values.displayName}
        onChange={handleChange('displayName')}
        inputProps={{ 'data-testid': 'import-display-name' }}
        fullWidth
      />
      <Alert severity="info">Ensure the directory contains an initialized Git repository.</Alert>
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="contained" color="primary" type="submit" disabled={isSubmitting} data-testid="import-submit">
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
};
