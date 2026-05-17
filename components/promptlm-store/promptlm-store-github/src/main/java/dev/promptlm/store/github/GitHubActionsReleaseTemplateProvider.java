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
 * {@link ReleaseTemplateProvider} that targets GitHub / Gitea Actions.
 *
 * <p>Used when {@link RepositoryGenerationConfig#releaseProvider()} is
 * {@link ReleaseProvider#GITHUB_ACTIONS} and
 * {@link RepositoryGenerationConfig#releaseEnabled()} is {@code true}.
 *
 * <h2>Transitional behaviour</h2>
 * <p>Today the GitHub Actions workflow files (along with the matching
 * validation and packaging scripts) ship as part of the
 * {@code repository-template} zip and are extracted by
 * {@code RepositoryTemplateExtractor}. Behaviour is therefore preserved by
 * this provider returning an empty list — the files are still delivered, just
 * through the existing zip mechanism.
 *
 * <p>Once the release-toggle / Mode 2 work (tracked under issues #161 and
 * #163) lands, the responsibility for those files moves into this provider so
 * that disabling release capability simply omits them. At that point this
 * implementation will return the workflow files, validation scripts, and
 * packaging scripts derived from the supplied configuration.
 */
@Component
public class GitHubActionsReleaseTemplateProvider implements ReleaseTemplateProvider {

    @Override
    public ReleaseProvider provider() {
        return ReleaseProvider.GITHUB_ACTIONS;
    }

    @Override
    public List<GeneratedFile> generateFiles(RepositoryGenerationConfig config) {
        // Files are currently delivered via the repository-template zip
        // extractor. This provider exists as the SPI hook into which #161 /
        // #163 will plug the actual workflow / script files. Returning an
        // empty list keeps behaviour equivalent to pre-refactor.
        return List.of();
    }
}
