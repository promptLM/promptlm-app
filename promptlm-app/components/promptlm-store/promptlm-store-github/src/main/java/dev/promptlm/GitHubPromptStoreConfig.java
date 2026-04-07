package dev.promptlm;

import dev.promptlm.store.github.GitHubProperties;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(GitHubProperties.class)
public class GitHubPromptStoreConfig {
}
