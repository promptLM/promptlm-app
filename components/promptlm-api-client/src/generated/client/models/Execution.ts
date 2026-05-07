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
import type { ChatCompletionResponse } from './ChatCompletionResponse';
import type { EvaluationResult } from './EvaluationResult';
import type { Placeholder } from './Placeholder';
/**
 * Single recorded execution of a PromptSpec
 */
export type Execution = {
    id?: string;
    timestamp?: string;
    response?: ChatCompletionResponse;
    placeholders?: Array<Placeholder>;
    evaluations?: Array<EvaluationResult>;
    /**
     * Wall time of the run in milliseconds
     */
    latencyMs?: number;
    /**
     * Rendered prompt token count
     */
    tokensIn?: number;
    /**
     * Response token count
     */
    tokensOut?: number;
    /**
     * Path to the input fixture file used for the run
     */
    fixturePath?: string;
    /**
     * Free-form context label for the run
     */
    context?: string;
    /**
     * Revision of the spec that produced this run
     */
    revision?: string;
    /**
     * Git committer or CLI invoker
     */
    author?: string;
    /**
     * Outcome of the run; true when the run succeeded
     */
    ok?: boolean;
    /**
     * Failure message captured when ok is false
     */
    error?: string;
    /**
     * Origin of this execution; null reads as MANUAL for back-compat
     */
    kind?: Execution.kind;
    /**
     * Failure classification; null when ok is true
     */
    failureClass?: Execution.failureClass;
};
export namespace Execution {
    /**
     * Origin of this execution; null reads as MANUAL for back-compat
     */
    export enum kind {
        MANUAL = 'MANUAL',
        PRE_RELEASE = 'PRE_RELEASE',
    }
    /**
     * Failure classification; null when ok is true
     */
    export enum failureClass {
        PROMPT = 'PROMPT',
        INFRASTRUCTURE = 'INFRASTRUCTURE',
    }
}

