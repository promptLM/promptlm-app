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
import type { Kind } from './Kind';
import type { PromptSpec } from './PromptSpec';
/**
 * A single entry in a prompt's revision history (one per git commit that touched the spec file).
 */
export type Revision = {
    /**
     * Sequential revision label, newest first (e.g. "r34").
     */
    rev?: string;
    /**
     * Semver-shaped git tag pointing at this commit, if any.
     */
    tag?: string | null;
    /**
     * Full git commit SHA. Stable identifier for this revision.
     */
    sha?: string;
    /**
     * Display name of the commit author.
     */
    author?: string;
    /**
     * Commit timestamp as ISO-8601 instant.
     */
    when?: string;
    /**
     * First line of the commit message.
     */
    msg?: string;
    /**
     * How this commit changed the prompt spec file.
     */
    kind?: Kind;
    /**
     * Full prompt-spec snapshot at this revision; null if the historical YAML cannot be deserialized.
     */
    spec?: PromptSpec;
};

