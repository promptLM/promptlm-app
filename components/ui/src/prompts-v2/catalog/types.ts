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

import type { PromptStatus, VendorId } from '../atoms';

/**
 * View-model for one prompt entry in the catalog list. Designed as a flat
 * shape so the catalog blocks stay decoupled from the generated PromptSpec —
 * the host app maps PromptSpec → CatalogRowItem in its api-common layer.
 *
 * Operational fields (executions, successRate, latency, sparkline) are
 * optional so the row degrades gracefully when execution capture is not
 * yet wired (see featureFlags.executionMetrics).
 */
export interface CatalogRowItem {
  id: string;
  name: string;
  description: string;
  version: string;
  revision: number | string;
  vendor: VendorId;
  model: string;
  status: PromptStatus;
  placeholders: number;
  messages: number;
  updatedAt: string;
  tags: readonly string[];
  executions?: number;
  successRate?: number;
  /** Sparkline series (e.g. recent success-rate samples). Optional. */
  successSeries?: readonly number[];
  avgLatencyMs?: number;
  p95LatencyMs?: number;
}

export interface CatalogFacetItem {
  id: string;
  label: string;
  count: number;
  /** Optional colored dot rendered before the label (used for status facets). */
  dot?: string;
}

export interface CatalogFacetGroupSpec {
  id: string;
  label: string;
  items: readonly CatalogFacetItem[];
  activeId?: string | null;
}
