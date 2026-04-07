package dev.promptlm.domain.events;

import dev.promptlm.domain.projectspec.ProjectSpec;

public class ProjectCreatedEvent {

    private final ProjectSpec projectSpec;

    public ProjectCreatedEvent(ProjectSpec projectSpec) {
        this.projectSpec = projectSpec;
    }

    public ProjectSpec getProjectSpec() {
        return projectSpec;
    }
}
