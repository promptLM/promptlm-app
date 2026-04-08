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
import type { PromptSpecRequest } from './PromptSpecRequest';
import type { VendorAndModel } from './VendorAndModel';
/**
 * Prompt specification creation request details
 */
export type PromptSpecCreationRequest = {
    /**
     * Unique identifier of the prompt being created or updated
     */
    id?: string;
    /**
     * Human-readable name of the prompt
     */
    name: string;
    /**
     * Grouping label for the prompt
     */
    group: string;
    /**
     * Functional description of the prompt
     */
    description?: string;
    /**
     * Default placeholder values keyed by placeholder name
     */
    placeholder?: Record<string, any>;
    /**
     * Opening delimiter for placeholders
     */
    placeholderStartPattern?: string;
    /**
     * Closing delimiter for placeholders
     */
    placeholderEndPattern?: string;
    /**
     * User-facing template copy rendered in the UI
     */
    userMessage?: string;
    /**
     * Type of the prompt request
     */
    type?: string;
    /**
     * LLM request configuration
     */
    request?: PromptSpecRequest;
    /**
     * Primary vendor and model selection
     */
    vendorAndModel?: VendorAndModel;
    /**
     * Conversation messages that make up the prompt
     */
    messages?: Array<Message>;
    /**
     * Semantic version of the prompt draft
     */
    version?: string;
    /**
     * Custom extension payloads keyed by x-*
     */
    extensions?: Record<string, any>;
    /**
     * Source repository URL containing the prompt definition
     */
    repositoryUrl?: string;
};

