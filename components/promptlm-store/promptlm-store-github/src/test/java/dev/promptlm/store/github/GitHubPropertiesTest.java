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

import dev.promptlm.GitHubPromptStoreConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitHubPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
            .withUserConfiguration(GitHubPromptStoreConfig.class);

    @Test
    void shouldDefaultBaseUrlWhenNotConfigured() {
        contextRunner.run(context -> {
            GitHubProperties props = context.getBean(GitHubProperties.class);
            assertThat(props.getBaseUrl()).isEqualTo("https://api.github.com");
            assertThat(props.isAllowLoopbackHostAliases()).isTrue();
        });
    }

    @Test
    void shouldBindCanonicalRemoteProperties() {
        contextRunner
                .withPropertyValues(
                        "promptlm.store.remote.base-url=http://localhost:3002/api/v1",
                        "promptlm.store.remote.username=testuser",
                        "promptlm.store.remote.token=test-token",
                        "promptlm.store.remote.allow-loopback-host-aliases=false"
                )
                .run(context -> {
                    GitHubProperties props = context.getBean(GitHubProperties.class);
                    assertThat(props.getBaseUrl()).isEqualTo("http://localhost:3002/api/v1");
                    assertThat(props.getUsername()).isEqualTo("testuser");
                    assertThat(props.getToken()).isEqualTo("test-token");
                    assertThat(props.isAllowLoopbackHostAliases()).isFalse();
                    assertThat(props.asProperties().getProperty("login")).isEqualTo("testuser");
                    assertThat(props.asProperties().getProperty("oauth")).isEqualTo("test-token");
                });
    }

    @Test
    void shouldFallbackToDefaultBaseUrlWhenConfiguredBlank() {
        contextRunner
                .withPropertyValues("promptlm.store.remote.base-url=")
                .run(context -> {
                    GitHubProperties props = context.getBean(GitHubProperties.class);
                    assertThat(props.getBaseUrl()).isEqualTo("https://api.github.com");
                });
    }

    @Test
    void shouldFailFastWhenBaseUrlContainsUnresolvedPlaceholder() {
        GitHubProperties props = new GitHubProperties();
        props.setBaseUrl("${REPO_REMOTE_URL}");

        assertThatThrownBy(props::getBaseUrl)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("promptlm.store.remote.base-url contains an unresolved placeholder");
    }
}
