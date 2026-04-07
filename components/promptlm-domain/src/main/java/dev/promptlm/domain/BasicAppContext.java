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

package dev.promptlm.domain;

import dev.promptlm.domain.projectspec.ProjectSpec;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class BasicAppContext implements AppContext {

    private List<ProjectSpec> projects = new ArrayList<>();
    private ProjectSpec activeProject;

    public BasicAppContext() {

    }

    @Override
    public void setProjects(List<ProjectSpec> projects) {
        this.projects = new ArrayList<>();
        if (projects == null) {
            return;
        }
        for (ProjectSpec project : projects) {
            if (project == null) {
                continue;
            }
            int existingIndex = findProjectIndex(project);
            if (existingIndex >= 0) {
                this.projects.set(existingIndex, project);
            } else {
                this.projects.add(project);
            }
        }
    }

    @Override
    public void setActiveProject(ProjectSpec activeProject) {
        if (activeProject == null) {
            this.activeProject = null;
            return;
        }
        int existingIndex = findProjectIndex(activeProject);
        if (existingIndex >= 0) {
            projects.set(existingIndex, activeProject);
            this.activeProject = projects.get(existingIndex);
            return;
        }
        projects.add(activeProject);
        this.activeProject = activeProject;
    }

    @Override
    public void addProject(ProjectSpec projectSpec) {
        if(projectSpec == null) {
            throw new IllegalArgumentException("Project cannot be null");
        }
        int existingIndex = findProjectIndex(projectSpec);
        if (existingIndex >= 0) {
            projects.set(existingIndex, projectSpec);
            if (activeProject != null && isSameProject(activeProject, projectSpec)) {
                activeProject = projectSpec;
            }
            return;
        }
        projects.add(projectSpec);
    }

    public List<ProjectSpec> getProjects() {
        return projects;
    }

    public ProjectSpec getActiveProject() {
        return activeProject;
    }

    private int findProjectIndex(ProjectSpec candidate) {
        for (int i = 0; i < projects.size(); i++) {
            if (isSameProject(projects.get(i), candidate)) {
                return i;
            }
        }
        return -1;
    }

    private boolean isSameProject(ProjectSpec first, ProjectSpec second) {
        if (first == null || second == null) {
            return false;
        }
        if (first.getId() != null && second.getId() != null) {
            return Objects.equals(first.getId(), second.getId());
        }
        if (first.getRepoDir() != null && second.getRepoDir() != null) {
            return first.getRepoDir().toAbsolutePath().normalize()
                    .equals(second.getRepoDir().toAbsolutePath().normalize());
        }
        if (first.getRepoUrl() != null && second.getRepoUrl() != null) {
            return Objects.equals(first.getRepoUrl(), second.getRepoUrl());
        }
        return false;
    }

}
