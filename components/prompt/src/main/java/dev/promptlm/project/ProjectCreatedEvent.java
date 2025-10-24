package dev.promptlm.project;

import org.springframework.context.ApplicationEvent;

import java.nio.file.Path;

public class ProjectCreatedEvent extends ApplicationEvent {
    public ProjectCreatedEvent(Path projectPath) {
        super(projectPath);
    }
}
