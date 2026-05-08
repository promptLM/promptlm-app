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

// Re-export with name collisions to upstream barrels avoided. Where a name
// already exists in `@promptlm/ui` (Checkbox / Collapsible / FormMessage /
// MessageRole), this barrel emits the form-scoped variant with a `PromptForm`
// prefix or `Form*` rename so consumers can disambiguate.
export {
  Checkbox as PromptFormCheckbox,
  FieldLabel,
  FormMono,
  GhostButton,
  NumberInput,
  PrimaryButton,
  Select as FormSelect,
  TextArea as FormTextArea,
  TextInput as FormTextInput,
} from './atoms';
export type {
  CheckboxProps as PromptFormCheckboxProps,
  FieldLabelProps,
  GhostButtonProps,
  NumberInputProps,
  PrimaryButtonProps,
  SelectOption as FormSelectOption,
  SelectProps as FormSelectProps,
  TextAreaProps as FormTextAreaProps,
  TextInputProps as FormTextInputProps,
} from './atoms';

export { Collapsible as PromptFormCollapsible } from './Collapsible';
export type { CollapsibleProps as PromptFormCollapsibleProps } from './Collapsible';

export {
  IdentityBlock,
  MessagesEditor,
  RailEvals,
  RailModel,
  RailPlaceholders,
  RailTools,
  SpecFileFooter,
} from './sections';
export type {
  IdentityBlockProps,
  MessagesEditorProps,
  RailEvalsProps,
  RailModelProps,
  RailPlaceholdersProps,
  RailToolsProps,
  SpecFileFooterProps,
} from './sections';

export { PromptFormPage } from './PromptFormPage';
export type { PromptFormPageProps } from './PromptFormPage';

export { TabStrip } from './TabStrip';
export type { FormTabId, TabStripProps } from './TabStrip';

export { requestShapeHash } from './requestShape';
export type { RequestShapeInputs } from './requestShape';

export { evaluateReleaseGates } from './releaseGates';
export type {
  ReleaseGateId,
  ReleaseGateInputs,
  ReleaseGateResult,
  ReleaseGatesEvaluation,
} from './releaseGates';

export { ReleaseRail } from './release/ReleaseRail';
export type {
  ReleaseRailProps,
  ReleaseRailState,
  ReleaseRailDiffSummary,
  ReleaseRailLastRun,
} from './release/ReleaseRail';

export { TestTab } from './test/TestTab';
export type { TestTabProps } from './test/TestTab';
export { RunControlsBar } from './test/RunControlsBar';
export type { RunControlsBarProps } from './test/RunControlsBar';
export { RunHistoryStrip } from './test/RunHistoryStrip';
export type { RunHistoryStripProps } from './test/RunHistoryStrip';
export { HistoryFlyover } from './test/HistoryFlyover';
export type { HistoryFlyoverProps } from './test/HistoryFlyover';
export {
  PlaceholderValuesRegion,
  RenderedPromptRegion,
  OutputRegion,
} from './test/regions';
export type {
  PlaceholderValuesRegionProps,
  RenderedPromptRegionProps,
  OutputRegionProps,
} from './test/regions';
export type {
  RepoHistoryItem,
  TestRunRecord,
  TestRunStatus,
  TestRunToolCall,
} from './test/types';
export { SAMPLE_EXECUTIONS, SAMPLE_REPO_HISTORY } from './test/sampleExecutions';
export { substitute } from './test/substitute';
export { renderWithHighlights } from './test/renderWithHighlights';
export type { RenderWithHighlightsOptions } from './test/renderWithHighlights';

export { validateDraft } from './validation';
export { EMPTY_DRAFT as PROMPT_FORM_EMPTY_DRAFT } from './types';
export type {
  EvaluationKind as PromptFormEvaluationKind,
  FormEvaluation as PromptFormEvaluation,
  FormMessage as PromptFormMessage,
  FormMode as PromptFormMode,
  FormParameters as PromptFormParameters,
  FormPlaceholder as PromptFormPlaceholder,
  FormPlaceholdersConfig as PromptFormPlaceholdersConfig,
  FormRequest as PromptFormRequest,
  FormToolConfig as PromptFormToolConfig,
  MessageRole as PromptFormMessageRole,
  PlaceholderType as PromptFormPlaceholderType,
  PromptFormContext,
  PromptFormDraft,
  PromptFormErrors,
  ToolScenario as PromptFormToolScenario,
} from './types';
