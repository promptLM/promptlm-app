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

// Legacy editor type aliases. The visual editor lives at
// `prompts-v2/form` (`PromptFormPage`); the webapp's draft state pivots on
// the type aliases re-exported here. There is no runtime code under
// `prompt-editor/` anymore — the cards, header, tabs, and tabs-layout
// components were removed when `PromptFormShell` shipped (issue #93 cleanup).
export * from './types';
