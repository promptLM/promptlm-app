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

package dev.promptlm.template;

import dev.promptlm.domain.promptspec.ChatCompletionRequest;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.lifecycle.application.PromptTemplatePort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class PromptTemplateAdapter implements PromptTemplatePort {

    private final PromptSpecTemplateRenderer templateRenderer;

    public PromptTemplateAdapter(PromptSpecTemplateRenderer templateRenderer) {
        this.templateRenderer = templateRenderer;
    }

    @Override
    public PromptSpec render(String templateContent,
                             String group,
                             String name,
                             List<ChatCompletionRequest.Message> userMessage,
                             Map<String, String> placeholder,
                             PromptSpec.Placeholders placeholderConfig) {
        return templateRenderer.createPromptSpecFromTemplate(templateContent, group, name, userMessage, placeholder, placeholderConfig);
    }
}
