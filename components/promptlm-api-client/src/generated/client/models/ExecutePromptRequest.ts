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
import type { PromptSpec } from './PromptSpec';
export type ExecutePromptRequest = {
    promptSpec?: PromptSpec;
    /**
     * Marks this run as a draft (unsaved edits). When true, the body is
     * executed but no MANUAL Execution is recorded against the stored
     * prompt — the run is ephemeral. Default false: a clean editor Run
     * (no unsaved edits) records a MANUAL Execution.
     *
     * Manually added ahead of the next OpenAPI regeneration — keep in
     * sync with the Java DTO `dev.promptlm.web.ExecutePromptRequest`.
     */
    draft?: boolean;
};

