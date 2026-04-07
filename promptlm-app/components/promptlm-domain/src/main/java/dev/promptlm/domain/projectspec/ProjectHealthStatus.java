package dev.promptlm.domain.projectspec;

/**
 * Represents the health state of a project repository.
 */
public enum ProjectHealthStatus {
    HEALTHY,
    BROKEN_LOCAL,
    BROKEN_REMOTE
}
