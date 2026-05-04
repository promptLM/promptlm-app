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

import type {
  ActivityCell,
  AuthorRow,
  CommitMeta,
  DiffCorpus,
  GroupCatalogBlock,
  ModelMatrixRow,
  PlaceholderIndexRow,
  TimelineEntry,
} from '@promptlm/ui';
import {
  SAMPLE_DIFF_CORPUS,
  SAMPLE_DIFF_SELECTION,
} from '@promptlm/ui/prompts-v2/diff/sampleData';
import {
  SAMPLE_ACTIVITY,
  SAMPLE_ACTIVITY_MONTHS,
  SAMPLE_ACTIVITY_TOTAL,
  SAMPLE_AUTHORS,
  SAMPLE_GROUPS,
  SAMPLE_LATEST_COMMIT,
  SAMPLE_MODELS,
  SAMPLE_PLACEHOLDERS,
  SAMPLE_TIMELINE,
} from '@promptlm/ui/prompts-v2/report/sampleData';

/**
 * Wire shape consumed by the static report. The `promptlm report` CLI emits
 * a JSON document of this shape; the page renders it. Sample data lives in
 * @promptlm/ui's prompts-v2 modules and is re-used by Storybook stories.
 */
export interface ReportSpecs {
  repo: { url: string; defaultBranch: string };
  generatedBy: string;
  latestCommit: CommitMeta;
  activity: {
    cells: readonly ActivityCell[];
    weeks: number;
    days: number;
    monthLabels: readonly string[];
    total: number;
  };
  timeline: readonly TimelineEntry[];
  authors: readonly AuthorRow[];
  groups: readonly GroupCatalogBlock[];
  models: readonly ModelMatrixRow[];
  totalPrompts: number;
  placeholders: readonly PlaceholderIndexRow[];
  diffCorpus: DiffCorpus;
  /** Default left/right diff selection (latest revision compared to previous). */
  defaultDiffSelection: {
    promptA: string;
    revA: string;
    promptB: string;
    revB: string;
  };
}

/**
 * In production the CLI will inline the real document. For the dev/preview
 * build we ship the same fixtures used by Storybook stories so the page is
 * meaningful without backend integration.
 */
export const SAMPLE_SPECS: ReportSpecs = {
  repo: { url: 'github.com/acme/agents', defaultBranch: 'main' },
  generatedBy: 'promptlm@0.4.2',
  latestCommit: SAMPLE_LATEST_COMMIT,
  activity: {
    cells: SAMPLE_ACTIVITY,
    weeks: 13,
    days: 7,
    monthLabels: SAMPLE_ACTIVITY_MONTHS,
    total: SAMPLE_ACTIVITY_TOTAL,
  },
  timeline: SAMPLE_TIMELINE,
  authors: SAMPLE_AUTHORS,
  groups: SAMPLE_GROUPS,
  models: SAMPLE_MODELS,
  totalPrompts: SAMPLE_GROUPS.reduce((sum, g) => sum + g.count, 0),
  placeholders: SAMPLE_PLACEHOLDERS,
  diffCorpus: SAMPLE_DIFF_CORPUS,
  defaultDiffSelection: SAMPLE_DIFF_SELECTION,
};

/**
 * Future production hook: when the CLI inlines a real specs document, it
 * will set `window.__PROMPTLM_REPORT_SPECS__` before the bundle runs. We
 * fall back to the sample fixtures otherwise.
 */
export const loadSpecs = (): ReportSpecs => {
  if (typeof window !== 'undefined') {
    const injected = (window as unknown as { __PROMPTLM_REPORT_SPECS__?: ReportSpecs })
      .__PROMPTLM_REPORT_SPECS__;
    if (injected) return injected;
  }
  return SAMPLE_SPECS;
};
