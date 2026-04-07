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

import dev.promptlm.store.api.RepositoryOwner;
import org.junit.jupiter.api.Test;
import org.kohsuke.github.GHMyself;
import org.kohsuke.github.GHOrganization;
import org.kohsuke.github.GitHub;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RemoteGitRepositoryProvisionerTest {

    @Test
    void shouldResolveDefaultOwnerFromAuthenticatedUserWhenUsernameMissing() throws Exception {
        GitHub gitHub = mock(GitHub.class);
        when(gitHub.isCredentialValid()).thenReturn(true);

        GHMyself myself = mock(GHMyself.class);
        when(gitHub.getMyself()).thenReturn(myself);
        when(myself.getLogin()).thenReturn("alice");

        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://example.invalid");

        RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties) {
            @Override
            protected GitHub buildClient(String baseUrl) {
                return gitHub;
            }
        };

        assertThat(provisioner.getDefaultOwner()).isEqualTo("alice");
    }

    @Test
    void shouldFailWhenConfiguredUsernameMissingAndGitHubUserCannotBeResolved() throws Exception {
        GitHub gitHub = mock(GitHub.class);
        when(gitHub.isCredentialValid()).thenReturn(false);

        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://example.invalid");

        RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties) {
            @Override
            protected GitHub buildClient(String baseUrl) {
                return gitHub;
            }
        };

        assertThatThrownBy(provisioner::getDefaultOwner)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("authenticated GitHub user lookup failed");
    }

    /**
     * Verifies owner discovery always includes the authenticated user as the first entry.
     */
    @Test
    void shouldListAuthenticatedUserFirst() throws Exception {
        GitHub gitHub = mock(GitHub.class);
        when(gitHub.isCredentialValid()).thenReturn(true);

        GHMyself myself = mock(GHMyself.class);
        when(gitHub.getMyself()).thenReturn(myself);
        when(myself.getLogin()).thenReturn("alice");
        when(myself.getName()).thenReturn("Alice Doe");

        when(gitHub.getMyOrganizations()).thenReturn(Map.of());

        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://example.invalid");

        RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties) {
            @Override
            protected GitHub buildClient(String baseUrl) {
                return gitHub;
            }
        };

        List<RepositoryOwner> owners = provisioner.listAvailableOwners();

        assertThat(owners)
                .extracting(RepositoryOwner::id, RepositoryOwner::displayName, RepositoryOwner::type)
                .containsExactly(
                        tuple("alice", "Alice Doe", RepositoryOwner.Type.USER)
                );
    }

    /**
     * Verifies organization owners are listed after the user and sorted by id.
     */
    @Test
    void shouldListOrganizationsSortedById() throws Exception {
        GitHub gitHub = mock(GitHub.class);
        when(gitHub.isCredentialValid()).thenReturn(true);

        GHMyself myself = mock(GHMyself.class);
        when(gitHub.getMyself()).thenReturn(myself);
        when(myself.getLogin()).thenReturn("alice");
        when(myself.getName()).thenReturn("Alice Doe");

        GHOrganization orgA = mock(GHOrganization.class);
        when(orgA.getLogin()).thenReturn("a-org");
        when(orgA.getName()).thenReturn("A Org");

        GHOrganization orgZ = mock(GHOrganization.class);
        when(orgZ.getLogin()).thenReturn("z-org");
        when(orgZ.getName()).thenReturn("Z Org");

        when(gitHub.getMyOrganizations()).thenReturn(Map.of(
                "z-org", orgZ,
                "a-org", orgA
        ));

        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://example.invalid");

        RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties) {
            @Override
            protected GitHub buildClient(String baseUrl) {
                return gitHub;
            }
        };

        List<RepositoryOwner> owners = provisioner.listAvailableOwners();

        assertThat(owners)
                .extracting(RepositoryOwner::id, RepositoryOwner::displayName, RepositoryOwner::type)
                .containsExactly(
                        tuple("alice", "Alice Doe", RepositoryOwner.Type.USER),
                        tuple("a-org", "A Org", RepositoryOwner.Type.ORGANIZATION),
                        tuple("z-org", "Z Org", RepositoryOwner.Type.ORGANIZATION)
                );
    }

    /**
     * Verifies the user display name falls back to the login when the API returns no name.
     */
    @Test
    void shouldUseLoginWhenAuthenticatedUserNameMissing() throws Exception {
        GitHub gitHub = mock(GitHub.class);
        when(gitHub.isCredentialValid()).thenReturn(true);

        GHMyself myself = mock(GHMyself.class);
        when(gitHub.getMyself()).thenReturn(myself);
        when(myself.getLogin()).thenReturn("alice");
        when(myself.getName()).thenReturn(null);

        when(gitHub.getMyOrganizations()).thenReturn(Map.of());

        GitHubProperties properties = new GitHubProperties();
        properties.setBaseUrl("http://example.invalid");

        RemoteGitRepositoryProvisioner provisioner = new RemoteGitRepositoryProvisioner(properties) {
            @Override
            protected GitHub buildClient(String baseUrl) {
                return gitHub;
            }
        };

        List<RepositoryOwner> owners = provisioner.listAvailableOwners();

        assertThat(owners)
                .extracting(RepositoryOwner::id, RepositoryOwner::displayName, RepositoryOwner::type)
                .containsExactly(
                        tuple("alice", "alice", RepositoryOwner.Type.USER)
                );
    }

}
