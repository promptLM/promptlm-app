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

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
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
 * Shared runtime launcher for acceptance tests that need to execute packaged JAR artifacts.
 */
public final class JarApplicationLauncher {

    public static final String WEBAPP_JAR_PATH_PROPERTY = "promptlm.test.webapp.jar.path";
    public static final String CLI_JAR_PATH_PROPERTY = "promptlm.test.cli.jar.path";

    private static final String DEFAULT_WEBAPP_JAR_PATH = "../apps/promptlm-webapp/target/promptlm-webapp-0.1.0-SNAPSHOT.jar";
    private static final String DEFAULT_CLI_JAR_PATH = "../apps/promptlm-cli/target/promptlm-cli-0.1.0-SNAPSHOT.jar";

    private static final Logger log = LoggerFactory.getLogger(JarApplicationLauncher.class);

    private JarApplicationLauncher() {
    }

    public static RunningProcess startWebApplication(Path userHome, int serverPort, Map<String, String> systemProperties) {
        Path jarPath = resolveRequiredJarPath(
                WEBAPP_JAR_PATH_PROPERTY,
                DEFAULT_WEBAPP_JAR_PATH,
                "promptlm-webapp"
        );

        List<String> command = buildJavaCommand(userHome, systemProperties);
        command.add("-Dserver.port=" + serverPort);
        command.add("-Dlogging.level.org.springframework.web=DEBUG");
        command.add("-Dlogging.level.dev.promptlm=DEBUG");
        command.add("-Dserver.error.include-stacktrace=always");
        command.add("-Dserver.error.include-message=always");
        command.add("-jar");
        command.add(jarPath.toString());

        try {
            Process process = startProcess(command);
            startOutputLogger(process, "promptlm-webapp-output");
            return new RunningProcess(process, jarPath, command);
        }
        catch (IOException e) {
            throw new IllegalStateException("Failed to start web application jar: " + jarPath, e);
        }
    }

    public static CommandResult runCliCommand(Path userHome,
                                              Map<String, String> systemProperties,
                                              List<String> cliArguments,
                                              Duration timeout) {
        Path jarPath = resolveRequiredJarPath(
                CLI_JAR_PATH_PROPERTY,
                DEFAULT_CLI_JAR_PATH,
                "promptlm-cli"
        );

        List<String> command = buildJavaCommand(userHome, systemProperties);
        command.add("-jar");
        command.add(jarPath.toString());
        command.addAll(cliArguments);

        try {
            Process process = startProcess(command);
            String output = readOutputWithTimeout(process, timeout);
            int exitCode = process.exitValue();
            return new CommandResult(exitCode, output, jarPath, command);
        }
        catch (IOException e) {
            throw new IllegalStateException("Failed to run CLI command", e);
        }
    }

    private static Process startProcess(List<String> command) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        configureJavaEnvironment(processBuilder);
        return processBuilder.start();
    }

    private static List<String> buildJavaCommand(Path userHome, Map<String, String> systemProperties) {
        Objects.requireNonNull(userHome, "userHome must not be null");

        List<String> command = new ArrayList<>();
        command.add(resolveJavaCommand());
        command.add("-Djava.util.logging.ConsoleHandler.level=ALL");
        appendDebugArguments(command);
        command.add("-Duser.home=" + userHome.toAbsolutePath());

        for (Map.Entry<String, String> entry : systemProperties.entrySet()) {
            if (entry.getValue() != null) {
                command.add("-D" + entry.getKey() + "=" + entry.getValue());
            }
        }
        return command;
    }

    private static void appendDebugArguments(List<String> command) {
        String suspendDebugger = System.getProperty("jdwp.suspend",
                System.getenv().getOrDefault("JDWP_SUSPEND", "n"));
        String debugAddress = System.getProperty("jdwp.address",
                System.getenv().getOrDefault("JDWP_ADDRESS", "*:5005"));
        boolean enableDebugger = Boolean.parseBoolean(
                System.getProperty("jdwp.enable",
                        System.getenv().getOrDefault("JDWP_ENABLE", "false")));

        if (!enableDebugger) {
            return;
        }

        Integer debugPort = parseDebugPort(debugAddress);
        if (debugPort != null && !isPortAvailable(debugPort)) {
            log.warn("JDWP debug port {} is already in use. Disabling debugger for test run.", debugPort);
            return;
        }

        command.add("-agentlib:jdwp=transport=dt_socket,server=y,suspend=" + suspendDebugger + ",address=" + debugAddress);
    }

    private static String readOutputWithTimeout(Process process, Duration timeout) {
        Duration effectiveTimeout = timeout == null ? Duration.ofMinutes(2) : timeout;
        try (var executor = Executors.newSingleThreadExecutor(r -> {
            Thread thread = new Thread(r, "promptlm-cli-output-reader");
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
                throw new IllegalStateException("CLI process timed out after " + effectiveTimeout.toSeconds() + "s");
            }
            return outputFuture.get(5, TimeUnit.SECONDS).trim();
        }
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for CLI process", e);
        }
        catch (ExecutionException e) {
            throw new IllegalStateException("Failed reading CLI process output", e.getCause());
        }
        catch (TimeoutException e) {
            throw new IllegalStateException("Timed out collecting CLI output", e);
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
                    log.info("[SERVER] {}", line);
                }
            }
            catch (IOException e) {
                String message = e.getMessage();
                boolean streamClosed = message != null && message.contains("Stream closed");
                if (!streamClosed) {
                    log.warn("Stopped reading process output: {}", message, e);
                }
            }
        }, threadName);
        outputThread.setDaemon(true);
        outputThread.start();
    }

    private static Path resolveRequiredJarPath(String propertyName, String defaultPath, String artifactName) {
        String configuredPath = System.getProperty(propertyName, defaultPath);
        Path jarPath = Paths.get(configuredPath);
        if (!jarPath.isAbsolute()) {
            jarPath = Paths.get("").toAbsolutePath().resolve(jarPath).normalize();
        }
        if (!Files.isRegularFile(jarPath)) {
            throw new IllegalStateException(
                    "Required JAR for " + artifactName + " not found at '" + jarPath
                            + "'. Configure -D" + propertyName + "=<absolute-or-relative-path>."
            );
        }
        return jarPath;
    }

    private static void configureJavaEnvironment(ProcessBuilder processBuilder) {
        String javaHome = System.getProperty("java.home");
        if (javaHome == null || javaHome.isBlank()) {
            return;
        }

        processBuilder.environment().putIfAbsent("JAVA_HOME", javaHome);
        Path javaBin = Paths.get(javaHome, "bin");
        String existingPath = processBuilder.environment().getOrDefault("PATH", "");
        String javaBinPath = javaBin.toString();
        if (!existingPath.contains(javaBinPath)) {
            String separator = File.pathSeparator;
            String updatedPath = existingPath.isBlank()
                    ? javaBinPath
                    : javaBinPath + separator + existingPath;
            processBuilder.environment().put("PATH", updatedPath);
        }
    }

    private static String resolveJavaCommand() {
        String javaCommand = resolveJavaFromHome(System.getProperty("java.home"));
        if (javaCommand != null) {
            return javaCommand;
        }
        javaCommand = resolveJavaFromHome(System.getenv("JAVA_HOME"));
        if (javaCommand != null) {
            return javaCommand;
        }
        return "java";
    }

    private static String resolveJavaFromHome(String javaHome) {
        if (javaHome == null || javaHome.isBlank()) {
            return null;
        }
        Path javaPath = Paths.get(javaHome, "bin", isWindows() ? "java.exe" : "java");
        return Files.isExecutable(javaPath) ? javaPath.toString() : null;
    }

    private static boolean isWindows() {
        String osName = System.getProperty("os.name", "");
        return osName.toLowerCase().contains("win");
    }

    private static Integer parseDebugPort(String debugAddress) {
        if (debugAddress == null || debugAddress.isBlank()) {
            return null;
        }
        String trimmed = debugAddress.trim();
        int colonIndex = trimmed.lastIndexOf(':');
        String portToken = colonIndex >= 0 ? trimmed.substring(colonIndex + 1) : trimmed;
        try {
            return Integer.parseInt(portToken);
        }
        catch (NumberFormatException e) {
            return null;
        }
    }

    private static boolean isPortAvailable(int port) {
        try (var socket = new java.net.ServerSocket(port)) {
            socket.setReuseAddress(true);
            return true;
        }
        catch (IOException e) {
            return false;
        }
    }

    public static final class RunningProcess {
        private final Process process;
        private final Path jarPath;
        private final List<String> command;

        public RunningProcess(Process process, Path jarPath, List<String> command) {
            this.process = process;
            this.jarPath = jarPath;
            this.command = List.copyOf(command);
        }

        public Process process() {
            return process;
        }

        public Path jarPath() {
            return jarPath;
        }

        public List<String> command() {
            return command;
        }
    }

    public static final class CommandResult {
        private final int exitCode;
        private final String output;
        private final Path jarPath;
        private final List<String> command;

        public CommandResult(int exitCode, String output, Path jarPath, List<String> command) {
            this.exitCode = exitCode;
            this.output = output;
            this.jarPath = jarPath;
            this.command = List.copyOf(command);
        }

        public int exitCode() {
            return exitCode;
        }

        public String output() {
            return output;
        }

        public Path jarPath() {
            return jarPath;
        }

        public List<String> command() {
            return command;
        }
    }
}
