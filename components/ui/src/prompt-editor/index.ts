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

// Legacy editor module. The form cards (`MetadataCard`, `MessagesCard`,
// `ModelConfigurationCard`, etc.) are now exclusively surfaced via
// `prompts-v2/editor`, which wraps the same implementation in the v2 chrome
// via `SectionCardVariantProvider`. Imports of those names should resolve
// through `@promptlm/ui` (the package barrel) where the v2 versions win, or
// be added explicitly under `prompts-v2/editor`.
//
// This file keeps only the items not yet ported to v2 — the editor header
// (used by the legacy create flow shell) and the tabs primitive.

export * from './types';
export { PromptEditorHeader } from './PromptEditorHeader';
export type { PromptEditorHeaderProps } from './PromptEditorHeader';
export { PromptEditorTabs } from './PromptEditorTabs';
export type { PromptEditorTabsProps } from './PromptEditorTabs';
