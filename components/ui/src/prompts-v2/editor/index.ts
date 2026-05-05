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

export { EditorTopBar } from './EditorTopBar';
export type {
  EditorTopBarProps,
  EditorTopBarMessage,
  EditorMode,
} from './EditorTopBar';

export {
  EvaluationPlanCard,
  EvaluationResultsCard,
  LastExecutionCard,
  MessagesCard,
  MetadataCard,
  ModelConfigurationCard,
  PlaceholdersCard,
  PromptPreviewCard,
  ToolConfigsCard,
} from './cards';

export { PromptEditorTabsLayout } from './PromptEditorTabsLayout';

// Re-export the prop types and value types so consumers can import everything
// they need from `@promptlm/ui` (prompts-v2/editor) without reaching back into
// `prompt-editor/*`. Behaviour is preserved one-to-one with the legacy cards;
// only the surrounding chrome shifts to the v2 variant.
export { DEFAULT_MESSAGE_ROLES } from '../../prompt-editor/PromptEditorSections';
export type {
  EvaluationPlanCardProps,
  EvaluationPlanErrors,
  EvaluationResultsCardProps,
  LastExecutionCardProps,
  MessageContentSelection,
  MessagesCardProps,
  MessagesErrors,
  MetadataCardProps,
  MetadataErrors,
  ModelConfigurationCardProps,
  ModelConfigurationErrors,
  PlaceholdersCardProps,
  PlaceholdersErrors,
  PromptEditorEvaluationPlan,
  PromptEditorEvaluationResult,
  PromptEditorExecution,
  PromptEditorMessage,
  PromptEditorMessageRole,
  PromptEditorPlaceholder,
  PromptEditorPlaceholderConfig,
  PromptEditorRequestDraft,
  PromptEditorTabsLayoutProps,
  PromptEditorToolConfig,
  PromptPreviewCardProps,
  ToolConfigsCardProps,
  ToolConfigsErrors,
} from '../../prompt-editor/PromptEditorSections';
