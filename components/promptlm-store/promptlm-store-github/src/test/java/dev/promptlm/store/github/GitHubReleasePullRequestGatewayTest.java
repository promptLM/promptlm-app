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

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitHubReleasePullRequestGatewayTest {

    @Test
    void validatePrModeCapabilitiesFailsFastWhenCredentialsAreMissing() {
        GitHubProperties properties = new GitHubProperties();
        properties.setUsername("");
        properties.setToken("");
        properties.setBaseUrl("https://api.github.com");

        GitHubReleasePullRequestGateway gateway = new GitHubReleasePullRequestGateway(properties);

        assertThatThrownBy(() -> gateway.validatePrModeCapabilities("promptLM/promptlm-app"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("promptlm.store.remote.username")
                .hasMessageContaining("promptlm.store.remote.token")
                .hasMessageContaining("create/read pull requests")
                .hasMessageContaining("create/read tags");
    }
}
