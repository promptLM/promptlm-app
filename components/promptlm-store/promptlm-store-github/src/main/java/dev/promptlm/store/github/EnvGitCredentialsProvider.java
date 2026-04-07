package dev.promptlm.store.github;

import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
class EnvGitCredentialsProvider {

    private final GitHubProperties properties;

    EnvGitCredentialsProvider(GitHubProperties properties) {
        this.properties = properties;
    }

    public boolean hasConfiguredCredentials() {
        return StringUtils.hasText(properties.getUsername()) && StringUtils.hasText(properties.getToken());
    }

    public UsernamePasswordCredentialsProvider getCredentials() {
        return new UsernamePasswordCredentialsProvider(properties.getUsername(), properties.getToken());
    }
}
