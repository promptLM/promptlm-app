package dev.promptlm.store.github;

import org.junit.jupiter.api.Test;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TrustedRemotePolicyTest {

    @Test
    void shouldAllowCloneImportWhenRemoteMatchesConfiguredHost() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://localhost:3003/api/v1");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        URI allowed = policy.assertCloneImportRemoteAllowed(URI.create("http://localhost:3003/testuser/repo.git"));

        assertThat(allowed).isEqualTo(URI.create("http://localhost:3003/testuser/repo.git"));
    }

    @Test
    void shouldAllowLoopbackAliasWhenBaseHostIsLoopback() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://localhost:3003/api/v1");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        URI allowed = policy.assertCloneImportRemoteAllowed(
                URI.create("http://localhost.localtest.me:3003/testuser/repo.git")
        );

        assertThat(allowed).isEqualTo(URI.create("http://localhost.localtest.me:3003/testuser/repo.git"));
        assertThat(policy.isTrustedForCredentialForwarding("http://localhost.localtest.me:3003/testuser/repo.git")).isTrue();
    }

    @Test
    void shouldRejectCloneImportWhenRemoteHostDiffers() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://localhost:3003/api/v1");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        assertThatThrownBy(() -> policy.assertCloneImportRemoteAllowed(URI.create("https://example.com/testuser/repo.git")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Remote repository host is not allowed");
    }

    @Test
    void shouldRejectCloneImportWhenLoopbackPortDiffers() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://localhost:3003/api/v1");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        assertThatThrownBy(() -> policy.assertCloneImportRemoteAllowed(
                URI.create("http://localhost.localtest.me:3004/testuser/repo.git")
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Remote repository host is not allowed");
    }

    @Test
    void shouldRejectLoopbackAliasWhenDisabled() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://localhost:3003/api/v1");
        properties.setAllowLoopbackHostAliases(false);
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        assertThat(policy.isTrustedForCredentialForwarding("http://localhost.localtest.me:3003/testuser/repo.git")).isFalse();
        assertThatThrownBy(() -> policy.assertCloneImportRemoteAllowed(
                URI.create("http://localhost.localtest.me:3003/testuser/repo.git")
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Remote repository host is not allowed");
    }

    @Test
    void shouldRejectInlineCredentialsInRemoteUrl() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://localhost:3003/api/v1");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        assertThatThrownBy(() -> policy.assertCloneImportRemoteAllowed(URI.create("http://user:secret@localhost:3003/test/repo.git")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must not include inline credentials");
    }

    @Test
    void shouldTreatGithubComAsTrustedWhenApiHostIsApiGithubCom() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("https://api.github.com");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        assertThat(policy.isTrustedForCredentialForwarding("https://github.com/promptLM/promptLM.git")).isTrue();
        assertThat(policy.isTrustedForCredentialForwarding("https://api.github.com/repos/promptLM/promptLM")).isFalse();
    }

    @Test
    void shouldNeverForwardCredentialsToNonHttpRemotes() {
        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("https://api.github.com");
        TrustedRemotePolicy policy = new TrustedRemotePolicy(properties);

        assertThat(policy.isTrustedForCredentialForwarding("git@github.com:promptLM/promptLM.git")).isFalse();
        assertThat(policy.isTrustedForCredentialForwarding("file:///tmp/repo.git")).isFalse();
    }
}
