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
import { Alert, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';

export type CreateProjectFormValues = {
  repoName: string;
  parentDirectory: string;
  description: string;
  owner?: string;
};

export type CreateProjectFormProps = {
  initialValues?: Partial<CreateProjectFormValues>;
  onSubmit?: (values: CreateProjectFormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  owners?: RepositoryOwnerOption[];
  isOwnersLoading?: boolean;
  ownersError?: string | null;
};

const DEFAULT_VALUES: CreateProjectFormValues = {
  repoName: '',
  parentDirectory: '',
  description: '',
  owner: '',
};

export type RepositoryOwnerOption = {
  id: string;
  displayName: string;
  type: 'USER' | 'ORGANIZATION';
};

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  initialValues,
  onSubmit,
  submitLabel = 'Create project',
  isSubmitting = false,
  error,
  owners,
  isOwnersLoading = false,
  ownersError,
}) => {
  const [values, setValues] = React.useState<CreateProjectFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  React.useEffect(() => {
    if (owners?.length) {
      setValues((prev) => {
        if (prev.owner && owners.some((owner) => owner.id === prev.owner)) {
          return prev;
        }
        return { ...prev, owner: owners[0].id };
      });
    }
  }, [owners]);

  const handleChange = (field: keyof CreateProjectFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(values);
  };

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600}>
        Create new project
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Provision a fresh PromptLM workspace. Specify the repository name and base directory where the
        repository should be created.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
        <TextField
          label="Repository name"
          placeholder="promptlm-example"
          value={values.repoName}
          onChange={handleChange('repoName')}
          inputProps={{ 'data-testid': 'repositoryName' }}
          fullWidth
          required
        />
        <TextField
          label="Parent directory"
          placeholder="/Users/alex/repos"
          value={values.parentDirectory}
          onChange={handleChange('parentDirectory')}
          inputProps={{ 'data-testid': 'newRepoPath' }}
          fullWidth
          required
        />
      </Stack>
      {owners?.length ? (
        <TextField
          select
          label="Owner"
          value={values.owner ?? ''}
          onChange={handleChange('owner')}
          fullWidth
          disabled={isOwnersLoading}
          helperText={
            ownersError
              ? ownersError
              : isOwnersLoading
                ? 'Loading available owners…'
                : 'Select the account or organization that should own the repository.'
          }
        >
          {isOwnersLoading ? (
            <MenuItem value="" disabled>
              <CircularProgress size={16} sx={{ mr: 1 }} /> Loading…
            </MenuItem>
          ) : null}
          {owners.map((owner) => (
            <MenuItem key={owner.id} value={owner.id} data-testid={`owner-option-${owner.id}`}>
              {owner.displayName}
              {owner.type === 'ORGANIZATION' ? ' (org)' : ''}
            </MenuItem>
          ))}
        </TextField>
      ) : null}
      <TextField
        label="Description"
        placeholder="Optional context for collaborators"
        multiline
        minRows={2}
        value={values.description}
        onChange={handleChange('description')}
        fullWidth
      />
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isSubmitting}
          data-testid="submitProjectButton"
        >
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
};
