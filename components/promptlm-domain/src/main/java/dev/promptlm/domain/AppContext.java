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

import java.util.List;

/**
 * Central application context that holds the list of known projects and tracks
 * the currently active project.
 */
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
