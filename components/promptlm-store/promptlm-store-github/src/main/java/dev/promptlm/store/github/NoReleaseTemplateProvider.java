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

package dev.promptlm.store.github;

import dev.promptlm.store.api.GeneratedFile;
import dev.promptlm.store.api.ReleaseProvider;
import dev.promptlm.store.api.ReleaseTemplateProvider;
import dev.promptlm.store.api.RepositoryGenerationConfig;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * {@link ReleaseTemplateProvider} used when release capability is disabled
 * (Mode 1 default). It contributes no files.
 *
 * <p>Targets {@link ReleaseProvider#NONE}.
 */
@Component
public class NoReleaseTemplateProvider implements ReleaseTemplateProvider {

    @Override
    public ReleaseProvider provider() {
        return ReleaseProvider.NONE;
    }

    @Override
    public List<GeneratedFile> generateFiles(RepositoryGenerationConfig config) {
        return List.of();
    }
}
