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

import type { PromptSpec } from '@promptlm/api-client';
import type {
  EditablePromptEvaluationDefinition,
  EditablePromptMessage,
  EditablePromptPlaceholder,
  PromptDraftInput,
} from '@/api/promptPayloads';

export type PromptEditorMode = 'create' | 'edit';

export type PromptEditorDraft = PromptDraftInput;

export type PromptExecutionRecord = NonNullable<PromptSpec['executions']>[number];

export type PromptEditorState = {
  draft: PromptEditorDraft;
  evaluationEnabled: boolean;
};

export type PromptEditorMetadataField =
  | 'name'
  | 'group'
  | 'description'
  | 'repositoryUrl'
  | 'version'
  | 'revision';

export type PromptEditorRequestField = 'type' | 'vendor' | 'model' | 'url' | 'modelSnapshot';

export type PromptEditorParameterField = keyof NonNullable<PromptDraftInput['request']['parameters']>;

export type PromptEditorEvaluationField = keyof EditablePromptEvaluationDefinition;

export type PromptEditorPlaceholderField = keyof EditablePromptPlaceholder;

export type PromptEditorMessageField = keyof EditablePromptMessage;
