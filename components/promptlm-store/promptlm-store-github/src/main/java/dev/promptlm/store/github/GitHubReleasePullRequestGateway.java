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

import org.kohsuke.github.GHIssueState;
import org.kohsuke.github.GHPullRequest;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
class GitHubReleasePullRequestGateway implements ReleasePullRequestGateway {

    private static final String REQUIRED_PR_MODE_PERMISSIONS = """
            PR-mode release requires repository permissions for:
            - create/read pull requests
            - read branch refs
            - create/read tags
            - push access on release branches
            Ensure promptlm.store.remote credentials provide repository write access.""";

    private final GitHubProperties gitHubProperties;

    GitHubReleasePullRequestGateway(GitHubProperties gitHubProperties) {
        this.gitHubProperties = gitHubProperties;
    }

    @Override
    public ReleasePullRequest createReleasePullRequest(String repositoryFullName,
                                                       String headBranch,
                                                       String baseBranch,
                                                       String title,
                                                       String body) {
        try {
            GHRepository repository = buildClient().getRepository(repositoryFullName);
            GHPullRequest pullRequest = repository.createPullRequest(title, headBranch, baseBranch, body);
            return toReleasePullRequest(pullRequest);
        } catch (IOException e) {
            throw new GitException("Failed to create release pull request for %s".formatted(repositoryFullName), e);
        }
    }

    @Override
    public ReleasePullRequest getPullRequest(String repositoryFullName, int pullRequestNumber) {
        try {
            GHRepository repository = buildClient().getRepository(repositoryFullName);
            return toReleasePullRequest(repository.getPullRequest(pullRequestNumber));
        } catch (IOException e) {
            throw new GitException(
                    "Failed to read pull request #%d for %s".formatted(pullRequestNumber, repositoryFullName),
                    e
            );
        }
    }

    @Override
    public List<ReleasePullRequest> listOpenPullRequests(String repositoryFullName, String baseBranch) {
        try {
            GHRepository repository = buildClient().getRepository(repositoryFullName);
            return repository.getPullRequests(GHIssueState.OPEN).stream()
                    .map(this::toReleasePullRequest)
                    .filter(pr -> baseBranch.equals(pr.baseRef()))
                    .toList();
        } catch (IOException e) {
            throw new GitException("Failed to list open pull requests for %s".formatted(repositoryFullName), e);
        }
    }

    @Override
    public void validatePrModeCapabilities(String repositoryFullName) {
        if (gitHubProperties.getUsername() == null || gitHubProperties.getUsername().isBlank()
                || gitHubProperties.getToken() == null || gitHubProperties.getToken().isBlank()) {
            throw new IllegalStateException(
                    "PR-mode release requires configured promptlm.store.remote.username and promptlm.store.remote.token.\n"
                            + REQUIRED_PR_MODE_PERMISSIONS
            );
        }

        try {
            GitHub client = buildClient();
            GHRepository repository = client.getRepository(repositoryFullName);
            if (!repository.hasPullAccess() || !repository.hasPushAccess()) {
                throw new IllegalStateException(
                        "PR-mode release token is missing required repository access for %s.\n%s"
                                .formatted(repositoryFullName, REQUIRED_PR_MODE_PERMISSIONS)
                );
            }

            repository.getBranch(GitHubPromptStore.MAIN_BRANCH);
            repository.getPullRequests(GHIssueState.OPEN);
            repository.listTags().iterator().hasNext();
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to validate PR-mode release capabilities for %s: %s%n%s"
                            .formatted(repositoryFullName, e.getMessage(), REQUIRED_PR_MODE_PERMISSIONS),
                    e
            );
        }
    }

    private GitHub buildClient() throws IOException {
        return GitHubBuilder.fromProperties(gitHubProperties.asProperties())
                .withEndpoint(gitHubProperties.getEndpoint())
                .build();
    }

    private ReleasePullRequest toReleasePullRequest(GHPullRequest pullRequest) {
        try {
            return new ReleasePullRequest(
                    pullRequest.getNumber(),
                    pullRequest.getHtmlUrl().toString(),
                    pullRequest.getState().name().toLowerCase(),
                    pullRequest.isMerged(),
                    pullRequest.getHead().getRef(),
                    pullRequest.getBase().getRef(),
                    pullRequest.getMergeCommitSha()
            );
        } catch (IOException e) {
            throw new GitException("Failed to map pull request #%d".formatted(pullRequest.getNumber()), e);
        }
    }
}
