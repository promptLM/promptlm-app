package dev.promptlm.store.github;

import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
class LocalWorkspacePathPolicy {

    private final StoreLocalProperties storeLocalProperties;

    LocalWorkspacePathPolicy(StoreLocalProperties storeLocalProperties) {
        this.storeLocalProperties = storeLocalProperties;
    }

    public Path assertWithinWorkspace(Path candidatePath, String fieldName) {
        if (candidatePath == null) {
            throw new IllegalArgumentException(fieldName + " must not be null");
        }

        Path workspaceRoot = resolveWorkspaceRoot();
        Path normalizedCandidate = candidatePath.toAbsolutePath().normalize();
        if (!normalizedCandidate.startsWith(workspaceRoot)) {
            throw new IllegalArgumentException(
                    "%s must be located under workspace root %s, but was %s"
                            .formatted(fieldName, workspaceRoot, normalizedCandidate)
            );
        }

        return normalizedCandidate;
    }

    private Path resolveWorkspaceRoot() {
        Path workspaceRoot = storeLocalProperties.getWorkspaceRoot();
        if (workspaceRoot == null) {
            throw new IllegalStateException("promptlm.store.local.workspace-root must be configured");
        }
        return workspaceRoot.toAbsolutePath().normalize();
    }
}
