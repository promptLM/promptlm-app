package dev.promptlm.store.api;

public class RemoteRepositoryAlreadyExistsException extends Exception {

    private final String baseUrl;
    private final String repositoryName;

    public RemoteRepositoryAlreadyExistsException(String baseUrl, String owner, String repositoryName) {
        super("Remote repository already exists: '%s'".formatted(baseUrl + "/" + owner + "/" + repositoryName));
        this.baseUrl = baseUrl;
        this.repositoryName = owner + "/" + repositoryName;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getRepositoryName() {
        return repositoryName;
    }
}
