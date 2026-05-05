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
