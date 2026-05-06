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
/**
 * Fine-grained model inference controls
 */
export type PromptSpecRequestParameters = {
    /**
     * Sampling temperature
     */
    temperature?: number;
    /**
     * Top-p nucleus sampling parameter
     */
    topP?: number;
    /**
     * Maximum number of tokens to generate
     */
    maxTokens?: number;
    /**
     * Penalty for repeated tokens
     */
    frequencyPenalty?: number;
    /**
     * Penalty for introducing new topics
     */
    presencePenalty?: number;
    /**
     * Whether to stream partial responses as they are generated
     */
    stream?: boolean;
};

