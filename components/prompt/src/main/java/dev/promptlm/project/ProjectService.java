package dev.promptlm.project;

import org.springframework.context.ApplicationEventPublisher;

import java.nio.file.Path;

public class ProjectService {

    private final ApplicationEventPublisher eventPublisher;
    private final ProjectRepository projectRepository;

    public ProjectService(ApplicationEventPublisher eventPublisher, ProjectRepository projectRepository) {
        this.eventPublisher = eventPublisher;
        this.projectRepository = projectRepository;
    }

    public Project loadProject(Path projectPath) {
        return projectRepository.findByPath(projectPath);
    }

    public void createProject(ProjectCreationRequest request) {
        Project project = _createProject(request);
        project = projectRepository.save(project);
        eventPublisher.publishEvent(new ProjectCreatedEvent(project.getProjectPath()));
    }

    private static Project _createProject(ProjectCreationRequest request) {
        return new Project(request.getProjectPath());
    }

}
