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

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Execution } from './Execution';
/**
 * Page of historic executions returned by the repo-history endpoint
 */
export type RepoHistoryPage = {
    /**
     * Executions on the current page, newest first
     */
    items?: Array<Execution>;
    /**
     * 1-indexed page number
     */
    page?: number;
    /**
     * Number of items requested per page
     */
    pageSize?: number;
    /**
     * Total number of items matching the filter across all pages
     */
    total?: number;
    /**
     * True when at least one further page is available
     */
    hasMore?: boolean;
};

