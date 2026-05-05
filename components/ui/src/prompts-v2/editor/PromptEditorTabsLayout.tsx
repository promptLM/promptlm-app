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

import * as React from 'react';
import { PromptEditorTabsLayout as Impl } from '../../prompt-editor/PromptEditorSections';
import type { PromptEditorTabsLayoutProps } from '../../prompt-editor/PromptEditorSections';
import { SectionCardVariantProvider } from '../../components/SectionCard/SectionCard';

/**
 * V2 wrapper for the tabs layout. Re-uses the existing implementation but
 * scopes the SectionCard chrome inside `tabPanelSlot` to the v2 variant.
 */
export const PromptEditorTabsLayout: React.FC<PromptEditorTabsLayoutProps> = (props) => (
  <SectionCardVariantProvider variant="v2">
    <Impl {...props} />
  </SectionCardVariantProvider>
);
PromptEditorTabsLayout.displayName = 'PromptEditorTabsLayoutV2';
