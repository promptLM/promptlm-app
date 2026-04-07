package dev.promptlm.store.github;

import dev.promptlm.GitHubPromptStoreConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

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
}
