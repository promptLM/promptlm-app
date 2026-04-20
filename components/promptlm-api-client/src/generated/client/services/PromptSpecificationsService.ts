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
import type { ExecutePromptRequest } from '../models/ExecutePromptRequest';
import type { PromptSpec } from '../models/PromptSpec';
import type { PromptSpecCreationRequest } from '../models/PromptSpecCreationRequest';
import type { PromptStats } from '../models/PromptStats';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PromptSpecificationsService {
    /**
     * Get prompt specification by ID
     * Retrieves the latest version of a prompt specification by its unique identifier
     * @param promptSpecId Unique identifier of the prompt specification
     * @returns PromptSpec Prompt specification found
     * @throws ApiError
     */
    public static getById(
        promptSpecId: string,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prompts/{promptSpecId}',
            path: {
                'promptSpecId': promptSpecId,
            },
            errors: {
                404: `Prompt specification not found`,
            },
        });
    }
    /**
     * Update an existing prompt specification
     * Updates an existing prompt specification with the provided details
     * @param promptSpecId ID of the prompt specification to update
     * @param requestBody
     * @returns PromptSpec Prompt specification updated successfully
     * @throws ApiError
     */
    public static updatePromptSpec(
        promptSpecId: string,
        requestBody: PromptSpecCreationRequest,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/prompts/{promptSpecId}',
            path: {
                'promptSpecId': promptSpecId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Prompt specification not found`,
            },
        });
    }
    /**
     * Retire a prompt specification
     * Marks a prompt specification as retired with an optional retirement reason
     * @param promptSpecId ID of the prompt specification to retire
     * @param reason Optional reason for retiring this prompt specification
     * @returns PromptSpec Prompt specification retired successfully
     * @throws ApiError
     */
    public static retirePrompt(
        promptSpecId: string,
        reason?: string,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/prompts/{promptSpecId}/retire',
            path: {
                'promptSpecId': promptSpecId,
            },
            query: {
                'reason': reason,
            },
            errors: {
                404: `Prompt specification not found`,
            },
        });
    }
    /**
     * List all prompt specifications
     * Returns a list of prompt specifications
     * @returns PromptSpec List of prompt specifications
     * @throws ApiError
     */
    public static listPromptSpecs(): CancelablePromise<Array<PromptSpec>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prompts',
        });
    }
    /**
     * Create a new prompt specification
     * Creates a new prompt specification with the provided details
     * @param requestBody
     * @returns PromptSpec Prompt specification created successfully
     * @throws ApiError
     */
    public static createPromptSpec(
        requestBody: PromptSpecCreationRequest,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Failed to create prompt specification`,
            },
        });
    }
    /**
     * Release a new version of a prompt
     * Requests release for a prompt specification. In direct mode the response state is released. In pr_two_phase mode the response state is requested until /release/complete is called.
     * @param promptSpecId The unique identifier of the prompt specification to release.
     * @returns PromptSpec Release operation response as prompt specification. Header X-PromptLM-Release-State mirrors extensions.x-promptlm.release.state (requested|released).
     * @throws ApiError
     */
    public static releasePrompt(
        promptSpecId: string,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts/{promptSpecId}/release',
            path: {
                'promptSpecId': promptSpecId,
            },
            errors: {
                404: `Prompt specification with the given ID not found.`,
            },
        });
    }
    /**
     * Complete a pending prompt release
     * Finalizes a previously requested PR-mode release after validating the referenced pull request has been merged into main. Header X-PromptLM-Release-State is released on success.
     * @param promptSpecId The unique identifier of the prompt specification to complete.
     * @param pr Pull request number or URL for the pending release request.
     * @returns PromptSpec Completed release response.
     * @throws ApiError
     */
    public static completeReleasePrompt(
        promptSpecId: string,
        pr: string,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts/{promptSpecId}/release/complete',
            path: {
                'promptSpecId': promptSpecId,
            },
            query: {
                'pr': pr,
            },
            errors: {
                404: `Prompt specification with the given ID not found.`,
            },
        });
    }
    /**
     * Execute a stored prompt specification
     * Loads the stored prompt specification by ID, executes it, and returns the result
     * @param promptSpecId ID of the prompt specification to execute
     * @param requestBody
     * @returns PromptSpec Prompt executed successfully
     * @throws ApiError
     */
    public static executeStoredPrompt(
        promptSpecId: string,
        requestBody?: ExecutePromptRequest,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts/{promptSpecId}/execute',
            path: {
                'promptSpecId': promptSpecId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Prompt specification not found`,
                500: `Error executing the prompt`,
            },
        });
    }
    /**
     * Execute a prompt specification
     * Executes the given prompt specification with the configured LLM and returns the result
     * @param requestBody
     * @returns PromptSpec Prompt executed successfully
     * @throws ApiError
     */
    public static executePrompt(
        requestBody: ExecutePromptRequest,
    ): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts/execute',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid prompt specification`,
                500: `Error executing the prompt`,
            },
        });
    }
    /**
     * Get default prompt template
     * Returns a new prompt specification with default values
     * @returns PromptSpec Default prompt template
     * @throws ApiError
     */
    public static getDefaultTemplate(): CancelablePromise<PromptSpec> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prompts/template',
        });
    }
    /**
     * Get prompt statistics
     * Returns statistics about prompts in the store including counts and distributions
     * @returns PromptStats Prompt statistics retrieved successfully
     * @throws ApiError
     */
    public static getPromptStats(): CancelablePromise<PromptStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prompts/stats',
        });
    }
    /**
     * Get all prompt groups
     * Returns a list of all unique prompt group names
     * @param includeRetired Include groups that only contain retired prompts
     * @returns string List of prompt groups
     * @throws ApiError
     */
    public static getPromptGroups(
        includeRetired: boolean = false,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prompts/groups',
            query: {
                'includeRetired': includeRetired,
            },
        });
    }
}
