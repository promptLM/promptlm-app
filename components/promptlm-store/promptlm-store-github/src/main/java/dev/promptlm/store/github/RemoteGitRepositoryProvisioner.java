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

import dev.promptlm.store.api.RemoteRepositoryAlreadyExistsException;
import dev.promptlm.store.api.RepositoryOwner;
import org.kohsuke.github.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class RemoteGitRepositoryProvisioner {

    private static final Logger log = LoggerFactory.getLogger(RemoteGitRepositoryProvisioner.class);

    private final GitHubProperties gitHubProperties;

    public RemoteGitRepositoryProvisioner(GitHubProperties gitHubProperties) {
        this.gitHubProperties = gitHubProperties;
    }

    public List<RepositoryOwner> listAvailableOwners() {
        try {

            GitHub gitHub = buildClient(gitHubProperties.getBaseUrl());
            if (!gitHubCredentialValid(gitHub)) {
                throw new RuntimeException("Git Remote credentials are invalid");
            }

            GHMyself myself = gitHub.getMyself();
            String login = myself.getLogin();
            String displayName = myself.getName();
            if (!StringUtils.hasText(displayName)) {
                displayName = login;
            }

            List<RepositoryOwner> owners = new ArrayList<>();
            owners.add(RepositoryOwner.user(login, displayName));

            try {
                gitHub.getMyOrganizations().values().stream()
                        .map(org -> RepositoryOwner.organization(org.getLogin(), resolveOrganizationDisplayName(org)))
                        .sorted((left, right) -> left.id().compareToIgnoreCase(right.id()))
                        .forEach(owners::add);
            } catch (GHException | IOException ex) {
                log.debug("Unable to list organizations for repository owners.", ex);
            }

            return List.copyOf(owners);
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
    }

    private boolean gitHubCredentialValid(GitHub gitHub) {
        try {
            return gitHub.isCredentialValid();
        } catch(GHException e) {
            log.warn("GitHub Exception during credentials check.", e);
            return false;
        }
    }

    public String getDefaultOwner() {
        String resolved = resolveDefaultOwner();
        if (!StringUtils.hasText(resolved)) {
            throw new IllegalStateException("GitHub username is not configured; unable to determine repository owner");
        }
        return resolved;
    }

    public RemoteRepository createRemoteRepository(String owner, String repoName) throws RemoteRepositoryAlreadyExistsException {
        String effectiveOwner = resolveOwner(owner);
        String baseUrl = gitHubProperties.getBaseUrl();
        if (repositoryExists(baseUrl, effectiveOwner, repoName)) {
            throw new RemoteRepositoryAlreadyExistsException(baseUrl, effectiveOwner, repoName);
        }
        return _createRemoteRepository(effectiveOwner, repoName);
    }


    public boolean repositoryExists(String baseUrl, String owner, String repoName) {
        String effectiveOwner = resolveOwner(owner);
        try {
            GitHub gitHub = buildClient(baseUrl);
            if (!gitHub.isCredentialValid()) {
                throw new RuntimeException("Git Remote credentials are invalid");
            }
            log.debug("GitHub client created successfully");
            String repoFullName = effectiveOwner + "/" + repoName;
            GHRepository repository = gitHub.getRepository(repoFullName);
            boolean exists = repository != null;
            log.debug("Repository {} exists: {}", repoFullName, exists);
            return exists;
        } catch (GHFileNotFoundException notFound) {
            log.debug("Repository {}/{} does not exist", owner, repoName);
            return false;
        } catch (IOException e) {
            throw new RuntimeException("Could not check if repository exists: " + owner + "/" + repoName, e);
        }
    }


    private GitHubRepository _createRemoteRepository(String owner, String repoName) {

        try {
            GitHub gitHub = buildClient(gitHubProperties.getBaseUrl());
            if (!gitHub.isCredentialValid()) {
                throw new RuntimeException("Git Remote credentials are invalid");
            }

            GHRepository r;
            String defaultOwner = getDefaultOwner();
            if (defaultOwner.equals(owner)) {
                GHMyself myself = gitHub.getMyself();
                log.debug("Creating repository under authenticated user: {}", myself.getLogin());
                r = gitHub.createRepository(repoName)
                        .description("A promptLM store")
                        .defaultBranch("main")
                        .private_(true)
                        .create();
            } else {
                GHOrganization organization = gitHub.getOrganization(owner);
                if (organization == null) {
                    throw new IllegalArgumentException("Unable to resolve organization: " + owner);
                }
                log.debug("Creating repository under organization: {}", owner);
                r = organization.createRepository(repoName)
                        .description("A promptLM store")
                        .defaultBranch("main")
                        .private_(true)
                        .create();
            }
            return GitHubRepository.create(r.getOwnerName(), r.getName(), r.getHtmlUrl());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String resolveOwner(String requestedOwner) {
        if (requestedOwner != null && !requestedOwner.isBlank()) {
            return requestedOwner;
        }
        return getDefaultOwner();
    }

    protected GitHub buildClient(String baseUrl) throws IOException {
        return GitHubBuilder.fromProperties(gitHubProperties.asProperties())
                .withEndpoint(baseUrl)
                .build();
    }

    private String resolveDefaultOwner() {
        if (StringUtils.hasText(gitHubProperties.getUsername())) {
            return gitHubProperties.getUsername().trim();
        }

        try {
            GitHub gitHub = buildClient(gitHubProperties.getBaseUrl());
            if (!gitHubCredentialValid(gitHub)) {
                throw new IllegalStateException("GitHub username is not configured and authenticated GitHub user lookup failed");
            }

            String login = gitHub.getMyself().getLogin();
            if (StringUtils.hasText(login)) {
                return login.trim();
            }
        } catch (IOException ex) {
            log.debug("Couldn't resolve authenticated GitHub user for owner fallback", ex);
        }

        throw new IllegalStateException("GitHub username is not configured and authenticated GitHub user lookup failed");
    }

    private String resolveOrganizationDisplayName(GHOrganization organization) {
        try {
            String name = organization.getName();
            return (name != null && !name.isBlank()) ? name : organization.getLogin();
        } catch (IOException ex) {
            log.debug("Failed to retrieve display name for organization {}: {}", organization.getLogin(), ex.getMessage());
            return organization.getLogin();
        }
    }

}
