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
import type { AudioSpeechRequest } from './AudioSpeechRequest';
import type { ChatCompletionRequest } from './ChatCompletionRequest';
import type { ChatCompletionResponse } from './ChatCompletionResponse';
import type { EvaluationResults } from './EvaluationResults';
import type { EvaluationSpec } from './EvaluationSpec';
import type { Execution } from './Execution';
import type { ImagesGenerationsRequest } from './ImagesGenerationsRequest';
import type { JsonNode } from './JsonNode';
import type { Placeholders } from './Placeholders';
/**
 * Prompt specification persisted in the prompt store
 */
export type PromptSpec = {
    specVersion?: string;
    uuid?: string;
    /**
     * Unique identifier of this prompt
     */
    id?: string;
    /**
     * Prompt name
     */
    name?: string;
    /**
     * Prompt group
     */
    group?: string;
    /**
     * Semantic version of the prompt
     */
    version?: string;
    /**
     * Revision number for drafts
     */
    revision?: number;
    /**
     * Human readable description of the prompt
     */
    description?: string;
    authors?: Array<string>;
    /**
     * Business purpose or intent behind the prompt
     */
    purpose?: string;
    /**
     * Source repository URL for this prompt
     */
    repositoryUrl?: string;
    /**
     * Publication status of the prompt
     */
    status?: PromptSpec.status;
    /**
     * Timestamp when the prompt was created
     */
    createdAt?: string;
    /**
     * Timestamp when the prompt was last updated
     */
    updatedAt?: string;
    /**
     * Timestamp when the prompt was retired
     */
    retiredAt?: string;
    /**
     * Optional explanation why the prompt was retired
     */
    retiredReason?: string;
    /**
     * LLM invocation payload
     */
    request?: (ChatCompletionRequest | ImagesGenerationsRequest | AudioSpeechRequest);
    /**
     * Placeholder metadata and default values
     */
    placeholders?: Placeholders;
    /**
     * Latest captured response from prompt execution
     */
    response?: ChatCompletionResponse;
    evaluationSpec?: EvaluationSpec;
    evaluationResults?: EvaluationResults;
    /**
     * Custom extension payloads keyed by x-*
     */
    extensions?: Record<string, JsonNode>;
    /**
     * Filesystem path where the prompt is persisted
     */
    path?: {
        absolute?: boolean;
        parent?: {
            absolute?: boolean;
            root?: {
                absolute?: boolean;
                fileName?: {
                    absolute?: boolean;
                    fileSystem?: {
                        open?: boolean;
                        readOnly?: boolean;
                        separator?: string;
                        rootDirectories?: any;
                        fileStores?: any;
                        userPrincipalLookupService?: any;
                    };
                    nameCount?: number;
                };
                fileSystem?: {
                    open?: boolean;
                    readOnly?: boolean;
                    separator?: string;
                    rootDirectories?: any;
                    fileStores?: any;
                    userPrincipalLookupService?: any;
                };
                nameCount?: number;
            };
            fileName?: {
                absolute?: boolean;
                fileSystem?: {
                    open?: boolean;
                    readOnly?: boolean;
                    separator?: string;
                    rootDirectories?: any;
                    fileStores?: any;
                    userPrincipalLookupService?: any;
                };
                nameCount?: number;
            };
            fileSystem?: {
                open?: boolean;
                readOnly?: boolean;
                separator?: string;
                rootDirectories?: any;
                fileStores?: any;
                userPrincipalLookupService?: any;
            };
            nameCount?: number;
        };
        root?: {
            absolute?: boolean;
            fileName?: {
                absolute?: boolean;
                fileSystem?: {
                    open?: boolean;
                    readOnly?: boolean;
                    separator?: string;
                    rootDirectories?: any;
                    fileStores?: any;
                    userPrincipalLookupService?: any;
                };
                nameCount?: number;
            };
            fileSystem?: {
                open?: boolean;
                readOnly?: boolean;
                separator?: string;
                rootDirectories?: any;
                fileStores?: any;
                userPrincipalLookupService?: any;
            };
            nameCount?: number;
        };
        fileName?: {
            absolute?: boolean;
            fileSystem?: {
                open?: boolean;
                readOnly?: boolean;
                separator?: string;
                rootDirectories?: any;
                fileStores?: any;
                userPrincipalLookupService?: any;
            };
            nameCount?: number;
        };
        fileSystem?: {
            open?: boolean;
            readOnly?: boolean;
            separator?: string;
            rootDirectories?: any;
            fileStores?: any;
            userPrincipalLookupService?: any;
        };
        nameCount?: number;
    };
    /**
     * Recent executions of the prompt
     */
    executions?: Array<Execution>;
    /**
     * Stable hash across semantic prompt fields
     */
    semanticHash?: string;
};
export namespace PromptSpec {
    /**
     * Publication status of the prompt
     */
    export enum status {
        ACTIVE = 'ACTIVE',
        RETIRED = 'RETIRED',
    }
}

