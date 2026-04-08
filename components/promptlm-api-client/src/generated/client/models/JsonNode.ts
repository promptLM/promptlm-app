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
export type JsonNode = {
    number?: boolean;
    container?: boolean;
    floatingPointNumber?: boolean;
    missingNode?: boolean;
    nodeType?: JsonNode.nodeType;
    string?: boolean;
    integralNumber?: boolean;
    valueNode?: boolean;
    pojo?: boolean;
    short?: boolean;
    int?: boolean;
    long?: boolean;
    double?: boolean;
    bigDecimal?: boolean;
    bigInteger?: boolean;
    /**
     * @deprecated
     */
    textual?: boolean;
    boolean?: boolean;
    binary?: boolean;
    empty?: boolean;
    array?: boolean;
    null?: boolean;
    object?: boolean;
    float?: boolean;
    embeddedValue?: boolean;
};
export namespace JsonNode {
    export enum nodeType {
        ARRAY = 'ARRAY',
        BINARY = 'BINARY',
        BOOLEAN = 'BOOLEAN',
        MISSING = 'MISSING',
        NULL = 'NULL',
        NUMBER = 'NUMBER',
        OBJECT = 'OBJECT',
        POJO = 'POJO',
        STRING = 'STRING',
    }
}

