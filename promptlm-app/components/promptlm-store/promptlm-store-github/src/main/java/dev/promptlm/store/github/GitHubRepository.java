package dev.promptlm.store.github;

import java.net.URL;

class GitHubRepository implements RemoteRepository {
    private final String ownerName;
    private final String name;
    private final URL htmlUrl;

    private GitHubRepository(String ownerName, String name, URL htmlUrl) {
        this.ownerName = ownerName;
        this.name = name;
        this.htmlUrl = htmlUrl;
    }

    public static GitHubRepository create(String ownerName, String name, URL htmlUrl) {
        return new GitHubRepository(ownerName, name, htmlUrl);
    }

    @Override
    public String getOwnerName() {

        return ownerName;
    }

    @Override
    public String getName() {

        return name;
    }

    @Override
    public URL getHtmlUrl() {

        return htmlUrl;
    }

    @Override
    public String getHttpTransportUrl() {
        return htmlUrl.toExternalForm();
    }
}
