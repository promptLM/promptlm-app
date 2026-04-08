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

import { useMemo } from 'react';

import { useGeneratedApiClient } from '@api-common/generatedClientProvider';
import { useActiveProject, usePromptDetails, usePromptDraftTemplate, usePromptMutations } from '@/api/hooks';

import type { PromptEditorMode } from './types';

type UsePromptEditorDataArgs = {
  mode: PromptEditorMode;
  promptId: string | null;
};

export const usePromptEditorData = ({ mode, promptId }: UsePromptEditorDataArgs) => {
  const promptDetails = usePromptDetails(promptId, { enabled: mode === 'edit' });
  const promptTemplate = usePromptDraftTemplate({ enabled: mode === 'create' });
  const promptMutations = usePromptMutations();
  const activeProject = useActiveProject();
  const { promptSpecs } = useGeneratedApiClient();

  return useMemo(
    () => ({
      mode,
      promptId,
      prompt: promptDetails.data,
      promptError: promptDetails.error,
      isPromptLoading: mode === 'edit' ? promptDetails.isLoading : false,
      refreshPrompt: promptDetails.refresh,
      promptTemplate: promptTemplate.data,
      promptTemplateError: promptTemplate.error,
      isPromptTemplateLoading: mode === 'create' ? promptTemplate.isLoading : false,
      refreshPromptTemplate: promptTemplate.refresh,
      createPrompt: promptMutations.createPrompt,
      updatePrompt: promptMutations.updatePrompt,
      isSaving: promptMutations.isSaving,
      mutationError: promptMutations.error,
      activeProject: activeProject.activeProject,
      activeProjectId: activeProject.activeProjectId,
      isActiveProjectLoading: activeProject.isLoading,
      activeProjectError: activeProject.error,
      releasePrompt: promptSpecs.releasePrompt,
      executePrompt: promptSpecs.executePrompt,
      executeStoredPrompt: promptSpecs.executeStoredPrompt,
    }),
    [activeProject.activeProject, activeProject.activeProjectId, activeProject.error, activeProject.isLoading, mode, promptDetails.data, promptDetails.error, promptDetails.isLoading, promptDetails.refresh, promptId, promptMutations.createPrompt, promptMutations.error, promptMutations.isSaving, promptMutations.updatePrompt, promptSpecs.executePrompt, promptSpecs.executeStoredPrompt, promptSpecs.releasePrompt, promptTemplate.data, promptTemplate.error, promptTemplate.isLoading, promptTemplate.refresh],
  );
};
