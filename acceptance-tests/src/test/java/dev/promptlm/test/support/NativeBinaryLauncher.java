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

package dev.promptlm.test.support;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Native binary launcher for acceptance smoke tests.
 */
public final class NativeBinaryLauncher {

    public static final String WEBAPP_NATIVE_PATH_PROPERTY = "promptlm.test.webapp.native.path";
    public static final String CLI_NATIVE_PATH_PROPERTY = "promptlm.test.cli.native.path";

    private static final String DEFAULT_WEBAPP_NATIVE_PATH = "../apps/promptlm-webapp/target/promptlm-webapp";
    private static final String DEFAULT_CLI_NATIVE_PATH = "../apps/promptlm-cli/target/promptlm-cli";

    private static final Logger log = LoggerFactory.getLogger(NativeBinaryLauncher.class);

    private NativeBinaryLauncher() {
    }

    public static Path resolveRequiredWebappBinaryPath() {
        return resolveRequiredNativePath(
                WEBAPP_NATIVE_PATH_PROPERTY,
                DEFAULT_WEBAPP_NATIVE_PATH,
                "promptlm-webapp"
        );
    }

    public static Path resolveRequiredCliBinaryPath() {
        return resolveRequiredNativePath(
                CLI_NATIVE_PATH_PROPERTY,
                DEFAULT_CLI_NATIVE_PATH,
                "promptlm-cli"
        );
    }

    public static RunningProcess startWebApplication(Path userHome, int serverPort, Map<String, String> systemProperties) {
        Path binaryPath = resolveRequiredWebappBinaryPath();

        List<String> command = buildNativeCommand(binaryPath, userHome, systemProperties);
        command.add("-Dserver.port=" + serverPort);
        command.add("-Dlogging.level.org.springframework.web=DEBUG");
        command.add("-Dlogging.level.dev.promptlm=DEBUG");
        command.add("-Dserver.error.include-stacktrace=always");
        command.add("-Dserver.error.include-message=always");

        try {
            Process process = startProcess(command, userHome, null);
            startOutputLogger(process, "promptlm-native-webapp-output");
            return new RunningProcess(process, binaryPath, command);
        }
        catch (IOException e) {
            throw new IllegalStateException("Failed to start native web application binary: " + binaryPath, e);
        }
    }

    public static CommandResult runCliCommand(Path userHome,
                                              Map<String, String> systemProperties,
                                              List<String> cliArguments,
                                              Duration timeout) {
        return runCliCommand(userHome, systemProperties, cliArguments, timeout, null);
    }

    public static CommandResult runCliCommand(Path userHome,
                                              Map<String, String> systemProperties,
                                              List<String> cliArguments,
                                              Duration timeout,
                                              Path workingDirectory) {
        Path binaryPath = resolveRequiredCliBinaryPath();

        List<String> command = buildNativeCommand(binaryPath, userHome, systemProperties);
        command.addAll(cliArguments);

        try {
            Process process = startProcess(command, userHome, workingDirectory);
            String output = readOutputWithTimeout(process, timeout);
            int exitCode = process.exitValue();
            return new CommandResult(exitCode, output, binaryPath, command);
        }
        catch (IOException e) {
            throw new IllegalStateException("Failed to run native CLI command", e);
        }
    }

    private static Process startProcess(List<String> command, Path userHome, Path workingDirectory) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        if (workingDirectory != null) {
            Path normalizedWorkingDirectory = workingDirectory.toAbsolutePath().normalize();
            if (!Files.isDirectory(normalizedWorkingDirectory)) {
                throw new IllegalArgumentException("Working directory does not exist: " + normalizedWorkingDirectory);
            }
            processBuilder.directory(normalizedWorkingDirectory.toFile());
        }
        String resolvedUserHome = userHome.toAbsolutePath().normalize().toString();
        processBuilder.environment().put("HOME", resolvedUserHome);
        processBuilder.environment().putIfAbsent("USERPROFILE", resolvedUserHome);
        return processBuilder.start();
    }

    private static List<String> buildNativeCommand(Path binaryPath, Path userHome, Map<String, String> systemProperties) {
        Objects.requireNonNull(binaryPath, "binaryPath must not be null");
        Objects.requireNonNull(userHome, "userHome must not be null");

        List<String> command = new ArrayList<>();
        command.add(binaryPath.toString());
        command.add("-Duser.home=" + userHome.toAbsolutePath().normalize());

        for (Map.Entry<String, String> entry : systemProperties.entrySet()) {
            if (entry.getValue() != null) {
                command.add("-D" + entry.getKey() + "=" + entry.getValue());
            }
        }
        return command;
    }

    private static String readOutputWithTimeout(Process process, Duration timeout) {
        Duration effectiveTimeout = timeout == null ? Duration.ofMinutes(2) : timeout;
        try (var executor = Executors.newSingleThreadExecutor(r -> {
            Thread thread = new Thread(r, "promptlm-native-cli-output-reader");
            thread.setDaemon(true);
            return thread;
        })) {
            Future<String> outputFuture = executor.submit(() -> readAll(process.getInputStream()));
            boolean finished = process.waitFor(effectiveTimeout.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroy();
                if (!process.waitFor(5, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
                throw new IllegalStateException("Native CLI process timed out after " + effectiveTimeout.toSeconds() + "s");
            }
            return outputFuture.get(5, TimeUnit.SECONDS).trim();
        }
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for native CLI process", e);
        }
        catch (ExecutionException e) {
            throw new IllegalStateException("Failed reading native CLI process output", e.getCause());
        }
        catch (TimeoutException e) {
            throw new IllegalStateException("Timed out collecting native CLI output", e);
        }
    }

    private static String readAll(InputStream stream) throws IOException {
        return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    }

    private static void startOutputLogger(Process process, String threadName) {
        Thread outputThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[NATIVE-SERVER] {}", line);
                }
            }
            catch (IOException e) {
                String message = e.getMessage();
                boolean streamClosed = message != null && message.contains("Stream closed");
                if (!streamClosed) {
                    log.warn("Stopped reading native process output: {}", message, e);
                }
            }
        }, threadName);
        outputThread.setDaemon(true);
        outputThread.start();
    }

    private static Path resolveRequiredNativePath(String propertyName, String defaultPath, String artifactName) {
        String configuredPath = System.getProperty(propertyName, defaultPath);
        Path nativePath = Paths.get(configuredPath);
        if (!nativePath.isAbsolute()) {
            nativePath = Paths.get("").toAbsolutePath().resolve(nativePath).normalize();
        }

        if (!Files.isRegularFile(nativePath)) {
            throw new IllegalStateException(
                    "Required native binary for " + artifactName + " not found at '" + nativePath
                            + "'. Configure -D" + propertyName + "=<absolute-or-relative-path>."
            );
        }
        if (!Files.isExecutable(nativePath)) {
            throw new IllegalStateException(
                    "Native binary for " + artifactName + " is not executable at '" + nativePath
                            + "'. Ensure executable permissions are set and retry."
            );
        }
        return nativePath;
    }

    public static final class RunningProcess {
        private final Process process;
        private final Path binaryPath;
        private final List<String> command;

        public RunningProcess(Process process, Path binaryPath, List<String> command) {
            this.process = process;
            this.binaryPath = binaryPath;
            this.command = List.copyOf(command);
        }

        public Process process() {
            return process;
        }

        public Path binaryPath() {
            return binaryPath;
        }

        public List<String> command() {
            return command;
        }
    }

    public static final class CommandResult {
        private final int exitCode;
        private final String output;
        private final Path binaryPath;
        private final List<String> command;

        public CommandResult(int exitCode, String output, Path binaryPath, List<String> command) {
            this.exitCode = exitCode;
            this.output = output;
            this.binaryPath = binaryPath;
            this.command = List.copyOf(command);
        }

        public int exitCode() {
            return exitCode;
        }

        public String output() {
            return output;
        }

        public Path binaryPath() {
            return binaryPath;
        }

        public List<String> command() {
            return command;
        }
    }
}
