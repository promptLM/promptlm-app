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

package dev.promptlm.infrastructure.config;

import dev.promptlm.domain.BasicAppContext;
import dev.promptlm.domain.projectspec.ProjectSpec;

import java.util.List;

public class ChangeAwareBasicAppContext extends BasicAppContext {

    private final Runnable onChangeCallback;

    public ChangeAwareBasicAppContext(Runnable onChangeCallback) {
        this.onChangeCallback = onChangeCallback;
    }

    @Override
    public void setActiveProject(ProjectSpec activeProject) {
        super.setActiveProject(activeProject);
        onChangeCallback.run();
    }

    @Override
    public void setProjects(List<ProjectSpec> projects) {
        super.setProjects(projects);
        onChangeCallback.run();
    }

    @Override
    public void addProject(ProjectSpec projectSpec) {
        super.addProject(projectSpec);
        onChangeCallback.run();
    }

}
