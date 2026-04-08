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

import type { ReactNode } from 'react';

export type PromptEditorMode = 'create' | 'edit';

export type PromptEditorTab = 'editor' | 'preview' | 'test' | 'history';

export type PromptEditorBannerMessage = {
  id?: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  text: string;
  action?: ReactNode;
};

export type PromptEditorTabDefinition = {
  value: PromptEditorTab;
  label: string;
  badge?: string | number;
  disabled?: boolean;
};

export type PromptEditorExecutionOption = {
  id: string;
  label: string;
  helperText?: string;
};
