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
