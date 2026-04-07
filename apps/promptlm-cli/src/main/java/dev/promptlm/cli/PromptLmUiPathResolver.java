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

package dev.promptlm.cli;

import org.springframework.stereotype.Component;

import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.CodeSource;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

@Component
public class PromptLmUiPathResolver {

    private final Path currentDirectory;
    private final Path applicationLocation;

    public PromptLmUiPathResolver() {
        this(Path.of("").toAbsolutePath().normalize(), resolveApplicationLocation());
    }

    PromptLmUiPathResolver(Path currentDirectory) {
        this(currentDirectory.toAbsolutePath().normalize(), currentDirectory.toAbsolutePath().normalize());
    }

    PromptLmUiPathResolver(Path currentDirectory, Path applicationLocation) {
        this.currentDirectory = currentDirectory.toAbsolutePath().normalize();
        this.applicationLocation = applicationLocation.toAbsolutePath().normalize();
    }

    LaunchTarget resolve(int port) {
        return resolveBundledHost(port)
                .orElseThrow(() -> new IllegalStateException(
                        "Unable to locate a bundled PromptLM web host helper (bin/" + helperExecutableName() + "). "
                                + "Runtime source-checkout fallback is disabled by architecture."));
    }

    Optional<LaunchTarget> resolveBundledHost(int port) {
        for (Path candidateRoot : candidateRoots()) {
            Path helper = candidateRoot.resolve("bin").resolve(helperExecutableName());
            if (Files.isRegularFile(helper) && Files.isExecutable(helper)) {
                return Optional.of(new LaunchTarget(
                        candidateRoot,
                        List.of(helper.toString(), "--server.port=" + port),
                        "bundled helper " + helper));
            }
        }
        return Optional.empty();
    }

    private List<Path> candidateRoots() {
        LinkedHashSet<Path> roots = new LinkedHashSet<>();
        roots.addAll(ancestors(currentDirectory));
        roots.addAll(ancestors(normalizeApplicationSearchStart(applicationLocation)));
        return new ArrayList<>(roots);
    }

    private static List<Path> ancestors(Path start) {
        List<Path> roots = new ArrayList<>();
        Path current = start;
        while (current != null) {
            roots.add(current);
            current = current.getParent();
        }
        return roots;
    }

    private static Path normalizeApplicationSearchStart(Path applicationLocation) {
        if (Files.isRegularFile(applicationLocation)) {
            Path parent = applicationLocation.getParent();
            return parent != null ? parent : applicationLocation;
        }
        return applicationLocation;
    }

    private static Path resolveApplicationLocation() {
        try {
            CodeSource codeSource = PromptLmUiPathResolver.class.getProtectionDomain().getCodeSource();
            if (codeSource != null && codeSource.getLocation() != null) {
                return Path.of(codeSource.getLocation().toURI()).toAbsolutePath().normalize();
            }
        }
        catch (URISyntaxException | RuntimeException ignored) {
            // Fall back to the current working directory when the runtime location is unavailable.
        }
        return Path.of("").toAbsolutePath().normalize();
    }

    private static String helperExecutableName() {
        return isWindows() ? "promptlm-webapp.exe" : "promptlm-webapp";
    }

    private static boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase().contains("win");
    }

    record LaunchTarget(Path workingDirectory, List<String> command, String description) {
    }
}
