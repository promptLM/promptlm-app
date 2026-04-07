package dev.promptlm.store.github;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

@Component
class GitRepositoryMetadata {

    private static final Path METADATA_PATH = Path.of(".promptlm", "metadata.json");
    private final ObjectMapper objectMapper;

    GitRepositoryMetadata(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    GitRepositoryMetadataFile read(Path repoPath) {
        Path metadataFile = ensureMetadataFile(repoPath);
        try {
            return objectMapper.readValue(metadataFile.toFile(), GitRepositoryMetadataFile.class);
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to read repository metadata", e);
        }
    }

    void write(Path repoPath, GitRepositoryMetadataFile metadataFile) {
        Path metadataPath = ensureMetadataFile(repoPath);
        try {
            objectMapper.writeValue(metadataPath.toFile(), metadataFile);
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to write repository metadata", e);
        }
    }

    private Path ensureMetadataFile(Path repoPath) {
        Path metadataPath = repoPath.resolve(METADATA_PATH).toAbsolutePath().normalize();
        if (Files.notExists(metadataPath)) {
            try {
                Files.createDirectories(metadataPath.getParent());
                Files.writeString(metadataPath, "{}", StandardOpenOption.CREATE_NEW);
            } catch (IOException e) {
                throw new RuntimeException("Failed to initialize repository metadata", e);
            }
        }
        return metadataPath;
    }
}
