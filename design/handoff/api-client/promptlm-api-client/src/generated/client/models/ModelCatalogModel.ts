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
 * Model entry in the catalog.
 */
export type ModelCatalogModel = {
    /**
     * Model identifier
     */
    id?: string;
    /**
     * Display name
     */
    displayName?: string;
    /**
     * Origin of the model entry
     */
    source?: string;
    /**
     * Whether the model supports chat/completion style requests
     */
    supportsChat?: boolean;
    /**
     * Whether additional configuration is required before use
     */
    requiresConfig?: boolean;
    /**
     * Optional target route for gateway aliases
     */
    target?: string;
};

