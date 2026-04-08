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

import dev.promptlm.domain.projectspec.ProjectSpec;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ChangeAwareBasicAppContextTest {

    @Test
    void invokesCallbackWhenSettingActiveProject() {
        AtomicInteger callbackCount = new AtomicInteger(0);
        ChangeAwareBasicAppContext context = new ChangeAwareBasicAppContext(callbackCount::incrementAndGet);

        ProjectSpec project = ProjectSpec.fromRepo(Path.of("repo-a"));
        context.setActiveProject(project);

        assertEquals(1, callbackCount.get());
    }

    @Test
    void invokesCallbackWhenSettingProjects() {
        AtomicInteger callbackCount = new AtomicInteger(0);
        ChangeAwareBasicAppContext context = new ChangeAwareBasicAppContext(callbackCount::incrementAndGet);

        context.setProjects(List.of(ProjectSpec.fromRepo(Path.of("repo-a"))));

        assertEquals(1, callbackCount.get());
    }

    @Test
    void invokesCallbackWhenAddingProject() {
        AtomicInteger callbackCount = new AtomicInteger(0);
        ChangeAwareBasicAppContext context = new ChangeAwareBasicAppContext(callbackCount::incrementAndGet);

        context.addProject(ProjectSpec.fromRepo(Path.of("repo-a")));

        assertEquals(1, callbackCount.get());
    }
}
