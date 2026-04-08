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

package dev.promptlm.execution.litellm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

/**
 * Starts and monitors a LiteLLM Docker container when enabled.
 */
public class LiteLlmContainerManager {

    private static final Logger LOGGER = LoggerFactory.getLogger(LiteLlmContainerManager.class);

    private final LiteLlmGatewayProperties properties;

    private final DockerAvailabilityProbe probe;

    public static final String DEFAULT_CONTAINER_PORT = "4000";

    private static final Pattern ENVIRONMENT_KEY_PATTERN = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");

    private final CommandRunner commandRunner;

    private final LiteLlmReadinessProbe readinessProbe;

    private final AtomicBoolean running = new AtomicBoolean(false);

    public LiteLlmContainerManager(LiteLlmGatewayProperties properties, DockerAvailabilityProbe probe) {
        this(properties, probe, new ProcessCommandRunner(), new LiteLlmReadinessProbe());
    }

    LiteLlmContainerManager(LiteLlmGatewayProperties properties, DockerAvailabilityProbe probe, CommandRunner commandRunner,
            LiteLlmReadinessProbe readinessProbe) {
        this.properties = properties;
        this.probe = probe;
        this.commandRunner = commandRunner;
        this.readinessProbe = readinessProbe;
    }

    /**
     * Attempts to ensure the LiteLLM container is running. Returns {@code true} when
     * LiteLLM should be considered ready for use.
     */
    public boolean ensureRunning() {
        if (!properties.getDocker().isManage()) {
            return true; // Assume external process handles lifecycle.
        }

        validateManagedConfiguration();

        if (!probe.isDockerAvailable()) {
            return false;
        }

        if (running.get()) {
            return true;
        }

        if (!ensureImageAvailable()) {
            return false;
        }

        if (!startContainer()) {
            return false;
        }

        boolean ready = waitForReadiness();
        if (ready) {
            running.set(true);
            return true;
        }

        removeContainer();
        return false;
    }

    private void validateManagedConfiguration() {
        String image = properties.resolveImage();
        if (image == null || image.isBlank()) {
            throw new IllegalStateException(
                    "LiteLLM managed container requires promptlm.gateway.litellm.version or docker.image with an immutable tag or digest");
        }

        requireImmutableImageReference(image.trim());

        if (CollectionUtils.isEmpty(properties.getEnvironment())) {
            return;
        }

        for (Map.Entry<String, String> entry : properties.getEnvironment().entrySet()) {
            String key = entry.getKey();
            if (key == null || key.isBlank()) {
                throw new IllegalStateException("LiteLLM environment key must not be blank");
            }
            if (!ENVIRONMENT_KEY_PATTERN.matcher(key).matches()) {
                throw new IllegalStateException("LiteLLM environment key '%s' is invalid".formatted(key));
            }
            if (entry.getValue() == null) {
                throw new IllegalStateException("LiteLLM environment '%s' must not be null".formatted(key));
            }
        }
    }

    private void requireImmutableImageReference(String image) {
        if (image.contains("@sha256:")) {
            return;
        }

        int lastSlash = image.lastIndexOf('/');
        int lastColon = image.lastIndexOf(':');
        if (lastColon <= lastSlash) {
            throw new IllegalStateException(
                    "LiteLLM Docker image must use an explicit immutable tag or digest; untagged image is not allowed");
        }

        String tag = image.substring(lastColon + 1);
        if ("latest".equalsIgnoreCase(tag)) {
            throw new IllegalStateException(
                    "LiteLLM Docker image must not use mutable ':latest'; configure a pinned version tag or digest");
        }
    }

    /**
     * Stops the managed container when prompted.
     */
    public void stop() {
        if (!properties.getDocker().isManage()) {
            return;
        }
        if (!running.compareAndSet(true, false)) {
            return;
        }

        removeContainer();
    }

    private boolean ensureImageAvailable() {
        String image = properties.resolveImage();
        int inspectExit = commandRunner.execute("docker", "image", "inspect", image);
        if (inspectExit == 0) {
            return true;
        }

        LOGGER.info("LiteLLM image {} is not available locally. Pulling it now.", image);
        int pullExit = commandRunner.execute("docker", "pull", image);
        if (pullExit != 0) {
            LOGGER.warn("LiteLLM gateway disabled because Docker could not pull image {}. Check registry access or set promptlm.gateway.litellm.enabled=false.", image);
            return false;
        }
        return true;
    }

    private boolean startContainer() {
        String containerName = properties.getDocker().getContainerName();
        removeContainer();

        List<String> command = new ArrayList<>();
        command.add("docker");
        command.add("run");
        command.add("-d");
        command.add("--name");
        command.add(containerName);
        command.add("-p");
        command.add(properties.getDocker().getPort() + ":" + DEFAULT_CONTAINER_PORT);

        if (properties.getDocker().getNetwork() != null && !properties.getDocker().getNetwork().isBlank()) {
            command.add("--network");
            command.add(properties.getDocker().getNetwork());
        }

        if (!CollectionUtils.isEmpty(properties.getEnvironment())) {
            for (Map.Entry<String, String> entry : properties.getEnvironment().entrySet()) {
                command.add("-e");
                command.add(entry.getKey() + "=" + entry.getValue());
            }
        }

        String image = properties.resolveImage();
        command.add(image);

        LOGGER.info("Starting LiteLLM container using image {}", image);
        int exit = commandRunner.execute(command.toArray(String[]::new));
        if (exit != 0) {
            LOGGER.warn("LiteLLM gateway disabled because Docker could not start container {} from image {} (exit code {}).", containerName,
                    image, exit);
            return false;
        }
        return true;
    }

    private boolean waitForReadiness() {
        Duration timeout = properties.getDocker().getReadinessTimeout();
        String readinessUrl = properties.getBaseUrl() + properties.getDocker().getReadinessPath();
        boolean ready = readinessProbe.waitUntilReady(readinessUrl, timeout);
        if (!ready) {
            LOGGER.warn("LiteLLM gateway disabled because container {} did not become ready at {} within {}.", properties.getDocker().getContainerName(),
                    readinessUrl, timeout);
        }
        return ready;
    }

    private void removeContainer() {
        commandRunner.execute("docker", "rm", "-f", properties.getDocker().getContainerName());
    }

    interface CommandRunner {

        int execute(String... command);
    }

    static class ProcessCommandRunner implements CommandRunner {

        @Override
        public int execute(String... command) {
            Process process = null;
            try {
                process = new ProcessBuilder(command)
                        .redirectErrorStream(true)
                        .start();

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    int outputLineCount = 0;
                    while (reader.readLine() != null) {
                        outputLineCount++;
                    }
                    if (outputLineCount > 0) {
                        LOGGER.debug("Docker command produced {} output lines (suppressed for security)", outputLineCount);
                    }
                }

                return process.waitFor();
            }
            catch (IOException ex) {
                LOGGER.info("Failed to execute Docker command: {}", ex.getMessage());
                return -1;
            }
            catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                LOGGER.info("Docker command interrupted");
                return -1;
            }
            finally {
                if (process != null) {
                    process.destroyForcibly();
                }
            }
        }
    }
}
