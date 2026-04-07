package dev.promptlm.store.github;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;

@Configuration
@ConfigurationProperties(prefix = "promptlm.store.local")
public class StoreLocalProperties {

    private Path workspaceRoot = Path.of(System.getProperty("user.home"));

    public Path getWorkspaceRoot() {
        return workspaceRoot;
    }

    public void setWorkspaceRoot(Path workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
}
