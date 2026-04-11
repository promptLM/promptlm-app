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
import type { CloneStoreRepoRequest } from '../models/CloneStoreRepoRequest';
import type { ConnectRepositoryRequest } from '../models/ConnectRepositoryRequest';
import type { CreateStoreRequest } from '../models/CreateStoreRequest';
import type { ProjectSpec } from '../models/ProjectSpec';
import type { RepositoryOwner } from '../models/RepositoryOwner';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PromptStoreService {
    /**
     * Get active project
     * Returns the currently active project in the application context
     * @returns ProjectSpec Active project found
     * @throws ApiError
     */
    public static getActiveProject(): CancelablePromise<ProjectSpec> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/store',
            errors: {
                404: `No active project found`,
            },
        });
    }
    /**
     * Clone existing store
     * Clones an existing prompt store repository from a remote URL
     * @param requestBody
     * @returns string Store cloned successfully, returns the result message
     * @throws ApiError
     */
    public static cloneStore(
        requestBody: CloneStoreRepoRequest,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/store',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create new store
     * Creates a new prompt store repository in the specified directory
     * @param requestBody
     * @returns ProjectSpec Store created successfully
     * @throws ApiError
     */
    public static createStore(
        requestBody: CreateStoreRequest,
    ): CancelablePromise<ProjectSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/store',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Switch active project
     * Switches the active project to the project with the specified ID
     * @param projectId ID of the project to switch to
     * @returns any Project switched successfully
     * @throws ApiError
     */
    public static switchProject(
        projectId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/store/switch/{projectId}',
            path: {
                'projectId': projectId,
            },
            errors: {
                500: `Failed to switch projects`,
            },
        });
    }
    /**
     * Connect to existing repository
     * Connects to an existing prompt store repository at the specified path
     * @param requestBody
     * @returns ProjectSpec Connected to repository successfully
     * @throws ApiError
     */
    public static connectRepository(
        requestBody: ConnectRepositoryRequest,
    ): CancelablePromise<ProjectSpec> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/store/connection',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List available repository owners
     * Returns the authenticated user and organizations available for repository creation
     * @returns RepositoryOwner Owners retrieved successfully
     * @throws ApiError
     */
    public static listOwners(): CancelablePromise<Array<RepositoryOwner>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/store/owners',
        });
    }
    /**
     * Get all projects
     * Returns a list of all available projects
     * @returns ProjectSpec List of projects retrieved successfully
     * @throws ApiError
     */
    public static getAllProjects(): CancelablePromise<Array<ProjectSpec>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/store/all',
        });
    }
}
