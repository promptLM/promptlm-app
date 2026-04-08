/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.web;

import dev.promptlm.domain.promptspec.PromptSpec;

/**
 * Request class for prompt execution.
 */
public class ExecutePromptRequest {
    private PromptSpec promptSpec;
    
    public ExecutePromptRequest() {
        // Default constructor for Jackson
    }
    
    public ExecutePromptRequest(PromptSpec promptSpec) {
        this.promptSpec = promptSpec;
    }
    
    public PromptSpec getPromptSpec() {
        return promptSpec;
    }
    
    public void setPromptSpec(PromptSpec promptSpec) {
        this.promptSpec = promptSpec;
    }
}
