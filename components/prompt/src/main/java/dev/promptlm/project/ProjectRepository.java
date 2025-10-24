package dev.promptlm.project;

import java.nio.file.Path;

interface ProjectRepository {
    Project save(Project project);

    Project findByPath(Path projectPath);
}
