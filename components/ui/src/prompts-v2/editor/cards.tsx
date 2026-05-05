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

/**
 * V2 editor form cards. Each export wraps the existing implementation in
 * `prompt-editor/PromptEditorSections` with the v2 SectionCard chrome via
 * `SectionCardVariantProvider`. Card bodies (validation, accessibility,
 * field semantics) are unchanged — only the surrounding card chrome shifts
 * from MUI Paper to the prompts-v2 SpecBlock-style header + token tokens.
 *
 * Wiring this way keeps the per-field MUI controls (TextField, Select) which
 * already pick up the v2 palette via the lightTech MUI theme bridge, and lets
 * #89 (webapp swap) be a pure import-path change with zero behavioral risk.
 */

import * as React from 'react';
import { SectionCardVariantProvider } from '../../components/SectionCard/SectionCard';
import {
  EvaluationPlanCard as EvaluationPlanCardImpl,
  EvaluationResultsCard as EvaluationResultsCardImpl,
  LastExecutionCard as LastExecutionCardImpl,
  MessagesCard as MessagesCardImpl,
  MetadataCard as MetadataCardImpl,
  ModelConfigurationCard as ModelConfigurationCardImpl,
  PlaceholdersCard as PlaceholdersCardImpl,
  PromptPreviewCard as PromptPreviewCardImpl,
  ToolConfigsCard as ToolConfigsCardImpl,
} from '../../prompt-editor/PromptEditorSections';
import type {
  EvaluationPlanCardProps,
  EvaluationResultsCardProps,
  LastExecutionCardProps,
  MessagesCardProps,
  MetadataCardProps,
  ModelConfigurationCardProps,
  PlaceholdersCardProps,
  PromptPreviewCardProps,
  ToolConfigsCardProps,
} from '../../prompt-editor/PromptEditorSections';

const wrapV2 =
  <P extends object>(Impl: React.ComponentType<P>): React.FC<P> =>
  (props) =>
    (
      <SectionCardVariantProvider variant="v2">
        <Impl {...props} />
      </SectionCardVariantProvider>
    );

export const MetadataCard = wrapV2<MetadataCardProps>(MetadataCardImpl);
MetadataCard.displayName = 'MetadataCardV2';

export const ModelConfigurationCard = wrapV2<ModelConfigurationCardProps>(ModelConfigurationCardImpl);
ModelConfigurationCard.displayName = 'ModelConfigurationCardV2';

export const PlaceholdersCard = wrapV2<PlaceholdersCardProps>(PlaceholdersCardImpl);
PlaceholdersCard.displayName = 'PlaceholdersCardV2';

export const MessagesCard = wrapV2<MessagesCardProps>(MessagesCardImpl);
MessagesCard.displayName = 'MessagesCardV2';

export const ToolConfigsCard = wrapV2<ToolConfigsCardProps>(ToolConfigsCardImpl);
ToolConfigsCard.displayName = 'ToolConfigsCardV2';

export const PromptPreviewCard = wrapV2<PromptPreviewCardProps>(PromptPreviewCardImpl);
PromptPreviewCard.displayName = 'PromptPreviewCardV2';

export const LastExecutionCard = wrapV2<LastExecutionCardProps>(LastExecutionCardImpl);
LastExecutionCard.displayName = 'LastExecutionCardV2';

export const EvaluationPlanCard = wrapV2<EvaluationPlanCardProps>(EvaluationPlanCardImpl);
EvaluationPlanCard.displayName = 'EvaluationPlanCardV2';

export const EvaluationResultsCard = wrapV2<EvaluationResultsCardProps>(EvaluationResultsCardImpl);
EvaluationResultsCard.displayName = 'EvaluationResultsCardV2';
