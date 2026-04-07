package dev.promptlm.store.github;

/**
 * Exception indicating errors during Git operations.
 */
public class GitException extends RuntimeException {

    public GitException(String message) {
        super(message);
    }

    public GitException(String message, Throwable cause) {
        super(message, cause);
    }

    public GitException(Throwable cause) {
        super(cause);
    }
}
