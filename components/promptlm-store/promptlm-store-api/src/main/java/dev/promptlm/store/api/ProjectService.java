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

package dev.promptlm.store.api;

import java.net.URI;
import java.nio.file.Path;

import dev.promptlm.domain.projectspec.ProjectSpec;

import java.util.List;

public interface ProjectService {

    ProjectSpec newProject(Path baseDir, String projectName) throws RemoteRepositoryAlreadyExistsException;

    ProjectSpec newProject(Path baseDir, String owner, String projectName) throws RemoteRepositoryAlreadyExistsException;

    ProjectSpec importProject(String name, Path targetDir);

    ProjectSpec importProject(URI remoteUrl, Path targetDir);

    ProjectSpec switchProject(Path path);

    ProjectSpec connectProject(Path repoPath);

    List<RepositoryOwner> listAvailableOwners();

}
