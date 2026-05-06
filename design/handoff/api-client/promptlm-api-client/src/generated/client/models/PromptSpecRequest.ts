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
import type { Message } from './Message';
import type { PromptSpecRequestParameters } from './PromptSpecRequestParameters';
/**
 * LLM request payload and runtime parameters
 */
export type PromptSpecRequest = {
    /**
     * Type discriminator for the request
     */
    type?: string;
    /**
     * LLM vendor identifier
     */
    vendor?: string;
    /**
     * Model name to execute
     */
    model?: string;
    /**
     * Optional override endpoint for the vendor
     */
    url?: string;
    /**
     * Fine-tuning parameters for model execution
     */
    parameters?: PromptSpecRequestParameters;
    /**
     * Ordered conversation history supplied to the LLM
     */
    messages?: Array<Message>;
    /**
     * Specific snapshot or version of the model to target
     */
    model_snapshot?: string;
};

