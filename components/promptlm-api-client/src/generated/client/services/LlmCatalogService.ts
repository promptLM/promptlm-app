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
import type { ModelCatalogResponse } from '../models/ModelCatalogResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LlmCatalogService {
    /**
     * Get model catalog
     * Returns the list of available vendors and models.
     * @returns ModelCatalogResponse Model catalog
     * @throws ApiError
     */
    public static getCatalog(): CancelablePromise<ModelCatalogResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/llm/catalog',
        });
    }
}
