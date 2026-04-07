package dev.promptlm.domain;

import dev.promptlm.domain.projectspec.ProjectSpec;

import java.util.List;

public interface AppContext {

    List<ProjectSpec> getProjects();

    void setProjects(List<ProjectSpec> projects);

    ProjectSpec getActiveProject();

    void setActiveProject(ProjectSpec activeProject);

    void addProject(ProjectSpec projectSpec);

    static ProjectSpec requireActiveProject(AppContext appContext) {
        ProjectSpec activeProject = appContext.getActiveProject();
        if (activeProject == null) {
            throw new IllegalStateException("Active project must be set in app context");
        }
        return activeProject;
    }
}
