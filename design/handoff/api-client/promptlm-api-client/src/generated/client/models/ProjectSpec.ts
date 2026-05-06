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
 * Project specification for a prompt store repository
 */
export type ProjectSpec = {
    id?: string;
    name?: string;
    description?: string;
    healthStatus?: ProjectSpec.healthStatus;
    healthMessage?: string;
    repoDir?: {
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
     * Timestamp when the project was created
     */
    createdAt?: string;
    /**
     * Timestamp when the project was last updated
     */
    updatedAt?: string;
    /**
     * Number of prompt specs in this project
     */
    promptCount?: number;
    /**
     * Local filesystem path where the repository is checked out
     */
    localPath?: string;
    /**
     * Remote repository URL
     */
    repositoryUrl?: string;
};
export namespace ProjectSpec {
    export enum healthStatus {
        HEALTHY = 'HEALTHY',
        BROKEN_LOCAL = 'BROKEN_LOCAL',
        BROKEN_REMOTE = 'BROKEN_REMOTE',
    }
}

